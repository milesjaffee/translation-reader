import { inject, Injectable, signal } from '@angular/core';
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onIdTokenChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  User,
} from 'firebase/auth';

import { FIREBASE_AUTH } from './firebase.providers';

export interface AppUser {
  uid: string;
  /** For greeting the user; falls back to their email's local part. */
  displayName: string;
  /** The Auth profile name (what shared translations show), if any. */
  profileName: string | null;
  email: string | null;
}

function toAppUser(u: User): AppUser {
  return {
    uid: u.uid,
    displayName: u.displayName || u.email?.split('@')[0] || 'reader',
    profileName: u.displayName,
    email: u.email,
  };
}

/** Firebase Auth (Google and email/password) exposed as a signal. */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private _auth = inject(FIREBASE_AUTH);
  private _user = signal<AppUser | null>(null);
  user = this._user.asReadonly();

  constructor() {
    onIdTokenChanged(this._auth, (u) => this._user.set(u ? toAppUser(u) : null));
  }

  /** Resolves once Firebase has restored (or ruled out) a persisted session. */
  ready(): Promise<void> {
    return this._auth.authStateReady();
  }

  /** The current user, after the persisted session has been restored. */
  async currentUser(): Promise<AppUser | null> {
    await this.ready();
    return this._auth.currentUser ? toAppUser(this._auth.currentUser) : null;
  }

  async signInWithGoogle(): Promise<void> {
    await signInWithPopup(this._auth, new GoogleAuthProvider());
  }

  async signInWithEmail(email: string, password: string): Promise<void> {
    await signInWithEmailAndPassword(this._auth, email, password);
  }

  async signUpWithEmail(name: string, email: string, password: string): Promise<void> {
    const cred = await createUserWithEmailAndPassword(this._auth, email, password);
    if (name) {
      await updateProfile(cred.user, { displayName: name });
      // Put the name in the ID token (firestore.rules checks it on named shares).
      // This also fires onIdTokenChanged, but with the same User object.
      await cred.user.getIdToken(true);
      this._user.set(toAppUser(cred.user));
    }
  }

  resetPassword(email: string): Promise<void> {
    return sendPasswordResetEmail(this._auth, email);
  }

  signOut(): Promise<void> {
    return signOut(this._auth);
  }

  /** A fresh Firebase ID token for authenticating calls to our own API. */
  async idToken(): Promise<string | null> {
    await this.ready();
    return (await this._auth.currentUser?.getIdToken()) ?? null;
  }
}

const AUTH_ERRORS: Record<string, string> = {
  'auth/invalid-credential': 'That email and password don’t match an account.',
  'auth/wrong-password': 'That email and password don’t match an account.',
  'auth/user-not-found': 'That email and password don’t match an account.',
  'auth/invalid-email': 'That doesn’t look like an email address.',
  'auth/missing-email': 'Enter your email address first.',
  'auth/missing-password': 'Enter a password.',
  'auth/email-already-in-use': 'An account with that email already exists. Try signing in.',
  'auth/weak-password': 'Passwords need at least 6 characters.',
  'auth/too-many-requests': 'Too many attempts. Wait a moment and try again.',
  'auth/popup-closed-by-user': 'The Google sign-in window was closed before finishing.',
  'auth/cancelled-popup-request': 'The Google sign-in window was closed before finishing.',
  'auth/popup-blocked': 'Your browser blocked the Google sign-in window. Allow popups for this site.',
  'auth/account-exists-with-different-credential':
    'That email is already registered with a different sign-in method.',
  'auth/operation-not-allowed': 'This sign-in method isn’t enabled for Cratylus yet.',
  'auth/network-request-failed': 'Couldn’t reach the sign-in service. Check your connection.',
};

/** A readable message for a Firebase Auth error. */
export function authErrorMessage(err: unknown): string {
  const code = (err as { code?: string })?.code;
  return (code && AUTH_ERRORS[code]) || (err instanceof Error ? err.message : String(err));
}
