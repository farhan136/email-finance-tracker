// src/routes/transactionRoutes.js

const express = require('express');
const router = express.Router();
const { 
  triggerFetch, 
  createManualTransaction,
  getTransactions,
  triggerNotionSync
} = require('../controllers/transactionController');
const { validateTransaction } = require('../middleware/validation.js');

/**
 * @swagger
 * components:
 *   schemas:
 *     TransactionInput:
 *       type: object
 *       required:
 *         - amount
 *         - description
 *         - flow
 *       properties:
 *         amount:
 *           type: number
 *           format: double
 *           description: The transaction amount. Must be a positive number.
 *           example: 5000000
 *         description:
 *           type: string
 *           description: A brief description of the transaction.
 *           example: "Gaji bulanan"
 *         flow:
 *           type: string
 *           description: The flow of the transaction.
 *           enum: [IN, OUT]
 *           example: "IN"
 *         bank:
 *           type: string
 *           description: The bank name.
 *           enum: [BCA, Mandiri, Manual, Other]
 *           example: "BCA"
 *         transaction_type:
 *           type: string
 *           description: The type of transaction (e.g., Gaji, QRIS).
 *           example: "Gaji"
 *         transaction_date:
 *           type: string
 *           format: date-time
 *           description: The date of the transaction in ISO 8601 format (YYYY-MM-DDTHH:MM:SSZ). Defaults to now if not provided.
 *           example: "2025-10-25T10:00:00Z"
 *     ValidationError:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: "Validation failed."
 *         errors:
 *           type: array
 *           items:
 *             type: string
 *             example: "Field 'amount' must be a positive number."
 */

/**
 * @swagger
 * /api/transactions/fetch:
 *   post:
 *     summary: Trigger email fetching
 *     tags: [Transactions]
 *     description: Triggers the background process to fetch new transaction emails from the IMAP server. This is a "fire-and-forget" endpoint.
 *     responses:
 *       '202':
 *         description: Accepted. The email processing has been started in the background.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Accepted. Email processing has been started."
 *       '500':
 *         description: Internal Server Error
 */
router.post('/fetch', triggerFetch);

/**
 * @swagger
 * /api/transactions:
 *   post:
 *     summary: Create a manual transaction
 *     tags: [Transactions]
 *     description: Manually adds a new transaction to the database. Used for 'IN' flow or any transaction not captured via email.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TransactionInput'
 *     responses:
 *       '201':
 *         description: Transaction created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Transaction created successfully"
 *                 data:
 *                   $ref: '#/components/schemas/TransactionInput'
 *       '400':
 *         description: Validation failed. Check the error messages.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       '500':
 *         description: Internal Server Error
 */
router.post('/', validateTransaction, createManualTransaction);

/**
 * @swagger
 * /api/transactions:
 *   get:
 *     summary: Get all transactions with filters and pagination
 *     tags: [Transactions]
 *     description: Fetches a list of all transactions from the database, with support for advanced filtering and pagination.
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: The page number to retrieve.
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: The number of transactions to return per page.
 *       - in: query
 *         name: flow
 *         schema:
 *           type: string
 *           enum: [IN, OUT]
 *         description: Filter by transaction flow (IN or OUT).
 *       - in: query
 *         name: description
 *         schema:
 *           type: string
 *         description: Filter by description (performs a partial, case-insensitive match).
 *       - in: query
 *         name: date_start
 *         schema:
 *           type: string
 *           format: date
 *         description: The start date for the filter range (YYYY-MM-DD).
 *       - in: query
 *         name: date_end
 *         schema:
 *           type: string
 *           format: date
 *         description: The end date for the filter range (YYYY-MM-DD).
 *       - in: query
 *         name: amount_start
 *         schema:
 *           type: number
 *         description: The minimum transaction amount for the filter range.
 *       - in: query
 *         name: amount_end
 *         schema:
 *           type: number
 *         description: The maximum transaction amount for the filter range.
 *     responses:
 *       '200':
 *         description: A paginated list of transactions.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     totalItems:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     currentPage:
 *                       type: integer
 *                     itemsPerPage:
 *                       type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object 
 *                     properties:
 *                       id:
 *                         type: integer
 *                       bank:
 *                         type: string
 *                       transaction_type:
 *                         type: string
 *                       amount:
 *                         type: number
 *                       description:
 *                         type: string
 *                       flow:
 *                         type: string
 *                       transaction_date:
 *                         type: string
 *                         format: date-time
 *       '500':
 *         description: Internal Server Error
 */
router.get('/', getTransactions);

/**
 * @swagger
 * /api/transactions/sync-notion:
 *   post:
 *     summary: Sync transactions to Notion
 *     tags: [Notion]
 *     description: Triggers a background process to sync all unsynced local transactions to the configured Notion database.
 *     responses:
 *       '202':
 *         description: Accepted. Notion sync has been started.
 *       '409':
 *         description: A sync process is already running.
 *       '500':
 *         description: Internal Server Error
 */
router.post('/sync-notion', triggerNotionSync);

module.exports = router;
