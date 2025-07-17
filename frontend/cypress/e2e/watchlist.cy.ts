describe('Watchlist – Hinzufügen und Entfernen', () => {
  const email = 'tobias1.hamedl@gmail.com';
  const password = 'test';

  before(() => {
    cy.login(email, password);
    cy.visit('/');
  });

  it('should add an item to the watchlist via home', () => {
    cy.get('#trending .content-card').first().within(() => {
      cy.get('.add-btn').click();
    });

    // Reload to ensure watchlist is updated
    cy.reload();
    cy.get('#watchlist .content-card').should('have.length.greaterThan', 0);
  });

  it('should see the item in /watchlist and remove it', () => {
  // sicherstellen, dass wir eingeloggt bleiben
  cy.login(email, password);
  cy.visit('/watchlist');

  // Watchlist muss Inhalt haben
  cy.get('.content-card', { timeout: 8000 }).should('have.length.greaterThan', 0);

  // Entfernen
  cy.get('.content-card').first().within(() => {
    cy.get('.add-btn').click();
  });

  // Zurück zur Startseite
  cy.login(email, password); // Token sicherstellen
  cy.visit('/');
  cy.get('#watchlist .content-card').should('have.length', 0);
});

  it('should reflect removal on the home page watchlist section', () => {
    cy.visit('/');
    cy.get('#watchlist .content-card').should('have.length', 0);
  });
  
});
