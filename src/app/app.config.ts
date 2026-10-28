import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideClientHydration } from '@angular/platform-browser';
import { provideWindow } from '@ngx-templates/shared/services';
import { provideFetchApi } from '@ngx-templates/shared/fetch';

import { LocalTranslationStore, TranslationStore } from './firebase/translation-store';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideClientHydration(),
    provideWindow(),
    provideFetchApi(),
    // TODO(firebase): replace with a Firestore-backed TranslationStore.
    { provide: TranslationStore, useClass: LocalTranslationStore },
  ],
};
