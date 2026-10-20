import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { SessionStore } from './application/ports/session-store';
import { AuthLayoutComponent } from './presentation/layout/auth-layout.component';
import { LoginFormComponent } from './presentation/login/login-form.component';
import { WelcomeComponent } from './presentation/welcome/welcome.component';

@Component({
  selector: 'app-root',
  imports: [AuthLayoutComponent, LoginFormComponent, WelcomeComponent],
  styleUrl: './app.css',
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  protected readonly sessions = inject(SessionStore);
}
