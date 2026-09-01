import { Pipe, PipeTransform } from '@angular/core';

const UNITS = ['o', 'Ko', 'Mo', 'Go', 'To'] as const;

/** Formate une taille en octets de façon lisible : `1536` → `1,5 Ko`. */
@Pipe({ name: 'fileSize' })
export class FileSizePipe implements PipeTransform {
  transform(bytes: number | null | undefined, fractionDigits = 1): string {
    if (bytes == null || Number.isNaN(bytes) || bytes < 0) {
      return '—';
    }
    if (bytes === 0) {
      return '0 o';
    }
    const exp = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), UNITS.length - 1);
    const value = bytes / 1024 ** exp;
    return `${value.toFixed(exp === 0 ? 0 : fractionDigits).replace('.', ',')} ${UNITS[exp]}`;
  }
}
