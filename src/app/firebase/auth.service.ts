import { Injectable, signal } from '@angular/core';

export interface AppUser {
  uid: string;
  displayName: string;
}

const DEV_USER: AppUser = { uid: 'local-dev-user', displayName: 'Local dev' };

/**
 * Stub of the future Firebase Auth integration. Always signed in
 * as a fixed local user during development.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private _user = signal<AppUser | null>(DEV_USER);
  user = this._user.asReadonly();

  async signIn(): Promise<void> {
    // TODO(firebase): signInWithPopup(getAuth(), new GoogleAuthProvider())
    this._user.set(DEV_USER);
  }

  async signOut(): Promise<void> {
    // TODO(firebase): signOut(getAuth())
    this._user.set(null);
  }
}
