import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../firebase/auth.service';
import { Quota, TranslationStore } from '../firebase/translation-store';

@Component({
  selector: 'cr-user-page',
  imports: [RouterLink],
  template: `
    @if (auth.user(); as user) {
      <p class="hello">Hello, <strong>{{ user.displayName }}</strong></p>
      <p class="plan">
        <span>You are currently on the <strong>Casual</strong> plan</span>
        <a class="cr-button" routerLink="/pricing">Upgrade</a>
      </p>
      @if (quota(); as q) {
        <p>
          <a routerLink="/saved">{{ q.used }} of {{ q.limit }}</a> saved translations used.
        </p>
      }
      @if (user.email) {
        <p class="email">Signed in as {{ user.email }}</p>
      }
      <button class="cr-button cr-button--outline" type="button" (click)="signOut()">
        Sign out
      </button>
    }
  `,
  styles: `
    :host {
      display: block;
      font-size: clamp(1.1rem, 2.8vw, 2.125rem);
    }

    p {
      margin: 0 0 1.25rem;
    }

    .plan {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.5rem 1.75rem;
    }

    a:not(.cr-button) {
      color: var(--cr-blue);
    }

    .email {
      font-size: 0.65em;
      font-style: italic;
    }

    .cr-button--outline {
      font-size: 0.75em;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserPageComponent implements OnInit {
  auth = inject(AuthService);
  private _store = inject(TranslationStore);
  private _router = inject(Router);

  quota = signal<Quota | null>(null);

  async ngOnInit() {
    const user = this.auth.user();
    if (user) {
      this.quota.set(await this._store.quota(user.uid));
    }
  }

  async signOut() {
    await this.auth.signOut();
    await this._router.navigateByUrl('/');
  }
}
