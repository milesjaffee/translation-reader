import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from './auth.service';

/** Only signed-in users; everyone else goes to /login and comes back afterwards. */
export const authGuard: CanActivateFn = async (_route, state) => {
  const router = inject(Router);
  if (await inject(AuthService).currentUser()) {
    return true;
  }
  return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};

/** Keeps signed-in users off /login. */
export const guestGuard: CanActivateFn = async (route) => {
  const router = inject(Router);
  if (!(await inject(AuthService).currentUser())) {
    return true;
  }
  return router.parseUrl(safeReturnUrl(route.queryParamMap.get('returnUrl')));
};

/** Only same-site paths, so `?returnUrl=` can't bounce users to another origin. */
export function safeReturnUrl(url: string | null): string {
  return url && url.startsWith('/') && !url.startsWith('//') ? url : '/translate';
}
