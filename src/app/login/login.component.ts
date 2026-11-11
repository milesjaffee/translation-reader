import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { safeReturnUrl } from '../firebase/auth.guards';
import { authErrorMessage, AuthService } from '../firebase/auth.service';

type Mode = 'signin' | 'signup';

@Component({
  selector: 'cr-login',
  imports: [ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  private _auth = inject(AuthService);
  private _router = inject(Router);

  /** Query params (bound via withComponentInputBinding). */
  returnUrl = input<string | null>(null);
  mode = input<Mode | null>(null);

  private _modeOverride = signal<Mode | null>(null);
  current = computed(() => this._modeOverride() ?? (this.mode() === 'signup' ? 'signup' : 'signin'));

  busy = signal(false);
  error = signal('');
  notice = signal('');

  form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: Validators.maxLength(60) }),
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(6)] }),
  });

  setMode(mode: Mode) {
    this._modeOverride.set(mode);
    this.error.set('');
    this.notice.set('');
  }

  async google() {
    await this._run(() => this._auth.signInWithGoogle());
  }

  async submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { name, email, password } = this.form.getRawValue();
    await this._run(() =>
      this.current() === 'signup'
        ? this._auth.signUpWithEmail(name.trim(), email, password)
        : this._auth.signInWithEmail(email, password),
    );
  }

  async forgotPassword() {
    const email = this.form.controls.email.value;
    this.error.set('');
    this.notice.set('');
    if (!email || this.form.controls.email.invalid) {
      this.error.set('Enter your email address above first.');
      return;
    }
    try {
      await this._auth.resetPassword(email);
      this.notice.set(`If ${email} has an account, a password reset link is on its way.`);
    } catch (e) {
      this.error.set(authErrorMessage(e));
    }
  }

  private async _run(signIn: () => Promise<void>) {
    if (this.busy()) {
      return;
    }
    this.busy.set(true);
    this.error.set('');
    this.notice.set('');
    try {
      await signIn();
      await this._router.navigateByUrl(safeReturnUrl(this.returnUrl()));
    } catch (e) {
      this.error.set(authErrorMessage(e));
    } finally {
      this.busy.set(false);
    }
  }
}
