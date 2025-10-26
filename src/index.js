// src/index.js (Final API Server)

require('dotenv').config();
const express = require('express');
const transactionRoutes = require('./routes/transactionRoutes');

// --- Swagger Imports ---
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerOptions = require('./config/swaggerConfig.js');
// -----------------------

const app = express();
const PORT = process.env.PORT || 3000;

// --- MIDDLEWARE ---
// This is essential for our new POST routes
// It allows Express to read JSON data from the request body.
app.use(express.json());

// --- Swagger Setup ---
// Generate the Swagger specification
const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Serve the Swagger UI documentation at the /api-docs route
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
// ---------------------

// --- ROUTES ---
// A simple route to check if the API is alive.
app.get('/', (req, res) => {
  res.status(200).json({ message: 'Transaction Tracker API is running.' });
});

// Use our new router for all routes starting with /api/transactions
app.use('/api/transactions', transactionRoutes);


// --- SERVER START ---
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log('Ready to receive API requests.');
  // The automatic call to processEmails() has been removed.
});