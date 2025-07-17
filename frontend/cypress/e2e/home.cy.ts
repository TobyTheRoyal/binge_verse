describe('Home Page – Guest to Authenticated Flow', () => {
  const email = "tobias1.hamedl@gmail.com";
  const password = "test";
  it('should show hero section and categories for guest', () => {
    cy.clearLocalStorage();
    cy.visit('/');

    cy.contains('h1', 'Your personal streaming companion').should('be.visible');
    cy.contains('rate, discover and keep track of what you love').should('be.visible');

    cy.contains('h2', 'Trending Now').should('exist');
    cy.contains('h2', 'Top Rated').should('exist');
    cy.contains('h2', 'New Releases').should('exist');
    cy.contains('h2', 'My Watchlist').should('exist');

    cy.get('.content-card').should('exist');
  });

  it('should redirect to login, login and test as authenticated user', () => {
    cy.clearLocalStorage();
    cy.visit('/');

    // --- Redirect to login ---
    cy.get('.add-btn').first().click();
    cy.url().should('include', '/auth/login');

    // --- Login ---
    cy.get('input[formcontrolname="email"]').type(email);
    cy.get('input[formcontrolname="password"]').type(password);
    cy.get('button[type="submit"]').click();

    // --- Should land on home again ---
    cy.url().should('eq', `${Cypress.config().baseUrl}/`);
    cy.contains('h2', 'Trending Now').should('exist');

    
  });
});
