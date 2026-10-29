import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { TranslationOutputComponent } from '../translation-output/translation-output.component';
import { COBRA_DEMO, DAODEJING_DEMO } from './demo-alignments';

@Component({
  selector: 'cr-home',
  imports: [RouterLink, TranslationOutputComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  demos = [DAODEJING_DEMO, COBRA_DEMO];
}
