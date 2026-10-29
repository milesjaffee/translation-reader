import { inject, Injectable } from '@angular/core';
import { LocalStorage } from '@ngx-templates/shared/services';

import { AlignmentResult, AlignRequest } from '../translation-output/alignment.model';

export interface SavedTranslation {
  id: string;
  ownerUid: string;
  createdAt: number;
  request: AlignRequest;
  result: AlignmentResult;
}

export type NewSavedTranslation = Omit<SavedTranslation, 'id' | 'createdAt'>;

/**
 * Persistence for users' created translations. Provided in app.config.ts;
 * swap the implementation for a Firestore-backed one when Firebase is set up.
 */
export abstract class TranslationStore {
  abstract save(translation: NewSavedTranslation): Promise<SavedTranslation>;
  abstract list(ownerUid: string): Promise<SavedTranslation[]>;
  abstract get(id: string): Promise<SavedTranslation | null>;
  abstract delete(id: string): Promise<void>;
}

const LS_KEY = 'tr-saved-translations';

/**
 * Development stand-in for a Firestore `translations` collection,
 * backed by the browser's local storage.
 */
@Injectable()
export class LocalTranslationStore extends TranslationStore {
  private _storage = inject(LocalStorage);

  private _all(): SavedTranslation[] {
    return (this._storage.getJSON(LS_KEY) as SavedTranslation[] | null) || [];
  }

  async save(translation: NewSavedTranslation): Promise<SavedTranslation> {
    const saved: SavedTranslation = {
      ...translation,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
    };
    this._storage.setJSON(LS_KEY, [saved, ...this._all()]);
    return saved;
  }

  async list(ownerUid: string): Promise<SavedTranslation[]> {
    return this._all().filter((t) => t.ownerUid === ownerUid);
  }

  async get(id: string): Promise<SavedTranslation | null> {
    return this._all().find((t) => t.id === id) ?? null;
  }

  async delete(id: string): Promise<void> {
    this._storage.setJSON(
      LS_KEY,
      this._all().filter((t) => t.id !== id),
    );
  }
}
