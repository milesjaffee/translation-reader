import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Stand-in for pages that don't exist yet (title comes from route data). */
@Component({
  selector: 'cr-placeholder-page',
  template: `
    <h1>{{ title() }}</h1>
    <p>Coming soon.</p>
  `,
  styles: `
    :host {
      display: block;
      font-size: var(--cr-text);
    }

    h1 {
      margin-top: 0;
      font-size: var(--cr-title);
      font-style: italic;
      font-weight: 400;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlaceholderPageComponent {
  title = input('');
}
