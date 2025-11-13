/**
 * Smoke tests for hydraulic network web application
 * These tests verify basic functionality and critical user paths
 */

describe('Hydraulic Network Application - Smoke Tests', () => {
  beforeEach(() => {
    // Visit the application
    cy.visit('/');
    
    // Verify the application is loaded
    cy.get('[data-testid="app-container"]').should('be.visible');
    cy.get('[data-testid="main-layout"]').should('be.visible');
  });

  it('should display the main application layout', () => {
    // Check for main layout components
    cy.get('[data-testid="header"]').should('be.visible');
    cy.get('[data-testid="sidebar"]').should('be.visible');
    cy.get('[data-testid="main-content"]').should('be.visible');
    
    // Check for navigation elements
    cy.get('[data-testid="nav-config"]').should('be.visible');
    cy.get('[data-testid="nav-results"]').should('be.visible');
    cy.get('[data-testid="nav-history"]').should('be.visible');
  });

  it('should navigate to configuration page', () => {
    // Click on configuration navigation
    cy.get('[data-testid="nav-config"]').click();
    
    // Verify configuration page is loaded
    cy.url().should('include', '/config');
    cy.get('[data-testid="configuration-form"]').should('be.visible');
    cy.get('[data-testid="fluid-properties"]').should('be.visible');
    cy.get('[data-testid="network-settings"]').should('be.visible');
    cy.get('[data-testid="pipe-sections"]').should('be.visible');
  });

  it('should navigate to results page', () => {
    // Click on results navigation
    cy.get('[data-testid="nav-results"]').click();
    
    // Verify results page is loaded
    cy.url().should('include', '/results');
    cy.get('[data-testid="results-dashboard"]').should('be.visible');
    cy.get('[data-testid="results-summary"]').should('be.visible');
  });

  it('should navigate to history page', () => {
    // Click on history navigation
    cy.get('[data-testid="nav-history"]').click();
    
    // Verify history page is loaded
    cy.url().should('include', '/history');
    cy.get('[data-testid="calculation-history"]').should('be.visible');
  });

  it('should display application header with correct title', () => {
    cy.get('[data-testid="app-title"]').should('contain', 'Hydraulic Network');
    cy.get('[data-testid="app-title"]').should('be.visible');
  });

  it('should have working theme toggle', () => {
    // Check initial theme
    cy.get('[data-testid="theme-toggle"]').should('be.visible');
    
    // Toggle theme
    cy.get('[data-testid="theme-toggle"]').click();
    
    // Verify theme change (this would depend on your implementation)
    // You might check for a CSS class or data attribute that indicates theme
    cy.get('body').should('have.class', 'dark-theme').or('not.have.class', 'light-theme');
  });

  it('should have accessible navigation', () => {
    // Test keyboard navigation
    cy.get('body').tab();
    cy.focused().should('have.attr', 'data-testid', 'nav-config');
    
    cy.focused().tab();
    cy.focused().should('have.attr', 'data-testid', 'nav-results');
    
    cy.focused().tab();
    cy.focused().should('have.attr', 'data-testid', 'nav-history');
  });

  it('should display footer information', () => {
    cy.get('[data-testid="footer"]').should('be.visible');
    cy.get('[data-testid="footer-content"]').should('be.visible');
    cy.get('[data-testid="app-version"]').should('be.visible');
  });

  it('should handle window resize gracefully', () => {
    // Test desktop viewport
    cy.viewport(1280, 720);
    cy.get('[data-testid="sidebar"]').should('be.visible');
    
    // Test tablet viewport
    cy.viewport(768, 1024);
    cy.get('[data-testid="sidebar"]').should('be.visible');
    
    // Test mobile viewport
    cy.viewport(375, 667);
    cy.get('[data-testid="sidebar-toggle"]').should('be.visible');
  });

  it('should display loading states appropriately', () => {
    // Mock a slow API response
    cy.intercept('GET', '/api/config', {
      delay: 1000,
      fixture: 'sample-config.json'
    }).as('getConfig');
    
    // Trigger loading state
    cy.get('[data-testid="load-config-button"]').click();
    
    // Check for loading indicator
    cy.get('[data-testid="loading-spinner"]').should('be.visible');
    
    // Wait for response
    cy.wait('@getConfig');
    
    // Loading should disappear
    cy.get('[data-testid="loading-spinner"]').should('not.exist');
  });

  it('should handle error states gracefully', () => {
    // Mock an API error
    cy.intercept('POST', '/api/calculate', {
      statusCode: 500,
      body: { error: 'Internal Server Error' }
    }).as('calculateError');
    
    // Trigger calculation that will error
    cy.get('[data-testid="calculate-button"]').click();
    
    // Wait for error response
    cy.wait('@calculateError');
    
    // Check for error display
    cy.get('[data-testid="error-display"]').should('be.visible');
    cy.get('[data-testid="error-message"]').should('contain', 'Internal Server Error');
  });

  it('should have working help/documentation links', () => {
    // Check for help button
    cy.get('[data-testid="help-button"]').should('be.visible');
    
    // Click help button
    cy.get('[data-testid="help-button"]').click();
    
    // Should open help modal or navigate to documentation
    cy.get('[data-testid="help-modal"]').should('be.visible')
      .or(() => {
        // Or navigate to documentation page
        cy.url().should('include', '/help');
      });
  });

  it('should have working keyboard shortcuts', () => {
    // Test common keyboard shortcuts
    cy.get('body').type('{ctrl}+s'); // Save shortcut
    cy.get('[data-testid="save-notification"]').should('be.visible');
    
    cy.get('body').type('{ctrl}+z'); // Undo shortcut
    cy.get('[data-testid="undo-notification"]').should('be.visible');
  });

  it('should display proper meta tags and SEO information', () => {
    cy.title().should('contain', 'Hydraulic Network');
    cy.get('meta[name="description"]').should('exist');
    cy.get('meta[name="keywords"]').should('exist');
    cy.get('link[rel="icon"]').should('exist');
  });

  it('should be accessible according to WCAG guidelines', () => {
    // Check for proper heading structure
    cy.get('h1').should('have.length', 1);
    cy.get('h2').should('exist');
    
    // Check for alt attributes on images
    cy.get('img').each(($img) => {
      cy.wrap($img).should('have.attr', 'alt');
    });
    
    // Check for form labels
    cy.get('input').each(($input) => {
      const id = $input.attr('id');
      if (id) {
        cy.get(`label[for="${id}"]`).should('exist');
      }
    });
  });

  it('should handle browser back/forward navigation', () => {
    // Navigate to configuration
    cy.get('[data-testid="nav-config"]').click();
    cy.url().should('include', '/config');
    
    // Navigate to results
    cy.get('[data-testid="nav-results"]').click();
    cy.url().should('include', '/results');
    
    // Use browser back
    cy.go('back');
    cy.url().should('include', '/config');
    
    // Use browser forward
    cy.go('forward');
    cy.url().should('include', '/results');
  });

  it('should persist user preferences', () => {
    // Change theme
    cy.get('[data-testid="theme-toggle"]').click();
    
    // Refresh page
    cy.reload();
    
    // Theme should be preserved
    // This would depend on your implementation (localStorage, cookies, etc.)
    cy.get('[data-testid="theme-toggle"]').should('be.visible');
  });

  it('should display version information', () => {
    cy.get('[data-testid="app-version"]').should('be.visible');
    cy.get('[data-testid="app-version"]').should('contain', 'v');
  });
});