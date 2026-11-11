import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideWindow } from '@ngx-templates/shared/services';
import { AppComponent } from './app.component';
import { AuthService } from './firebase/auth.service';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideWindow(),
        provideRouter([]),
        // Keep Firebase out of unit tests.
        { provide: AuthService, useValue: { user: signal(null) } },
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });
});
