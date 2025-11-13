/**
 * Cypress configuration for hydraulic network web application
 */

import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    // Base URL for the application
    baseUrl: 'http://localhost:3000',
    
    // Test file patterns
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    
    // Support file
    supportFile: 'cypress/support/e2e.js',
    
    // Fixtures folder
    fixturesFolder: 'cypress/fixtures',
    
    // Screenshots and videos
    screenshotsFolder: 'cypress/screenshots',
    videosFolder: 'cypress/videos',
    
    // Video recording
    video: true,
    videoCompression: 32,
    
    // Screenshot settings
    screenshotOnRunFailure: true,
    
    // Viewport settings
    viewportWidth: 1280,
    viewportHeight: 720,
    
    // Default command timeout
    defaultCommandTimeout: 10000,
    
    // Request timeout
    requestTimeout: 10000,
    
    // Response timeout
    responseTimeout: 10000,
    
    // Test isolation
    testIsolation: true,
    
    // Setup node events
    setupNodeEvents(on, config) {
      // Implement plugins here
      
      // Code coverage plugin
      require('@cypress/code-coverage/task')(on, config);
      
      // Screenshots on failure plugin
      on('task', {
        log(message) {
          console.log(message);
          return null;
        },
        table(message) {
          console.table(message);
          return null;
        },
      });
      
      return config;
    },
  },
  
  // Component testing
  component: {
    devServer: {
      framework: 'react',
      bundler: 'vite',
    },
    
    // Component test file patterns
    specPattern: 'src/**/*.cy.{js,jsx,ts,tsx}',
    
    // Support file for component tests
    supportFile: 'cypress/support/component.js',
  },
  
  // Environment variables
  env: {
    apiUrl: 'http://localhost:8000/api',
    testUser: 'test@example.com',
    testPassword: 'testpassword',
  },
  
  // Retry settings
  retries: {
    runMode: 2,
    openMode: 0,
  },
  
  // Experimental features
  experimentalSessionAndOrigin: true,
  experimentalStudio: true,
});