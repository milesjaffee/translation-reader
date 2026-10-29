import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ModalOutletComponent } from '@ngx-templates/shared/modal';
import { ToastOutletComponent } from '@ngx-templates/shared/toasts';

import { HeaderComponent } from './shared/header/header.component';
import { FooterComponent } from './shared/footer/footer.component';

@Component({
  selector: 'cr-root',
  imports: [
    RouterOutlet,
    HeaderComponent,
    FooterComponent,
    ModalOutletComponent,
    ToastOutletComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {}
