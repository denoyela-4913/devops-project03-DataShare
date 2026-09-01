import { ExpiryStatusPipe } from './expiry-status-pipe';

describe('ExpiryStatusPipe', () => {
  const pipe = new ExpiryStatusPipe();
  const now = new Date('2026-09-01T12:00:00Z');

  it('renvoie "valid" pour une date future', () => {
    expect(pipe.transform('2026-09-08T12:00:00Z', now)).toBe('valid');
    expect(pipe.transform(new Date('2026-09-01T12:00:01Z'), now)).toBe('valid');
  });

  it('renvoie "expired" pour une date passée', () => {
    expect(pipe.transform('2026-08-31T12:00:00Z', now)).toBe('expired');
  });

  it('renvoie null pour une valeur absente ou invalide', () => {
    expect(pipe.transform(null, now)).toBeNull();
    expect(pipe.transform(undefined, now)).toBeNull();
    expect(pipe.transform('pas-une-date', now)).toBeNull();
  });
});
