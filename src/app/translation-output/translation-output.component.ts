import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';

import { AlignmentResult } from './alignment.model';
import { HoverCardComponent, hasCardContent } from './hover-card.component';
import { isNoSpaceLang } from './layout';
import { HoveredWord, WordOutputComponent } from './word-output/word-output.component';

/**
 * Side-by-side annotated alignment: source and translation with language
 * labels, cross-side hover highlighting and per-word hover cards.
 */
@Component({
  selector: 'cr-translation-output',
  imports: [WordOutputComponent, HoverCardComponent],
  templateUrl: './translation-output.component.html',
  styleUrl: './translation-output.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TranslationOutputComponent {
  result = input.required<AlignmentResult>();
  sourceLang = input.required<string>();
  targetLang = input.required<string>();
  sourceText = input<string | null>(null);
  targetText = input<string | null>(null);
  /** Shown when nothing is hovered (used by the homepage demos). */
  defaultHover = input<HoveredWord | null>(null);

  hovered = signal<HoveredWord | null>(null);
  active = computed(() => this.hovered() ?? this.defaultHover());

  /** Hovered word's card content, for the stacked (mobile) layout. */
  cardWord = computed(() => {
    const active = this.active();
    if (!active) {
      return null;
    }
    const r = this.result();
    const word = (active.side === 'source' ? r.source : r.translation)[active.idx - 1];
    return word && hasCardContent(word) ? word : null;
  });

  sourceNoSpace = computed(() => isNoSpaceLang(this.sourceLang()));
  targetNoSpace = computed(() => isNoSpaceLang(this.targetLang()));
}
