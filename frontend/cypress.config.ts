import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    baseUrl: 'http://127.0.0.1:4200',
    supportFile: 'cypress/support/e2e.ts',
    specPattern: 'cypress/e2e/**/*.cy.ts',
    env: {
      apiUrl: 'http://127.0.0.1:3000'
    },
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
});
