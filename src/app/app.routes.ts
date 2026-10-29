import { Routes } from '@angular/router';

import { AlignerComponent } from './aligner/aligner.component';
import { HomeComponent } from './home/home.component';
import { PlaceholderPageComponent } from './placeholder-page/placeholder-page.component';

export const routes: Routes = [
  { path: '', component: HomeComponent, title: 'Cratylus' },
  { path: 'translate', component: AlignerComponent, title: 'Translate · Cratylus' },
  // TODO: real pages. `saved` should list TranslationStore entries for the signed-in user.
  { path: 'saved', component: PlaceholderPageComponent, data: { title: 'Saved' }, title: 'Saved · Cratylus' },
  { path: 'pricing', component: PlaceholderPageComponent, data: { title: 'Pricing' }, title: 'Pricing · Cratylus' },
  { path: 'you', component: PlaceholderPageComponent, data: { title: 'You' }, title: 'You · Cratylus' },
  { path: '**', redirectTo: '' },
];
