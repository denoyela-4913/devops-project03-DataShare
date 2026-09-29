import { calendarDaysUntil } from './expiry-days';

describe('calendarDaysUntil', () => {
  const now = new Date(2026, 8, 1, 12, 0);

  it('compte en jours du calendrier, pas en tranches de 24 h', () => {
    expect(calendarDaysUntil(new Date(2026, 8, 1, 23, 59), now)).toBe(0);
    expect(calendarDaysUntil(new Date(2026, 8, 2, 0, 1), now)).toBe(1);
    expect(calendarDaysUntil(new Date(2026, 8, 3, 8, 0), now)).toBe(2);
  });

  it('renvoie une valeur négative pour une date passée', () => {
    expect(calendarDaysUntil(new Date(2026, 7, 31, 8, 0), now)).toBe(-1);
  });

  it('renvoie null pour une date invalide', () => {
    expect(calendarDaysUntil('pas-une-date', now)).toBeNull();
  });

  it('reste juste autour des changements d’heure (jours de 23 h / 25 h)', () => {
    // Europe/Paris : 29/03/2026 (23 h) et 25/10/2026 (25 h) ; sans effet ailleurs, jamais faux.
    expect(calendarDaysUntil(new Date(2026, 2, 30, 10), new Date(2026, 2, 28, 10))).toBe(2);
    expect(calendarDaysUntil(new Date(2026, 9, 26, 10), new Date(2026, 9, 24, 10))).toBe(2);
    expect(calendarDaysUntil(new Date(2026, 2, 29, 10), new Date(2026, 2, 28, 10))).toBe(1);
    expect(calendarDaysUntil(new Date(2026, 9, 25, 10), new Date(2026, 9, 24, 10))).toBe(1);
  });
});
