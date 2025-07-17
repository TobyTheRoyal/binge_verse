describe('Registration', () => {
  it('creates a new account', () => {
    cy.visit('/auth/register');
    cy.get('input[formControlName="username"]').type('newUser');
    cy.get('input[formControlName="email"]').type('new@example.com');
    cy.get('input[formControlName="password"]').type('password123');
    cy.get('button[type="submit"]').click();
    cy.url().should('eq', `${Cypress.config('baseUrl')}/`);
  });
});