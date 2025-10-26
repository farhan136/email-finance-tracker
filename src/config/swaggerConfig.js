/**
 * Swagger (OpenAPI) configuration file.
 * This defines the basic structure of the API documentation
 * and points to the files that contain the endpoint definitions.
 */

const options = {
  definition: {
    openapi: '3.0.0', // Specifies the OpenAPI version
    info: {
      title: 'Transaction Tracker API',
      version: '1.0.0',
      description: 'An API to fetch and manage personal bank transactions from emails.',
    },
    servers: [
      {
        url: 'http://localhost:3000', // Your base server URL
        description: 'Development server',
      },
    ],
  },
  // Path to the API docs. We will write our documentation in transactionRoutes.js
  apis: ['./src/routes/*.js'], 
};

module.exports = options;