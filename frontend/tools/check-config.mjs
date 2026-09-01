// Garde de configuration prod/dev — exécutée hors build Angular (donc non soumise
// aux fileReplacements). Pendant de `ProdProfileConfigTest` côté backend et du job
// CI `assert-prod-bundle`.
import assert from 'node:assert/strict';

const prod = (await import('../src/environments/environment.ts')).environment;
const dev = (await import('../src/environments/environment.development.ts')).environment;

assert.equal(prod.production, true, 'environment.ts (prod) doit avoir production=true');
assert.equal(prod.debugErrors, false, 'environment.ts (prod) doit avoir debugErrors=false');
assert.equal(dev.production, false, 'environment.development.ts doit avoir production=false');
assert.equal(dev.debugErrors, true, 'environment.development.ts doit avoir debugErrors=true');

console.log('OK — configuration prod/dev conforme (prod: debug off, dev: debug on)');
