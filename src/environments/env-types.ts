export interface Environment {
  /** Base URL of the Express API in src/server.ts. Empty = same origin. */
  apiBaseUrl: string;
  /**
   * Use the local Auth/Firestore emulators (`firebase emulators:start --only auth,firestore`)
   * instead of the real project. Start the server with FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099
   * so /api/align accepts emulator tokens.
   */
  useFirebaseEmulators: boolean;
}
