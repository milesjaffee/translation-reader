import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DatePipe, JsonPipe } from '@angular/common';
import { ButtonComponent } from '@ngx-templates/shared/button';

import { AlignerApi } from '../api/aligner-api.service';
import { AuthService } from '../firebase/auth.service';
import { SavedTranslation, TranslationStore } from '../firebase/translation-store';
import { AlignmentResult, AlignRequest } from './alignment.model';
import { HoveredWord, WordOutputComponent } from './word-output/word-output.component';

@Component({
  selector: 'ate-aligner',
  imports: [ReactiveFormsModule, ButtonComponent, WordOutputComponent, JsonPipe, DatePipe],
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
  hovered = signal<HoveredWord | null>(null);
  showRaw = signal(false);
  saved = signal<SavedTranslation[]>([]);
  savedCurrent = signal(false);

  ngOnInit() {
    this._loadSaved();
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
    this.hovered.set(null);

    try {
      this.result.set(await this._api.align(request));
      this.request.set(request);
      this.savedCurrent.set(false);
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
    if (!user || !request || !result) {
      return;
    }
    await this._store.save({ ownerUid: user.uid, request, result });
    this.savedCurrent.set(true);
    await this._loadSaved();
  }

  open(t: SavedTranslation) {
    this.setHasTranslation(!!t.request.target);
    this.form.setValue(t.request);
    this.request.set(t.request);
    this.result.set(t.result);
    this.hovered.set(null);
    this.savedCurrent.set(true);
    this.status.set('');
  }

  async remove(t: SavedTranslation) {
    await this._store.delete(t.id);
    await this._loadSaved();
  }

  private async _loadSaved() {
    const user = this._auth.user();
    this.saved.set(user ? await this._store.list(user.uid) : []);
  }
}
