describe('AuthInterceptor – Logout on 401', () => {
  const email = 'tobias1.hamedl@gmail.com';
  const password = 'test';

  it('clears token and redirects to login when API returns 401', () => {
    // Login using custom command
    cy.login(email, password);

    // token should be stored after login
    cy.window().should((win) => {
      expect(win.localStorage.getItem('auth_token')).to.exist;
    });

    // Force the watchlist API to return 401
    cy.intercept('GET', `${Cypress.env('apiUrl')}/watchlist/user`, {
      statusCode: 401,
      body: { message: 'Unauthorized' },
    }).as('unauthorized');

    // Navigate to watchlist which triggers the request
    cy.visit('/watchlist');
    cy.wait('@unauthorized');

    // Interceptor should log out and redirect to the login page
    cy.url().should('include', '/auth/login');

    // Token should be removed from local storage
    cy.window().should((win) => {
      expect(win.localStorage.getItem('auth_token')).to.be.null;
    });
  });
});