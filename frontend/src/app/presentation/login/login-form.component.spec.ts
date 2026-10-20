import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { fireEvent, screen } from '@testing-library/dom';
import { Subject, of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthGateway, type AuthResult } from '../../application/ports/auth-gateway';
import { SessionStore } from '../../application/ports/session-store';
import { AuthTokenStore } from '../../infrastructure/auth/auth-token-store';
import { LoginFormComponent } from './login-form.component';

const VALID_PASSWORD = 'contraseña-de-15';

describe('LoginFormComponent', () => {
  let fixture: ComponentFixture<LoginFormComponent>;
  let login: ReturnType<typeof vi.fn>;
  let sessions: AuthTokenStore;

  function setup(result: AuthResult = { status: 'invalid-credentials' }) {
    login = vi.fn(() => of(result));
    TestBed.configureTestingModule({
      imports: [LoginFormComponent],
      providers: [
        { provide: AuthGateway, useValue: { login } },
        { provide: SessionStore, useExisting: AuthTokenStore },
      ],
    });
    fixture = TestBed.createComponent(LoginFormComponent);
    sessions = TestBed.inject(AuthTokenStore);
    fixture.detectChanges();
  }

  async function flush(): Promise<void> {
    await fixture.whenStable();
    fixture.detectChanges();
  }

  function typeInto(label: string, value: string): void {
    const input = screen.getByLabelText(label, { exact: true }) as HTMLInputElement;
    input.value = value;
    fireEvent.input(input);
  }

  function submit(): void {
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }));
  }

  beforeEach(() => {
    setup();
  });

  it('muestra el título, los campos etiquetados y el botón de envío del contrato', () => {
    expect(screen.getByRole('heading', { level: 1, name: 'Bienvenido de nuevo' })).toBeTruthy();
    expect(screen.getByRole('textbox', { name: 'Correo electrónico' })).toBeTruthy();
    expect(screen.getByLabelText('Contraseña', { exact: true })).toBeTruthy();
    expect(screen.getByRole('checkbox', { name: 'Recordarme' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Iniciar sesión' })).toBeTruthy();
  });

  it('muestra errores por campo y un resumen enlazado al enviar vacío, sin llamar al servicio', async () => {
    submit();
    await flush();

    expect(document.querySelector('#email-error')?.textContent).toContain('Ingresa tu correo electrónico');
    expect(document.querySelector('#password-error')?.textContent).toContain('Ingresa tu contraseña');
    const summary = screen.getByRole('alert', { name: 'Revisa los datos del formulario' });
    expect(summary.querySelector('a[href="#email"]')?.textContent).toContain('Ingresa tu correo electrónico');
    expect(screen.getByRole('textbox', { name: 'Correo electrónico' }).getAttribute('aria-invalid')).toBe('true');
    expect(login).not.toHaveBeenCalled();
  });

  it('valida el formato del correo y marca el campo con aria-describedby', async () => {
    typeInto('Correo electrónico', 'correo-invalido');
    submit();
    await flush();

    const email = screen.getByRole('textbox', { name: 'Correo electrónico' });
    expect(document.querySelector('#email-error')?.textContent).toContain('Ingresa un correo electrónico válido');
    expect(email.getAttribute('aria-describedby')).toContain('email-error');
  });

  it('exige una contraseña de al menos 15 caracteres', async () => {
    typeInto('Correo electrónico', 'demo@kynwallet.test');
    typeInto('Contraseña', 'corta');
    submit();
    await flush();

    expect(document.querySelector('#password-error')?.textContent).toContain('La contraseña debe tener al menos 15 caracteres');
    expect(login).not.toHaveBeenCalled();
  });

  it('envía el correo normalizado y guarda la sesión cuando las credenciales son válidas', async () => {
    login.mockReturnValueOnce(of({ status: 'authenticated', session: { accessToken: 'jwt', displayName: 'Titular' } }));
    typeInto('Correo electrónico', '  DEMO@kynwallet.test ');
    typeInto('Contraseña', VALID_PASSWORD);
    submit();
    await flush();

    expect(login).toHaveBeenCalledWith({ email: 'demo@kynwallet.test', password: VALID_PASSWORD });
    expect(sessions.session()?.displayName).toBe('Titular');
  });

  it('muestra el error de credenciales, conserva el correo y limpia la contraseña en 401', async () => {
    typeInto('Correo electrónico', 'demo@kynwallet.test');
    typeInto('Contraseña', VALID_PASSWORD);
    submit();
    await flush();

    expect(screen.getByRole('alert').textContent).toContain('Correo o contraseña incorrectos');
    expect((screen.getByRole('textbox', { name: 'Correo electrónico' }) as HTMLInputElement).value).toBe(
      'demo@kynwallet.test',
    );
    expect((screen.getByLabelText('Contraseña', { exact: true }) as HTMLInputElement).value).toBe('');
    expect(screen.queryByText('Ingresa tu contraseña')).toBeNull();
  });

  it('muestra el mensaje de servicio no disponible', async () => {
    login.mockReturnValueOnce(of({ status: 'unavailable' }));
    typeInto('Correo electrónico', 'demo@kynwallet.test');
    typeInto('Contraseña', VALID_PASSWORD);
    submit();
    await flush();

    expect(screen.getByRole('alert').textContent).toContain('Servicio de acceso no disponible. Intenta más tarde.');
  });

  it('muestra "Iniciando sesión…" con aria-busy mientras se espera la respuesta', () => {
    login.mockReturnValueOnce(new Subject<AuthResult>());
    typeInto('Correo electrónico', 'demo@kynwallet.test');
    typeInto('Contraseña', VALID_PASSWORD);
    submit();
    fixture.detectChanges();

    const button = screen.getByRole('button', { name: 'Iniciando sesión…' });
    expect(button.getAttribute('aria-busy')).toBe('true');
    expect((button as HTMLButtonElement).disabled).toBe(true);
  });

  it('alterna la visibilidad de la contraseña con aria-pressed', () => {
    const toggle = screen.getByRole('button', { name: 'Mostrar contraseña' });
    expect(toggle.getAttribute('aria-pressed')).toBe('false');

    fireEvent.click(toggle);
    fixture.detectChanges();

    const visible = screen.getByRole('button', { name: 'Ocultar contraseña' });
    expect(visible.getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByLabelText('Contraseña', { exact: true }).getAttribute('type')).toBe('text');
  });

  it.each(['¿Olvidaste tu contraseña?', 'Google', 'Apple', 'Regístrate'])(
    'el enlace "%s" muestra el aviso de función fuera de alcance',
    async (name) => {
      fireEvent.click(screen.getByRole('button', { name }));
      await flush();

      expect(screen.getByRole('status').textContent).toContain('Función no disponible en esta demostración');
    },
  );
});
