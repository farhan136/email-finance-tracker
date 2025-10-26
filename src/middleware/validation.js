// src/middleware/validation.js

const config = require('../config/validation.config.json');

// A regex to validate ISO 8601 date format (YYYY-MM-DDTHH:MM:SSZ)
const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/;

/**
 * Middleware to validate the body of a manual transaction request.
 * It checks for required fields, data types, and allowed values.
 */
const validateTransaction = (req, res, next) => {
  const { bank, type, amount, description, flow, transaction_date } = req.body;
  const errors = [];

  // Rule 1: 'amount' must be a positive number
  if (typeof amount !== 'number' || amount <= 0) {
    errors.push('Field \'amount\' must be a positive number.');
  }

  // Rule 2: 'description' must be a non-empty string
  if (typeof description !== 'string' || description.trim() === '') {
    errors.push('Field \'description\' must be a non-empty string.');
  }

  // Rule 3: 'flow' must be one of the allowed values from config
  if (!flow || !config.allowed_flows.includes(flow)) {
    errors.push(`Field 'flow' is required and must be one of: [${config.allowed_flows.join(', ')}]`);
  }

  // Rule 4: 'bank' (if provided) must be one of the allowed values
  if (bank && !config.allowed_banks.includes(bank)) {
    errors.push(`Field 'bank' must be one of: [${config.allowed_banks.join(', ')}]`);
  }

  // Rule 5: 'transaction_date' (if provided) must be in valid ISO format
  if (transaction_date && !isoDateRegex.test(transaction_date)) {
    errors.push('Field \'transaction_date\' must be a valid ISO 8601 string (e.g., 2025-10-25T10:00:00Z).');
  }

  // If any errors were found, send a 400 Bad Request response
  if (errors.length > 0) {
    return res.status(400).json({
      message: 'Validation failed.',
      errors: errors
    });
  }

  // If all checks pass, proceed to the next function (the controller)
  next();
};

module.exports = { validateTransaction };