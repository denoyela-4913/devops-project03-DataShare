import { Pipe, PipeTransform } from '@angular/core';
import { calendarDaysUntil } from '../utils/expiry-days';

/**
 * Libellé d'expiration d'un fichier : « Expiré », « Expire aujourd'hui », « Expire demain »
 * ou « Expire dans N jours ». `null` si la date est absente ou invalide.
 */
@Pipe({ name: 'expiryLabel' })
export class ExpiryLabelPipe implements PipeTransform {
  transform(expiresAt: string | Date | null | undefined, now: Date = new Date()): string | null {
    if (!expiresAt) {
      return null;
    }
    const days = calendarDaysUntil(expiresAt, now);
    if (days === null) {
      return null;
    }
    const exp = expiresAt instanceof Date ? expiresAt : new Date(expiresAt);
    if (exp.getTime() <= now.getTime()) {
      return 'Expiré';
    }
    if (days === 0) {
      return "Expire aujourd'hui";
    }
    if (days === 1) {
      return 'Expire demain';
    }
    return `Expire dans ${days} jours`;
  }
}
