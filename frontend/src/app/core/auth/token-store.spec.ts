import { TokenStore } from './token-store';

describe('TokenStore', () => {
  beforeEach(() => localStorage.clear());

  it('set() met à jour le signal et le localStorage', () => {
    const store = new TokenStore();
    store.set('abc.def.ghi');
    expect(store.token()).toBe('abc.def.ghi');
    expect(localStorage.getItem('datashare.token')).toBe('abc.def.ghi');
  });

  it('clear() vide le signal et le localStorage', () => {
    const store = new TokenStore();
    store.set('abc.def.ghi');
    store.clear();
    expect(store.token()).toBeNull();
    expect(localStorage.getItem('datashare.token')).toBeNull();
  });

  it("relit le token présent dans le localStorage à l'initialisation", () => {
    localStorage.setItem('datashare.token', 'persisted.token');
    expect(new TokenStore().token()).toBe('persisted.token');
  });
});
