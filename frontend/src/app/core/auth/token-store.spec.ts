import { TokenStore } from './token-store';

describe('TokenStore', () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  it('set() met à jour le signal et le sessionStorage', () => {
    const store = new TokenStore();
    store.set('abc.def.ghi');
    expect(store.token()).toBe('abc.def.ghi');
    expect(sessionStorage.getItem('datashare.token')).toBe('abc.def.ghi');
  });

  it('clear() vide le signal et le sessionStorage', () => {
    const store = new TokenStore();
    store.set('abc.def.ghi');
    store.clear();
    expect(store.token()).toBeNull();
    expect(sessionStorage.getItem('datashare.token')).toBeNull();
  });

  it("relit le token présent dans le sessionStorage à l'initialisation", () => {
    sessionStorage.setItem('datashare.token', 'persisted.token');
    expect(new TokenStore().token()).toBe('persisted.token');
  });

  it("n'écrit jamais dans le localStorage (session propre à l'onglet)", () => {
    const store = new TokenStore();
    store.set('abc.def.ghi');
    expect(localStorage.getItem('datashare.token')).toBeNull();
  });

  it('ignore un token qui ne serait que dans le localStorage', () => {
    localStorage.setItem('datashare.token', 'legacy.local.token');
    expect(new TokenStore().token()).toBeNull();
  });
});
