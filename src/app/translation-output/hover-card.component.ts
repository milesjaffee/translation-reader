import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { AlignedWord } from './alignment.model';

export function hasCardContent(w: AlignedWord): boolean {
  return !!(w.latin || w.meaning?.length || w.footnote);
}

/** Transliteration, possible meanings and footnote for the hovered word. */
@Component({
  selector: 'cr-hover-card',
  template: `
    @if (word().latin) {
      <div class="latin">{{ word().latin }}</div>
    }
    @if (word().meaning.length) {
      <ul class="meanings">
        @for (m of word().meaning; track $index) {
          <li>{{ m }}</li>
        }
      </ul>
    }
    @if (word().footnote) {
      <div class="footnote">{{ word().footnote }}</div>
    }
  `,
  styleUrl: './hover-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HoverCardComponent {
  word = input.required<AlignedWord>();
}
