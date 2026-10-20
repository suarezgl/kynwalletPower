import { describe, expect, it, vi } from 'vitest';
import { AuthTokenStore } from './auth-token-store';

describe('AuthTokenStore', () => {
  it('no tiene sesión al iniciar', () => {
    const store = new AuthTokenStore();
    expect(store.session()).toBeNull();
    expect(store.accessToken()).toBeNull();
  });

  it('guarda la sesión en memoria y expone el token', () => {
    const store = new AuthTokenStore();
    store.open({ accessToken: 'abc', displayName: 'Titular' });
    expect(store.accessToken()).toBe('abc');
    expect(store.session()?.displayName).toBe('Titular');
  });

  it('borra el token al cerrar sesión', () => {
    const store = new AuthTokenStore();
    store.open({ accessToken: 'abc', displayName: 'Titular' });
    store.close();
    expect(store.accessToken()).toBeNull();
  });

  it('no persiste el token en localStorage ni sessionStorage (regla C6)', () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    const store = new AuthTokenStore();
    store.open({ accessToken: 'abc', displayName: 'Titular' });
    expect(setItem).not.toHaveBeenCalled();
    setItem.mockRestore();
  });
});
