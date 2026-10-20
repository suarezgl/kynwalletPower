import { TestBed } from '@angular/core/testing';
import { fireEvent, screen } from '@testing-library/dom';
import axe from 'axe-core';
import { of } from 'rxjs';
import { App } from './app';
import { AuthGateway } from './application/ports/auth-gateway';
import { SessionStore } from './application/ports/session-store';
import { AuthTokenStore } from './infrastructure/auth/auth-token-store';

describe('App', () => {
  let login: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    login = vi.fn();
    TestBed.configureTestingModule({
      imports: [App],
      providers: [
        { provide: AuthGateway, useValue: { login } },
        { provide: SessionStore, useExisting: AuthTokenStore },
      ],
    });
  });

  it('muestra el formulario de inicio de sesión sin sesión activa', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    expect(screen.getByRole('heading', { level: 1, name: 'Bienvenido de nuevo' })).toBeTruthy();
    // The brand copy is hidden below 960 px via CSS, and jsdom does not evaluate media queries.
    expect(screen.getByText('Tu dinero, sin fronteras.').tagName).toBe('H2');
  });

  it('pasa a la bienvenida tras un inicio de sesión correcto', async () => {
    login.mockReturnValueOnce(
      of({ status: 'authenticated', session: { accessToken: 'jwt', displayName: 'Titular' } }),
    );
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    fireEvent.input(screen.getByLabelText('Correo electrónico'), { target: { value: 'demo@kynwallet.test' } });
    fireEvent.input(screen.getByLabelText('Contraseña'), { target: { value: 'una-contraseña-larga-1' } });
    fireEvent.submit(document.querySelector('form')!);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(screen.getByRole('heading', { level: 1, name: '¡Bienvenido, Titular!' })).toBeTruthy();
  });

  it('la vista de login no tiene incumplimientos WCAG 2.2 AA detectables en DOM', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const result = await axe.run(fixture.nativeElement as HTMLElement, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] },
      rules: { 'color-contrast': { enabled: false } },
    });

    expect(result.violations.map((violation) => violation.id)).toEqual([]);
  });
});
