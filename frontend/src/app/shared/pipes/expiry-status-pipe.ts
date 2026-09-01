import { Pipe, PipeTransform } from '@angular/core';

export type ExpiryStatus = 'valid' | 'expired';

/** État d'un lien à partir de sa date d'expiration : `valid` ou `expired`. */
@Pipe({ name: 'expiryStatus' })
export class ExpiryStatusPipe implements PipeTransform {
  transform(
    expiresAt: string | Date | null | undefined,
    now: Date = new Date(),
  ): ExpiryStatus | null {
    if (!expiresAt) {
      return null;
    }
    const exp = expiresAt instanceof Date ? expiresAt : new Date(expiresAt);
    if (Number.isNaN(exp.getTime())) {
      return null;
    }
    return exp.getTime() > now.getTime() ? 'valid' : 'expired';
  }
}
