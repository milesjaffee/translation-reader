import { Routes } from '@angular/router';

import { authGuard, guestGuard } from './firebase/auth.guards';
import { HomeComponent } from './home/home.component';
import { PlaceholderPageComponent } from './placeholder-page/placeholder-page.component';

// Pages that use Firestore are lazy-loaded so its SDK stays out of the initial bundle.
export const routes: Routes = [
  { path: '', component: HomeComponent, title: 'Cratylus' },
  {
    path: 'translate',
    loadComponent: () => import('./aligner/aligner.component').then((m) => m.AlignerComponent),
    canActivate: [authGuard],
    title: 'Translate · Cratylus',
  },
  {
    path: 'saved',
    loadComponent: () => import('./saved-page/saved-page.component').then((m) => m.SavedPageComponent),
    canActivate: [authGuard],
    title: 'Saved · Cratylus',
  },
  {
    path: 'you',
    loadComponent: () => import('./user-page/user-page.component').then((m) => m.UserPageComponent),
    canActivate: [authGuard],
    title: 'You · Cratylus',
  },
  {
    path: 'login',
    loadComponent: () => import('./login/login.component').then((m) => m.LoginComponent),
    canActivate: [guestGuard],
    title: 'Sign in · Cratylus',
  },
  {
    path: 't/:id',
    loadComponent: () =>
      import('./translation-page/translation-page.component').then((m) => m.TranslationPageComponent),
    title: 'Translation · Cratylus',
  },
  // TODO: real pricing page.
  { path: 'pricing', component: PlaceholderPageComponent, data: { title: 'Pricing' }, title: 'Pricing · Cratylus' },
  { path: '**', redirectTo: '' },
];
