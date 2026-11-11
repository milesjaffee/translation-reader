import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { DatePipe, LowerCasePipe } from '@angular/common';
import { RouterLink } from '@angular/router';

import { AuthService } from '../firebase/auth.service';
import { Quota, SavedTranslation, TranslationStore } from '../firebase/translation-store';

const PAGE_SIZE = 6;

@Component({
  selector: 'cr-saved-page',
  imports: [RouterLink, DatePipe, LowerCasePipe],
  templateUrl: './saved-page.component.html',
  styleUrl: './saved-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SavedPageComponent implements OnInit {
  private _auth = inject(AuthService);
  private _store = inject(TranslationStore);

  quota = signal<Quota | null>(null);
  items = signal<SavedTranslation[]>([]);
  pageIndex = signal(0);
  loading = signal(true);
  error = signal('');

  pageCount = computed(() => Math.max(1, Math.ceil((this.quota()?.used ?? 0) / PAGE_SIZE)));

  async ngOnInit() {
    const user = this._auth.user();
    if (!user) {
      return;
    }
    try {
      this.quota.set(await this._store.quota(user.uid));
      await this.goTo(0);
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : String(e));
      this.loading.set(false);
    }
  }

  async goTo(pageIndex: number) {
    const user = this._auth.user();
    if (!user) {
      return;
    }
    const index = Math.min(Math.max(pageIndex, 0), this.pageCount() - 1);
    this.loading.set(true);
    try {
      this.items.set(await this._store.page(user.uid, index, PAGE_SIZE, this.pageCount()));
      this.pageIndex.set(index);
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : String(e));
    } finally {
      this.loading.set(false);
    }
  }
}
