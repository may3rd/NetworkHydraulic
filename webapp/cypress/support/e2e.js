// ***********************************************************
// This example support/e2e.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands';

// Import custom commands
import './customCommands';

// Import cypress-testing-library commands
import '@testing-library/cypress/add-commands';

// Import cypress code coverage
import '@cypress/code-coverage/support';

// Global configuration
Cypress.on('uncaught:exception', (err, runnable) => {
  // Returning false here prevents Cypress from failing the test
  // Only ignore errors from third-party scripts, not application errors
  if (err.message.includes('Non-Error promise rejection')) {
    return false;
  }
  
  // Let application errors fail the test
  return true;
});

// Add custom commands for hydraulic network testing
Cypress.Commands.add('login', (username, password) => {
  cy.visit('/login');
  cy.get('[data-testid="username-input"]').type(username);
  cy.get('[data-testid="password-input"]').type(password);
  cy.get('[data-testid="login-button"]').click();
  cy.url().should('not.include', '/login');
});

Cypress.Commands.add('loadConfiguration', (configName) => {
  cy.get('[data-testid="load-config-button"]').click();
  cy.get('[data-testid="config-selector"]').select(configName);
  cy.get('[data-testid="load-config-confirm"]').click();
});

Cypress.Commands.add('saveConfiguration', (configName) => {
  cy.get('[data-testid="save-config-button"]').click();
  cy.get('[data-testid="config-name-input"]').clear().type(configName);
  cy.get('[data-testid="save-config-confirm"]').click();
});

Cypress.Commands.add('validateConfiguration', () => {
  cy.get('[data-testid="validate-button"]').click();
  cy.get('[data-testid="validation-results"]').should('be.visible');
});

Cypress.Commands.add('startCalculation', () => {
  cy.get('[data-testid="calculate-button"]').click();
  cy.get('[data-testid="calculation-status"]').should('contain', 'Running');
});

Cypress.Commands.add('waitForCalculation', (timeout = 30000) => {
  cy.get('[data-testid="calculation-status"]', { timeout })
    .should('contain', 'Completed')
    .or('contain', 'Error');
});

Cypress.Commands.add('exportResults', (format) => {
  cy.get('[data-testid="export-button"]').click();
  cy.get(`[data-testid="export-${format}"]`).click();
  cy.get('[data-testid="export-progress"]').should('not.exist');
});

// Custom assertions for hydraulic network testing
Cypress.Commands.add('haveValidResults', () => {
  cy.get('[data-testid="results-table"]').should('be.visible');
  cy.get('[data-testid="pressure-profile"]').should('be.visible');
  cy.get('[data-testid="network-diagram"]').should('be.visible');
});

Cypress.Commands.add('haveValidationError', (field) => {
  cy.get(`[data-testid="validation-error-${field}"]`).should('be.visible');
});

Cypress.Commands.add('haveCalculationError', () => {
  cy.get('[data-testid="calculation-error"]').should('be.visible');
});

// Network-specific commands
Cypress.Commands.add('addPipeSection', (sectionData) => {
  cy.get('[data-testid="add-section-button"]').click();
  cy.get('[data-testid="section-form"]').should('be.visible');
  
  if (sectionData.pipeNPD) {
    cy.get('[data-testid="pipe-npd-input"]').select(sectionData.pipeNPD);
  }
  
  if (sectionData.length) {
    cy.get('[data-testid="length-input"]').clear().type(sectionData.length.toString());
  }
  
  if (sectionData.elevationChange) {
    cy.get('[data-testid="elevation-input"]').clear().type(sectionData.elevationChange.toString());
  }
  
  cy.get('[data-testid="save-section-button"]').click();
});

Cypress.Commands.add('configureFluid', (fluidData) => {
  cy.get('[data-testid="fluid-tab"]').click();
  
  if (fluidData.phase) {
    cy.get(`[data-testid="phase-${fluidData.phase}"]`).click();
  }
  
  if (fluidData.temperature) {
    cy.get('[data-testid="temperature-input"]').clear().type(fluidData.temperature.toString());
  }
  
  if (fluidData.pressure) {
    cy.get('[data-testid="pressure-input"]').clear().type(fluidData.pressure.toString());
  }
  
  if (fluidData.massFlowRate) {
    cy.get('[data-testid="mass-flow-input"]').clear().type(fluidData.massFlowRate.toString());
  }
});

// File upload commands
Cypress.Commands.add('uploadFile', (filePath, fileType = 'yaml') => {
  cy.get('[data-testid="file-upload"]').selectFile(`cypress/fixtures/${filePath}`, {
    action: 'drag-drop'
  });
  
  if (fileType === 'yaml') {
    cy.get('[data-testid="yaml-parser"]').should('be.visible');
  } else if (fileType === 'json') {
    cy.get('[data-testid="json-parser"]').should('be.visible');
  }
});

// Accessibility testing commands
Cypress.Commands.add('checkAccessibility', () => {
  cy.injectAxe();
  cy.checkA11y(null, null, cy.terminalLog, true);
});

// Performance testing commands
Cypress.Commands.add('measurePerformance', (testName) => {
  cy.window().then((win) => {
    const startTime = performance.now();
    
    cy.then(() => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      cy.task('log', `${testName} performance: ${duration}ms`);
    });
  });
});

// Setup before each test
beforeEach(() => {
  // Clear local storage and cookies
  cy.clearLocalStorage();
  cy.clearCookies();
  
  // Set up viewport
  cy.viewport(1280, 720);
  
  // Mock common API responses
  cy.intercept('GET', '/api/templates', { fixture: 'templates.json' }).as('getTemplates');
  cy.intercept('GET', '/api/fittings/*', { fixture: 'fittings.json' }).as('getFittings');
  cy.intercept('POST', '/api/validate', { fixture: 'validation-success.json' }).as('validateConfig');
  cy.intercept('POST', '/api/calculate', { fixture: 'calculation-results.json' }).as('calculate');
});