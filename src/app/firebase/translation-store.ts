import { inject, Injectable } from '@angular/core';
import {
  collection,
  connectFirestoreEmulator,
  doc,
  DocumentData,
  DocumentReference,
  DocumentSnapshot,
  Firestore,
  getDoc,
  getFirestore,
  getDocs,
  increment,
  limit,
  limitToLast,
  orderBy,
  query,
  QueryConstraint,
  QueryDocumentSnapshot,
  serverTimestamp,
  startAfter,
  Timestamp,
  where,
  writeBatch,
} from 'firebase/firestore';

import { environment } from '../../environments/environment';
import { FIREBASE_APP } from './firebase.providers';

import { AlignmentResult, AlignRequest } from '../translation-output/alignment.model';

/** Saved translations allowed on the Casual plan. Mirrored in firestore.rules. */
export const CASUAL_LIMIT = 50;

export const SOURCE_NOTE_MAX = 140;

export interface Sharing {
  shared: boolean;
  /** Hide the owner's name on the public page. */
  anonymous: boolean;
  /** Owner's note on where the text comes from, shown on the public page. */
  sourceNote: string;
}

/** A translation as its owner sees it. */
export interface SavedTranslation extends Sharing {
  id: string;
  ownerUid: string;
  /** Milliseconds since the epoch. */
  createdAt: number;
  request: AlignRequest;
  result: AlignmentResult;
}

/** The public copy behind a share link. Carries no owner uid. */
export interface SharedTranslation {
  id: string;
  createdAt: number;
  request: AlignRequest;
  result: AlignmentResult;
  sourceNote: string;
  /** The owner's profile name, or null when shared anonymously. */
  authorName: string | null;
}

export interface Quota {
  plan: 'casual';
  used: number;
  limit: number;
}

/** Thrown by `save` when the user is at their plan's limit. */
export class QuotaExceededError extends Error {
  constructor() {
    super(`You've reached the Casual plan's ${CASUAL_LIMIT} saved translations.`);
  }
}

/**
 * Persistence for users' saved translations. Only lazy-loaded pages inject it,
 * which keeps the Firestore SDK out of the initial bundle.
 */
@Injectable({ providedIn: 'root', useFactory: () => new FirestoreTranslationStore() })
export abstract class TranslationStore {
  abstract save(uid: string, request: AlignRequest, result: AlignmentResult): Promise<string>;
  /** The signed-in owner's translation; `null` if it doesn't exist or isn't theirs. */
  abstract get(id: string): Promise<SavedTranslation | null>;
  /** The public copy of a shared translation; `null` if it isn't shared. */
  abstract getShared(id: string): Promise<SharedTranslation | null>;
  abstract delete(uid: string, translation: SavedTranslation): Promise<void>;
  /**
   * Change sharing settings, publishing or withdrawing the public copy to match.
   * `authorName` is the owner's Auth profile name (required by the rules when
   * sharing non-anonymously).
   */
  abstract updateSharing(translation: SavedTranslation, sharing: Sharing, authorName: string | null): Promise<void>;
  abstract quota(uid: string): Promise<Quota>;
  /** One page of the user's translations, newest first. `pageIndex` is 0-based. */
  abstract page(uid: string, pageIndex: number, pageSize: number, pageCount: number): Promise<SavedTranslation[]>;
}

/**
 * Data model (enforced by firestore.rules):
 * - `translations/{id}`: a SavedTranslation minus `id`. Owner-only.
 * - `shares/{id}`: a SharedTranslation minus `id`, present exactly while the
 *   translation is shared. Readable by anyone with the id.
 * - `users/{uid}`: `{ plan, savedCount, lastSavedId, lastDeletedId }`. Every
 *   create/delete of a translation must update `savedCount` in the same batch,
 *   which is how the rules enforce CASUAL_LIMIT.
 */
export class FirestoreTranslationStore extends TranslationStore {
  private _db = connectEmulator(getFirestore(inject(FIREBASE_APP)));
  /** Last document of each page already fetched, per user, for `startAfter`. */
  private _pageEnds = new Map<string, DocumentSnapshot[]>();

  private _translations = () => collection(this._db, 'translations');
  private _shareDoc = (id: string) => doc(this._db, 'shares', id);
  private _userDoc = (uid: string) => doc(this._db, 'users', uid);

  async save(uid: string, request: AlignRequest, result: AlignmentResult): Promise<string> {
    const userSnap = await getDoc(this._userDoc(uid));
    const used = (userSnap.data()?.['savedCount'] as number | undefined) ?? 0;
    if (used >= CASUAL_LIMIT) {
      throw new QuotaExceededError();
    }

    const ref = doc(this._translations());
    const batch = writeBatch(this._db);
    batch.set(ref, {
      ownerUid: uid,
      createdAt: serverTimestamp(),
      // Firestore rejects `undefined` field values.
      request: stripUndefined(request),
      result: stripUndefined(result),
      shared: false,
      anonymous: true,
      sourceNote: '',
    });
    batch.set(
      this._userDoc(uid),
      userSnap.exists()
        ? { savedCount: increment(1), lastSavedId: ref.id }
        : { plan: 'casual', savedCount: 1, lastSavedId: ref.id },
      { merge: true },
    );
    try {
      await batch.commit();
    } catch (e) {
      // A race with another tab can still trip the rules' limit check.
      if ((e as { code?: string }).code === 'permission-denied' && used + 1 >= CASUAL_LIMIT) {
        throw new QuotaExceededError();
      }
      throw e;
    }
    this._pageEnds.delete(uid);
    return ref.id;
  }

  async get(id: string): Promise<SavedTranslation | null> {
    const snap = await readOrNull(doc(this._translations(), id));
    return snap ? fromDoc(snap.id, snap.data()) : null;
  }

  async getShared(id: string): Promise<SharedTranslation | null> {
    const snap = await readOrNull(this._shareDoc(id));
    if (!snap) {
      return null;
    }
    const data = snap.data();
    return {
      id: snap.id,
      createdAt: (data['createdAt'] as Timestamp).toMillis(),
      request: data['request'],
      result: data['result'],
      sourceNote: data['sourceNote'] ?? '',
      authorName: data['authorName'] ?? null,
    };
  }

  async delete(uid: string, translation: SavedTranslation): Promise<void> {
    const batch = writeBatch(this._db);
    batch.delete(doc(this._translations(), translation.id));
    // Deleting a missing doc is a no-op, so this also covers stale `shared` state.
    batch.delete(this._shareDoc(translation.id));
    batch.update(this._userDoc(uid), { savedCount: increment(-1), lastDeletedId: translation.id });
    await batch.commit();
    this._pageEnds.delete(uid);
  }

  async updateSharing(translation: SavedTranslation, sharing: Sharing, authorName: string | null): Promise<void> {
    const ref = doc(this._translations(), translation.id);
    const batch = writeBatch(this._db);
    batch.update(ref, { ...sharing });
    if (sharing.shared) {
      // The rules require an exact copy, so copy the stored values rather than
      // our converted ones (createdAt in millis would lose precision).
      const stored = (await getDoc(ref)).data()!;
      batch.set(this._shareDoc(translation.id), {
        request: stored['request'],
        result: stored['result'],
        createdAt: stored['createdAt'],
        sourceNote: sharing.sourceNote,
        authorName: sharing.anonymous ? null : authorName,
      });
    } else {
      batch.delete(this._shareDoc(translation.id));
    }
    await batch.commit();
  }

  async quota(uid: string): Promise<Quota> {
    const snap = await getDoc(this._userDoc(uid));
    return { plan: 'casual', used: (snap.data()?.['savedCount'] as number | undefined) ?? 0, limit: CASUAL_LIMIT };
  }

  async page(uid: string, pageIndex: number, pageSize: number, pageCount: number): Promise<SavedTranslation[]> {
    const q = (...constraints: QueryConstraint[]) =>
      query(this._translations(), where('ownerUid', '==', uid), orderBy('createdAt', 'desc'), ...constraints);
    const ends = this._pageEnds.get(uid) ?? [];
    this._pageEnds.set(uid, ends);
    const cursor = pageIndex > 0 ? ends[pageIndex - 1] : undefined;

    if (!cursor && pageIndex > 0 && pageIndex === pageCount - 1) {
      // Jumping straight to the last page: take its items from the end.
      const total = (await this.quota(uid)).used;
      const snap = await getDocs(q(limitToLast(Math.max(1, total - pageIndex * pageSize))));
      return snap.docs.map((d) => fromDoc(d.id, d.data()));
    }

    // Without a cursor, read everything up to this page (at most 50 docs on Casual)
    // and remember where each page ends.
    const snap = await getDocs(cursor ? q(startAfter(cursor), limit(pageSize)) : q(limit((pageIndex + 1) * pageSize)));
    if (cursor) {
      ends[pageIndex] = snap.docs[snap.docs.length - 1] ?? cursor;
    } else {
      for (let p = 0; p <= pageIndex && p * pageSize < snap.docs.length; p++) {
        ends[p] = snap.docs[Math.min((p + 1) * pageSize, snap.docs.length) - 1];
      }
    }
    const docs = cursor ? snap.docs : snap.docs.slice(pageIndex * pageSize);
    return docs.map((d) => fromDoc(d.id, d.data()));
  }
}

function connectEmulator(db: Firestore): Firestore {
  if (environment.useFirebaseEmulators) {
    connectFirestoreEmulator(db, '127.0.0.1', 8080);
  }
  return db;
}

function fromDoc(id: string, data: DocumentData): SavedTranslation {
  const createdAt = data['createdAt'] as Timestamp | null;
  return {
    id,
    ownerUid: data['ownerUid'],
    // A just-written serverTimestamp reads back as null from the local cache.
    createdAt: createdAt ? createdAt.toMillis() : Date.now(),
    request: data['request'],
    result: data['result'],
    shared: data['shared'] ?? false,
    anonymous: data['anonymous'] ?? true,
    sourceNote: data['sourceNote'] ?? '',
  };
}

/** Reads a doc, treating "missing" and "not yours to read" alike. */
async function readOrNull(ref: DocumentReference): Promise<QueryDocumentSnapshot | null> {
  try {
    const snap = await getDoc(ref);
    return snap.exists() ? (snap as QueryDocumentSnapshot) : null;
  } catch (e) {
    if ((e as { code?: string }).code === 'permission-denied') {
      return null;
    }
    throw e;
  }
}

function stripUndefined<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}
