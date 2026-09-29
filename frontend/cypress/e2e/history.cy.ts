/// <reference types="cypress" />

/** Historique des fichiers + suppression (US05 / US06). */
describe('Historique', () => {
  const password = 'password123';
  const freshEmail = () =>
    `e2e-hist-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;

  function signUp() {
    cy.visit('/register');
    cy.get('[data-testid="register-email-input"]').type(freshEmail());
    cy.get('[data-testid="register-password-input"]').type(password);
    cy.get('[data-testid="register-password-confirm-input"]').type(password);
    cy.get('[data-testid="register-submit"]').click();
    cy.location('pathname').should('eq', '/history');
  }

  function upload(name: string) {
    cy.visit('/upload');
    cy.get('[data-testid="upload-file-input-landing"]').selectFile(
      { contents: Cypress.Buffer.from('contenu e2e'), fileName: name, mimeType: 'text/plain' },
      { force: true },
    );
    cy.get('[data-testid="upload-submit"]').click();
    cy.get('[data-testid="upload-share-url"]').should('be.visible');
  }

  /**
   * Clique « Supprimer » sur la première carte. En mobile (≤ 833 px) l'action est dans
   * le menu « ⋮ » : on l'ouvre d'abord quand il est affiché (desktop : bouton visible).
   */
  function clickDeleteOnFirstCard() {
    cy.get('[data-testid="file-card"]')
      .first()
      .within(() => {
        cy.get('[data-testid="file-card-menu"]').then(($menu) => {
          if ($menu.is(':visible')) {
            cy.wrap($menu).click();
          }
        });
        cy.get('[data-testid="file-card-delete"]').click();
      });
  }

  it('liste les fichiers, filtre Tous/Actifs/Expiré, supprime avec confirmation', () => {
    signUp();
    upload('alpha.txt');
    upload('beta.txt');

    cy.visit('/history');
    cy.get('[data-testid="history-list"] app-file-card').should('have.length', 2);

    cy.get('[data-testid="ui-switch-expired"]').click();
    cy.get('[data-testid="history-filter-empty"]').should('be.visible');
    cy.get('[data-testid="ui-switch-all"]').click();
    cy.get('[data-testid="history-list"] app-file-card').should('have.length', 2);

    clickDeleteOnFirstCard();
    cy.get('[data-testid="confirm-dialog"]').should('be.visible');
    cy.get('[data-testid="confirm-dialog-confirm"]').click();

    cy.get('[data-testid="form-notice-message"]').should('contain', 'Fichier supprimé');
    cy.get('[data-testid="history-list"] app-file-card').should('have.length', 1);
  });

  it('un fichier supprimé n’est plus téléchargeable', () => {
    signUp();
    upload('gamma.txt');
    cy.get('[data-testid="upload-share-url"]')
      .invoke('text')
      .then((shareUrl) => {
        const path = new URL(shareUrl.trim()).pathname;

        cy.visit('/history');
        clickDeleteOnFirstCard();
        cy.get('[data-testid="confirm-dialog-confirm"]').click();
        cy.get('[data-testid="history-empty"]').should('be.visible');

        cy.clearAllSessionStorage();
        cy.clearLocalStorage();
        cy.visit(path);
        cy.get('[data-testid="download-not-found"]').should('be.visible');
      });
  });
});
