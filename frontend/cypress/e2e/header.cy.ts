describe('Header Search – Movie vs Series Navigation', () => {
  const email = 'tobias1.hamedl@gmail.com';
  const password = 'test';

  before(() => {
    cy.login(email, password);
  });

  it('should find "Superman" and navigate to movie detail page', () => {
    cy.get('.search-bar').clear().type('Superman');

    // Warten bis Vorschläge erscheinen
    cy.get('.suggestion-item').contains('Superman').click();

    // Sollte zur Movie-Detailseite führen
    cy.url().should('match', /\/movies\/\d+$/);
    cy.get('h1, h2').should('contain', 'Superman');
  });

  it('should find "Squid Game" and navigate to series detail page', () => {
    cy.login(email, password);
    cy.visit('/');
    cy.get('.search-bar').clear().type('Squid Game');

    cy.get('.suggestion-item').contains('Squid Game').click();

    // Sollte zur Series-Detailseite führen
    cy.url().should('match', /\/series\/\d+$/);
    cy.get('h1, h2').should('contain', 'Squid Game');
  });
});
