import { TestBed } from '@angular/core/testing';
import { screen, fireEvent } from '@testing-library/dom';
import { SessionStore } from '../../application/ports/session-store';
import { AuthTokenStore } from '../../infrastructure/auth/auth-token-store';
import { WelcomeComponent } from './welcome.component';

describe('WelcomeComponent', () => {
  let store: AuthTokenStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [WelcomeComponent],
      providers: [{ provide: SessionStore, useExisting: AuthTokenStore }],
    });
    store = TestBed.inject(AuthTokenStore);
    store.open({ accessToken: 'jwt', displayName: 'Titular' });
  });

  it('muestra el saludo con el nombre del titular y recibe el foco', () => {
    const fixture = TestBed.createComponent(WelcomeComponent);
    fixture.detectChanges();

    const heading = screen.getByRole('heading', { level: 1, name: '¡Bienvenido, Titular!' });
    expect(heading.getAttribute('tabindex')).toBe('-1');
    expect(document.activeElement).toBe(heading);
  });

  it('cierra la sesión al pulsar "Cerrar sesión"', () => {
    const fixture = TestBed.createComponent(WelcomeComponent);
    fixture.detectChanges();

    fireEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }));

    expect(store.session()).toBeNull();
  });
});
