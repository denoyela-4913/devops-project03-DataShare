// Audit des dépendances front : équivalent de `npm audit --audit-level=high`, avec des
// exceptions temporaires listées dans audit-allowlist.json (avis sans correctif publié).
//
// - Un avis high/critical absent de la liste fait échouer le script.
// - Une exception expire à `reviewBy` : passé ce jour, elle ne protège plus et l'avis fait
//   échouer la CI, ce qui force une réévaluation (renouveler pour 7 jours, ou retirer).
// - Alertes (sans échec) : correctif désormais disponible, ou exception devenue sans objet.
// - Si le registre npm est injoignable, on avertit sans bloquer (comme avant).
//
// Usage : node tools/audit-check.mjs [--today=AAAA-MM-JJ]   (--today sert aux essais locaux)
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const BLOCKING = new Set(['high', 'critical']);
const todayArg = process.argv.find((a) => a.startsWith('--today='));
const today = todayArg ? todayArg.slice('--today='.length) : new Date().toISOString().slice(0, 10);

const { exceptions } = JSON.parse(
  readFileSync(new URL('../audit-allowlist.json', import.meta.url), 'utf8'),
);

const run = spawnSync('npm', ['audit', '--json'], {
  encoding: 'utf8',
  shell: process.platform === 'win32',
});
let report;
try {
  report = JSON.parse(run.stdout);
} catch {
  console.error(`npm audit : sortie illisible\n${run.stdout}\n${run.stderr}`);
  process.exit(1);
}
if (report.error) {
  const text = JSON.stringify(report.error);
  if (/ENOTFOUND|ETIMEDOUT|ECONNRESET|Service Unavailable|endpoint returned an error/i.test(text)) {
    console.log('::warning::npm audit injoignable — traité comme non bloquant');
    process.exit(0);
  }
  console.error(`npm audit : erreur\n${text}`);
  process.exit(1);
}

// Avis (et non paquets de la chaîne) : ce sont les objets de `via`.
const advisories = new Map();
for (const [name, vuln] of Object.entries(report.vulnerabilities ?? {})) {
  for (const via of vuln.via ?? []) {
    if (typeof via !== 'object') continue;
    const id = via.url?.split('/').pop() ?? String(via.source);
    advisories.set(id, {
      id,
      package: via.name ?? name,
      severity: via.severity,
      title: via.title,
      fixAvailable: vuln.fixAvailable,
    });
  }
}

const byId = new Map(exceptions.map((e) => [e.id, e]));
let failed = false;

for (const adv of advisories.values()) {
  if (!BLOCKING.has(adv.severity)) continue;
  const exc = byId.get(adv.id);
  if (exc && today <= exc.reviewBy) {
    console.log(
      `exception active  ${adv.id} (${adv.package}, ${adv.severity}) — à réévaluer avant le ${exc.reviewBy}`,
    );
    if (adv.fixAvailable)
      console.log(
        `::warning::${adv.id} : un correctif est maintenant disponible (npm audit fix) — retirer l'exception`,
      );
    continue;
  }
  failed = true;
  const why = exc
    ? `exception expirée le ${exc.reviewBy} : réévaluer (correctif publié ? sinon renouveler pour 7 jours dans audit-allowlist.json)`
    : 'non couvert par audit-allowlist.json';
  console.error(`::error::${adv.id} (${adv.package}, ${adv.severity}) ${adv.title} — ${why}`);
}

for (const exc of exceptions) {
  if (!advisories.has(exc.id))
    console.log(
      `::warning::exception ${exc.id} sans objet (avis disparu) — la retirer de audit-allowlist.json`,
    );
}

process.exit(failed ? 1 : 0);
