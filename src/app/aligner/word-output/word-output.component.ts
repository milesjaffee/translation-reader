import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import { AlignedWord, Side } from '../alignment.model';

export interface HoveredWord {
  side: Side;
  /** 1-based index within its side. */
  idx: number;
}

/**
 * Renders one side of an alignment as hoverable word spans. Words on this
 * side get highlighted when they are hovered, or when they are matched by
 * the hovered word on the other side.
 */
@Component({
  selector: 'ate-word-output',
  templateUrl: './word-output.component.html',
  styleUrl: './word-output.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WordOutputComponent {
  side = input.required<Side>();
  words = input.required<AlignedWord[]>();
  /** Words on the other side, used to resolve a hovered word's matches. */
  otherWords = input.required<AlignedWord[]>();
  hovered = input<HoveredWord | null>(null);

  hover = output<HoveredWord | null>();

  highlighted = computed(() => {
    const hovered = this.hovered();
    if (!hovered) {
      return new Set<number>();
    }
    if (hovered.side === this.side()) {
      return new Set([hovered.idx]);
    }
    return new Set(this.otherWords()[hovered.idx - 1]?.match ?? []);
  });

  titleOf(w: AlignedWord): string {
    const parts: string[] = [];
    if (w.latin) parts.push(w.latin);
    if (w.meaning?.length) parts.push(w.meaning.join(', '));
    if (w.footnote) parts.push(w.footnote);
    return parts.join(' — ');
  }
}
