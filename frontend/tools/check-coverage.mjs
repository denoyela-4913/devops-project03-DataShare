// Porte de couverture front : échoue si la couverture de lignes < 70 %.
// Lit le coverage-summary.json produit par Vitest (reporter "json-summary").
import { readFileSync } from 'node:fs';

const THRESHOLD = 70;
const CANDIDATES = [
  '../coverage/datashare-frontend/coverage-summary.json',
  '../coverage/coverage-summary.json',
];

let summary;
for (const rel of CANDIDATES) {
  try {
    summary = JSON.parse(readFileSync(new URL(rel, import.meta.url), 'utf8'));
    break;
  } catch {
    /* essaie le suivant */
  }
}

if (!summary) {
  console.error("coverage-summary.json introuvable — lancer `ng test --watch=false` d'abord.");
  process.exit(2);
}

const lines = summary.total?.lines?.pct ?? 0;
console.log(`Couverture de lignes : ${lines}% (seuil ${THRESHOLD}%)`);

if (lines < THRESHOLD) {
  console.error(`ÉCHEC : ${lines}% < ${THRESHOLD}%`);
  process.exit(1);
}
console.log('OK');
