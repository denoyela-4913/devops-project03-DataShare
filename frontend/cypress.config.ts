import { defineConfig } from 'cypress';

// Scaffold. Le job CI `frontend-e2e` et l'installation de Cypress sont activés
// avec la première feature offrant un parcours complet (US03/US04 — auth).
export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:4200',
    specPattern: 'cypress/e2e/**/*.cy.ts',
    supportFile: 'cypress/support/e2e.ts',
    fixturesFolder: 'cypress/fixtures',
    video: false,
  },
});
