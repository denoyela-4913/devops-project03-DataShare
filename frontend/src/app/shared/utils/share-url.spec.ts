import { toAbsoluteShareUrl } from './share-url';

describe('toAbsoluteShareUrl', () => {
  it("ajoute l'origine du navigateur à un chemin relatif", () => {
    expect(toAbsoluteShareUrl('/d/abc123', 'http://localhost:4200')).toBe(
      'http://localhost:4200/d/abc123',
    );
    expect(toAbsoluteShareUrl('/d/abc123', 'http://192.168.0.76:4200')).toBe(
      'http://192.168.0.76:4200/d/abc123',
    );
    expect(toAbsoluteShareUrl('/d/abc123', 'https://exemple.trycloudflare.com')).toBe(
      'https://exemple.trycloudflare.com/d/abc123',
    );
  });

  it('conserve un lien déjà absolu (base imposée par le serveur)', () => {
    expect(toAbsoluteShareUrl('https://datashare.example/d/abc123', 'http://localhost:4200')).toBe(
      'https://datashare.example/d/abc123',
    );
  });

  it('garde toujours notre origine, même avec un chemin commençant par //', () => {
    expect(toAbsoluteShareUrl('//autre.example/d/x', 'http://localhost:4200')).toBe(
      'http://localhost:4200//autre.example/d/x',
    );
  });

  it('utilise window.location.origin par défaut', () => {
    expect(toAbsoluteShareUrl('/d/tok')).toBe(`${window.location.origin}/d/tok`);
  });
});
