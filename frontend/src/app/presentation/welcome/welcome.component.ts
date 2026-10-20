import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, inject, viewChild } from '@angular/core';
import { LogoutUseCase } from '../../application/logout.use-case';
import { SessionStore } from '../../application/ports/session-store';

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.component.html',
  styleUrl: './welcome.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WelcomeComponent implements AfterViewInit {
  private readonly sessions = inject(SessionStore);
  private readonly logout = inject(LogoutUseCase);
  private readonly heading = viewChild.required<ElementRef<HTMLElement>>('heading');

  protected displayName(): string {
    return this.sessions.session()?.displayName ?? '';
  }

  ngAfterViewInit(): void {
    this.heading().nativeElement.focus();
  }

  protected onLogout(): void {
    this.logout.execute();
  }
}
