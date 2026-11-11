import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { JsonPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ButtonComponent } from '@ngx-templates/shared/button';

import { AlignerApi } from '../api/aligner-api.service';
import { AuthService } from '../firebase/auth.service';
import { CASUAL_LIMIT, QuotaExceededError, TranslationStore } from '../firebase/translation-store';
import { AlignmentResult, AlignRequest } from '../translation-output/alignment.model';
import { TranslationOutputComponent } from '../translation-output/translation-output.component';

@Component({
  selector: 'cr-aligner',
  imports: [ReactiveFormsModule, RouterLink, ButtonComponent, TranslationOutputComponent, JsonPipe],
  templateUrl: './aligner.component.html',
  styleUrl: './aligner.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AlignerComponent implements OnInit {
  private _api = inject(AlignerApi);
  private _store = inject(TranslationStore);
  private _auth = inject(AuthService);

  form = new FormGroup({
    source_lang: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(10)] }),
    source: new FormControl('', { nonNullable: true, validators: Validators.required }),
    target_lang: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(10)] }),
    target: new FormControl('', { nonNullable: true }),
  });

  /** Whether the user supplies the translation, or the server generates one. */
  hasTranslation = signal(false);
  loading = signal(false);
  status = signal('');
  request = signal<AlignRequest | null>(null);
  result = signal<AlignmentResult | null>(null);
  showRaw = signal(false);
  /** Id of the saved copy of the current result, once saved. */
  savedId = signal<string | null>(null);
  saving = signal(false);
  saveError = signal('');
  /** Saved translations used, or null until loaded. */
  used = signal<number | null>(null);
  atLimit = computed(() => (this.used() ?? 0) >= CASUAL_LIMIT);

  async ngOnInit() {
    const user = this._auth.user();
    if (user) {
      this.used.set((await this._store.quota(user.uid)).used);
    }
  }

  setHasTranslation(value: boolean) {
    this.hasTranslation.set(value);
    const target = this.form.controls.target;
    target.setValidators(value ? Validators.required : null);
    target.updateValueAndValidity();
  }

  async align() {
    if (this.form.invalid || this.loading()) {
      this.form.markAllAsTouched();
      return;
    }
    const request = this.form.getRawValue();
    if (!this.hasTranslation()) {
      request.target = '';
    }

    this.loading.set(true);
    this.status.set(this.hasTranslation() ? 'Aligning…' : 'Translating and aligning…');
    this.result.set(null);

    try {
      this.result.set(await this._api.align(request));
      this.request.set(request);
      this.savedId.set(null);
      this.saveError.set('');
      this.status.set('');
    } catch (err) {
      this.status.set(`Error: ${err instanceof Error ? err.message : err}`);
    } finally {
      this.loading.set(false);
    }
  }

  async save() {
    const user = this._auth.user();
    const request = this.request();
    const result = this.result();
    if (!user || !request || !result || this.saving()) {
      return;
    }
    this.saving.set(true);
    this.saveError.set('');
    try {
      this.savedId.set(await this._store.save(user.uid, request, result));
      this.used.update((n) => (n ?? 0) + 1);
    } catch (e) {
      if (e instanceof QuotaExceededError) {
        this.used.set(CASUAL_LIMIT);
      }
      this.saveError.set(e instanceof Error ? e.message : String(e));
    } finally {
      this.saving.set(false);
    }
  }
}
