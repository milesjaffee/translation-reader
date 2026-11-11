import { ChangeDetectionStrategy, Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { DatePipe, LowerCasePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { SwitchComponent } from '@ngx-templates/shared/switch';
import { ToastsService } from '@ngx-templates/shared/toasts';
import { WINDOW } from '@ngx-templates/shared/services';

import { AuthService } from '../firebase/auth.service';
import {
  SavedTranslation,
  SharedTranslation,
  Sharing,
  SOURCE_NOTE_MAX,
  TranslationStore,
} from '../firebase/translation-store';
import { TranslationOutputComponent } from '../translation-output/translation-output.component';

type View =
  | { kind: 'loading' }
  | { kind: 'missing' }
  | { kind: 'owner'; translation: SavedTranslation }
  | { kind: 'public'; translation: SharedTranslation };

/** One translation: its owner gets the sharing controls, everyone else the public copy. */
@Component({
  selector: 'cr-translation-page',
  imports: [RouterLink, DatePipe, LowerCasePipe, SwitchComponent, TranslationOutputComponent],
  templateUrl: './translation-page.component.html',
  styleUrl: './translation-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TranslationPageComponent implements OnInit {
  private _store = inject(TranslationStore);
  private _toasts = inject(ToastsService);
  private _router = inject(Router);
  private _window = inject(WINDOW);
  auth = inject(AuthService);

  /** Route param. */
  id = input.required<string>();

  view = signal<View>({ kind: 'loading' });
  saving = signal(false);
  error = signal('');
  confirmDelete = signal(false);
  note = signal('');
  /** Bumped to re-create the switches (they keep their own state) after a failed save. */
  rev = signal(0);

  readonly noteMax = SOURCE_NOTE_MAX;

  /** The content both views render. */
  content = computed(() => {
    const v = this.view();
    return v.kind === 'owner' || v.kind === 'public' ? v.translation : null;
  });

  /** Named sharing needs an Auth profile name (the rules check the token). */
  canShareNamed = computed(() => !!this.auth.user()?.profileName);

  async ngOnInit() {
    const user = await this.auth.currentUser();
    const owned = user ? await this._store.get(this.id()) : null;
    if (owned) {
      this.note.set(owned.sourceNote);
      this.view.set({ kind: 'owner', translation: owned });
      return;
    }
    const shared = await this._store.getShared(this.id());
    this.view.set(shared ? { kind: 'public', translation: shared } : { kind: 'missing' });
  }

  setShared(shared: boolean) {
    this._update({ shared });
  }

  setAnonymous(anonymous: boolean) {
    this._update({ anonymous });
  }

  saveNote() {
    const sourceNote = this.note().trim().slice(0, SOURCE_NOTE_MAX);
    const v = this.view();
    if (v.kind === 'owner' && sourceNote !== v.translation.sourceNote) {
      this._update({ sourceNote });
    }
  }

  async copyLink() {
    try {
      await this._window.navigator.clipboard.writeText(this._window.location.href);
      this._toasts.create('Link copied');
    } catch {
      this._toasts.create('Couldn’t copy. Copy the address bar instead.');
    }
  }

  async delete() {
    const v = this.view();
    const user = this.auth.user();
    if (v.kind !== 'owner' || !user) {
      return;
    }
    if (!this.confirmDelete()) {
      this.confirmDelete.set(true);
      return;
    }
    this.saving.set(true);
    try {
      await this._store.delete(user.uid, v.translation);
      await this._router.navigateByUrl('/saved');
    } catch (e) {
      this.error.set(`Couldn’t delete: ${e instanceof Error ? e.message : e}`);
      this.saving.set(false);
    }
  }

  private async _update(change: Partial<Sharing>) {
    const v = this.view();
    const user = this.auth.user();
    if (v.kind !== 'owner' || !user || this.saving()) {
      return;
    }
    const t = v.translation;
    const next: Sharing = {
      shared: t.shared,
      anonymous: this.canShareNamed() ? t.anonymous : true,
      sourceNote: t.sourceNote,
      ...change,
    };
    this.saving.set(true);
    this.error.set('');
    try {
      await this._store.updateSharing(t, next, user.profileName);
      this.view.set({ kind: 'owner', translation: { ...t, ...next } });
    } catch (e) {
      this.error.set(`Couldn’t update sharing: ${e instanceof Error ? e.message : e}`);
      this.rev.update((r) => r + 1);
    } finally {
      this.saving.set(false);
    }
  }
}
