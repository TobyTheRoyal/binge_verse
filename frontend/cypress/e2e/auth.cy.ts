describe('Authentication', () => {
  beforeEach(() => {
    cy.visit('/auth/login');
  });

  it('logs in with valid credentials', () => {
    cy.get('input[type="email"]').type('tobias1.hamedl@gmail.com');
    cy.get('input[type="password"]').type('test');
    cy.get('button[type="submit"]').click();
    cy.url().should('eq', `${Cypress.config('baseUrl')}/`);
  });

  it('shows error for invalid credentials', () => {
    cy.get('input[type="email"]').type('wrong@example.com');
    cy.get('input[type="password"]').type('wrong');
    cy.get('button[type="submit"]').click();
    cy.contains('.error-message', 'Login failed').should('be.visible');
  });
});