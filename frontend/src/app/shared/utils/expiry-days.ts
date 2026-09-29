const startOfDay = (d: Date): number => {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy.getTime();
};

/**
 * Nombre de jours du calendrier (minuit à minuit) entre `now` et la date d'expiration :
 * 0 = aujourd'hui, 1 = demain… Négatif si la date est passée, `null` si elle est invalide.
 */
export function calendarDaysUntil(expiresAt: string | Date, now: Date = new Date()): number | null {
  const exp = expiresAt instanceof Date ? expiresAt : new Date(expiresAt);
  if (Number.isNaN(exp.getTime())) {
    return null;
  }
  // Math.round (et non ceil/floor) : les jours de changement d'heure durent 23 h
  // ou 25 h, la division ne tombe alors pas pile sur un entier.
  return Math.round((startOfDay(exp) - startOfDay(now)) / 86_400_000);
}
