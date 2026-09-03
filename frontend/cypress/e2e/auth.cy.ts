/// <reference types="cypress" />

/** Parcours critique inscription / connexion (US03 / US04). */
describe('Authentification', () => {
  const password = 'password123';
  const freshEmail = () =>
    `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;

  it('inscription → espace personnel → déconnexion → reconnexion', () => {
    const email = freshEmail();

    cy.visit('/register');
    cy.get('[data-testid="register-email-input"]').type(email);
    cy.get('[data-testid="register-password-input"]').type(password);
    cy.get('[data-testid="register-password-confirm-input"]').type(password);
    cy.get('[data-testid="register-submit"]').click();

    cy.location('pathname').should('eq', '/');
    cy.get('[data-testid="home-email"]').should('contain', email);

    cy.get('[data-testid="home-logout"]').click();
    cy.location('pathname').should('eq', '/login');

    cy.get('[data-testid="login-email-input"]').type(email);
    cy.get('[data-testid="login-password-input"]').type(password);
    cy.get('[data-testid="login-submit"]').click();
    cy.location('pathname').should('eq', '/');
    cy.get('[data-testid="home-email"]').should('contain', email);
  });

  it("inscription avec un email déjà utilisé → message d'erreur, reste sur /register", () => {
    const email = freshEmail();
    cy.request('POST', '/api/auth/register', { email, password });

    cy.visit('/register');
    cy.get('[data-testid="register-email-input"]').type(email);
    cy.get('[data-testid="register-password-input"]').type(password);
    cy.get('[data-testid="register-password-confirm-input"]').type(password);
    cy.get('[data-testid="register-submit"]').click();

    cy.get('[data-testid="error-message"]').should('be.visible').and('contain', 'déjà utilisée');
    cy.location('pathname').should('eq', '/register');
  });

  it('accès à une page protégée sans session → redirection vers /login', () => {
    cy.visit('/');
    cy.location('pathname').should('eq', '/login');
  });
});
