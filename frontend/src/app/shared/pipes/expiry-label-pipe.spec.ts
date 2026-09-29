import { ExpiryLabelPipe } from './expiry-label-pipe';

describe('ExpiryLabelPipe', () => {
  const pipe = new ExpiryLabelPipe();
  const now = new Date(2026, 8, 1, 12, 0);

  it('« Expiré » quand la date est passée', () => {
    expect(pipe.transform(new Date(2026, 8, 1, 11, 59), now)).toBe('Expiré');
    expect(pipe.transform(new Date(2026, 7, 1), now)).toBe('Expiré');
  });

  it("« Expire aujourd'hui » le jour même", () => {
    expect(pipe.transform(new Date(2026, 8, 1, 18, 0), now)).toBe("Expire aujourd'hui");
  });

  it('« Expire demain » le lendemain', () => {
    expect(pipe.transform(new Date(2026, 8, 2, 8, 0), now)).toBe('Expire demain');
  });

  it('« Expire dans N jours » au-delà', () => {
    expect(pipe.transform(new Date(2026, 8, 3, 8, 0), now)).toBe('Expire dans 2 jours');
    expect(pipe.transform(new Date(2026, 8, 8, 8, 0).toISOString(), now)).toBe(
      'Expire dans 7 jours',
    );
  });

  it('null pour une valeur absente ou invalide', () => {
    expect(pipe.transform(null, now)).toBeNull();
    expect(pipe.transform('pas-une-date', now)).toBeNull();
  });
});
