import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import { AlignedWord, Side } from '../alignment.model';
import { HoverCardComponent, hasCardContent } from '../hover-card.component';
import { precedingSpaces } from '../layout';

export interface HoveredWord {
  side: Side;
  /** 1-based index within its side. */
  idx: number;
}

/**
 * Renders one side of an alignment as hoverable word spans. The hovered word
 * and its matches on the other side are highlighted, the rest of the hovered
 * word's sentence is marked current, and the hovered word shows a card with
 * its transliteration, meanings and footnote.
 */
@Component({
  selector: 'cr-word-output',
  imports: [HoverCardComponent],
  templateUrl: './word-output.component.html',
  styleUrl: './word-output.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WordOutputComponent {
  side = input.required<Side>();
  words = input.required<AlignedWord[]>();
  /** Words on the other side, used to resolve a hovered word's matches. */
  otherWords = input.required<AlignedWord[]>();
  /** Original text of this side, used to reproduce its spacing. */
  text = input<string | null>(null);
  hovered = input<HoveredWord | null>(null);

  hover = output<HoveredWord | null>();

  spaces = computed(() => precedingSpaces(this.text(), this.words()));

  private _hoveredWord = computed(() => {
    const hovered = this.hovered();
    if (!hovered) {
      return null;
    }
    const words = hovered.side === this.side() ? this.words() : this.otherWords();
    return words[hovered.idx - 1] ?? null;
  });

  highlighted = computed(() => {
    const hovered = this.hovered();
    if (!hovered) {
      return new Set<number>();
    }
    if (hovered.side === this.side()) {
      return new Set([hovered.idx]);
    }
    return new Set(this._hoveredWord()?.match ?? []);
  });

  currentSentence = computed(() => this._hoveredWord()?.sentence ?? null);

  /**
   * Whether a word's preceding space goes inside its span, so a run of
   * consecutive highlighted words reads as one unbroken highlight.
   */
  joined = computed(() => {
    const hl = this.highlighted();
    return this.spaces().map((space, i) => space && hl.has(i + 1) && hl.has(i));
  });

  /** 1-based index of the word on this side that shows its card, if any. */
  cardIdx = computed(() => {
    const hovered = this.hovered();
    const word = this._hoveredWord();
    return hovered?.side === this.side() && word && hasCardContent(word) ? hovered.idx : null;
  });
}
