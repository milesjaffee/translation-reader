import { RenderMode, ServerRoute } from '@angular/ssr';

/**
 * Firebase Auth state only exists in the browser, so pages that depend on the
 * signed-in user (or on Firestore reads made as that user) render client-side.
 */
export const serverRoutes: ServerRoute[] = [
  { path: 'translate', renderMode: RenderMode.Client },
  { path: 'saved', renderMode: RenderMode.Client },
  { path: 'you', renderMode: RenderMode.Client },
  { path: 'login', renderMode: RenderMode.Client },
  { path: 't/:id', renderMode: RenderMode.Client },
  { path: '**', renderMode: RenderMode.Server },
];
