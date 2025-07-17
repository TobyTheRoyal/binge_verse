describe('Ratings – Bewerten, Anzeigen & Aktualisieren über /history', () => {
  const email = 'tobias1.hamedl@gmail.com';
  const password = 'test';
  const initialRating = '9.0';
  const updatedRating = '8.3';

  before(() => {
    // Loggt ein und lädt sofort die Home-Page mit gültigem Token
    cy.login(email, password);
  });

  it('should rate a movie from the home page and show badge', () => {
    cy.get('#trending .content-card').first().within(() => {
      cy.get('.rating-btn').click();
    });

    cy.get('.rating-input-field')
      .should('have.length', 1)
      .clear()
      .type(initialRating);

    cy.get('.submit-rating-btn').click();

    cy.get('#trending .content-card').first().within(() => {
      cy.get('.own-rating-tag').should('contain', initialRating);
    });
  });

  it('should show the rated item in /history and allow updating it', () => {
    // Direkt auf /history gehen – Login bleibt erhalten
    cy.login(email, password);
    cy.visit('/history');

    cy.get('.content-card').should('have.length.greaterThan', 0);

    cy.get('.content-card').first().within(() => {
  cy.get('.rating-btn').click();

  // Warten auf Eingabefeld in derselben Card
  cy.get('.rating-input, .rating-input-field').should('have.length', 1)
    .should('exist')
    .clear()
    .type(updatedRating);

  cy.get('.submit-rating-btn').click();
});

    cy.get('.content-card').first().within(() => {
      cy.get('.own-rating-tag').should('contain', updatedRating);
    });
  });
});
