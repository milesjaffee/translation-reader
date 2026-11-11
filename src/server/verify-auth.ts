import type { NextFunction, Request, Response } from 'express';
import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

import { firebaseConfig } from '../app/firebase/firebase.config';

/**
 * Express middleware: rejects requests without a valid Firebase ID token in
 * `Authorization: Bearer <token>`. Verification only needs the project id
 * (tokens are checked against Google's public certs), so no service account.
 */
export async function requireUser(req: Request, res: Response, next: NextFunction) {
  const token = /^Bearer (.+)$/.exec(req.headers.authorization ?? '')?.[1];
  if (!token) {
    res.status(401).json({ detail: 'Sign in to use Cratylus.' });
    return;
  }
  try {
    if (!getApps().length) {
      initializeApp({ projectId: firebaseConfig.projectId });
    }
    res.locals['uid'] = (await getAuth().verifyIdToken(token)).uid;
    next();
  } catch {
    res.status(401).json({ detail: 'Your session has expired. Sign in again.' });
  }
}
