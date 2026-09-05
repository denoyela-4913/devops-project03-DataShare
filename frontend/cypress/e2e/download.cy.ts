/// <reference types="cypress" />

/** Parcours téléchargement d'un lien de partage (US02). */
describe('Téléchargement', () => {
  const accountPassword = 'password123';
  const freshEmail = () =>
    `e2e-dl-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;

  function signUp() {
    cy.visit('/register');
    cy.get('[data-testid="register-email-input"]').type(freshEmail());
    cy.get('[data-testid="register-password-input"]').type(accountPassword);
    cy.get('[data-testid="register-password-confirm-input"]').type(accountPassword);
    cy.get('[data-testid="register-submit"]').click();
    cy.location('pathname').should('eq', '/');
  }

  /** Dépose un fichier via l'UI et renvoie le chemin `/d/<token>` du lien de partage. */
  function uploadAndGetSharePath(filePassword?: string) {
    cy.visit('/upload');
    cy.get('[data-testid="upload-file-input-landing"]').selectFile(
      {
        contents: Cypress.Buffer.from('contenu de test e2e'),
        fileName: 'rapport-e2e.txt',
        mimeType: 'text/plain',
      },
      { force: true },
    );
    if (filePassword) {
      cy.get('[data-testid="upload-password-input"]').type(filePassword);
    }
    cy.get('[data-testid="upload-submit"]').click();
    return cy
      .get('[data-testid="upload-share-url"]')
      .invoke('text')
      .then((shareUrl) => new URL(shareUrl.trim()).pathname);
  }

  it('lien public : affiche le fichier et lance le téléchargement (200)', () => {
    signUp();
    uploadAndGetSharePath().then((path) => {
      cy.clearLocalStorage();
      cy.intercept('POST', '/api/d/*').as('download');
      cy.visit(path);
      cy.get('[data-testid="download-file-name"]').should('contain', 'rapport-e2e.txt');
      cy.get('[data-testid="download-password-input"]').should('not.exist');
      cy.get('[data-testid="download-submit"]').click();
      cy.wait('@download').its('response.statusCode').should('eq', 200);
    });
  });

  it('lien inconnu : état introuvable', () => {
    cy.visit('/d/ce-token-nexiste-pas');
    cy.get('[data-testid="download-not-found"]').should('be.visible');
  });

  it('lien protégé : mot de passe requis, refusé si incorrect (403) puis accepté (200)', () => {
    signUp();
    uploadAndGetSharePath('filepass1').then((path) => {
      cy.clearLocalStorage();
      cy.intercept('POST', '/api/d/*').as('dl');
      cy.visit(path);

      cy.get('[data-testid="download-password-input"]').should('be.visible').type('mauvais');
      cy.get('[data-testid="download-submit"]').click();
      cy.wait('@dl').its('response.statusCode').should('eq', 403);
      cy.get('[data-testid="error-message"]').should('be.visible');

      cy.get('[data-testid="download-password-input"]').clear().type('filepass1');
      cy.get('[data-testid="download-submit"]').click();
      cy.wait('@dl').its('response.statusCode').should('eq', 200);
    });
  });
});
