// src/controllers/transactionController.js

const { processEmails } = require('../services/emailService');
const { 
  saveTransaction, 
  getTransactionsList
} = require('../services/dbService');
const { syncTransactionsToNotion } = require('../services/notionService');
const taskState = require('../services/taskStateService');


/**
 * Controller to trigger the email fetching process.
 */
const triggerFetch = async (req, res) => {
  const TASK_NAME = 'email_fetch'; // Define task name
  
  // Use new function name
  if (taskState.isTaskRunning(TASK_NAME)) {
    return res.status(409).json({ 
      message: 'An email fetch process is already running. Please wait.' 
    });
  }

  try {
    taskState.startTask(TASK_NAME); // Use new function name
    processEmails();
    res.status(202).json({ 
      message: 'Accepted. Email processing has been started.' 
    });
  } catch (error) {
    taskState.endTask(TASK_NAME); // Use new function name
    console.error('Error triggering email fetch:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

/**
 * Controller to manually create a new transaction.
 * This function now assumes data is already validated by the middleware.
 */
const createManualTransaction = async (req, res) => {
  try {
    // Data is already validated by validateTransaction middleware
    const { bank, transaction_type, amount, description, flow, transaction_date } = req.body;

    const newTransaction = {
      bank: bank || 'Manual',
      type: transaction_type || 'Manual Input',
      amount: parseFloat(amount),
      description,
      flow,
      transaction_date: transaction_date ? new Date(transaction_date) : new Date()
    };

    await saveTransaction(newTransaction);

    res.status(201).json({ 
      message: 'Transaction created successfully', 
      data: newTransaction 
    });
  } catch (error)
 {
    console.error('Error creating manual transaction:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

/**
 * Controller to fetch, filter, and paginate transactions.
 */
const getTransactions = async (req, res) => {
  try {
    // 1. Parse Pagination parameters
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;

    // 2. Collect Filter parameters
    const filters = {
      flow: req.query.flow,
      description: req.query.description,
      date_start: req.query.date_start,
      date_end: req.query.date_end,
      amount_start: req.query.amount_start,
      amount_end: req.query.amount_end
    };

    // 3. Call the service layer to get the data
    const result = await getTransactionsList(page, limit, filters);

    // 4. Send the successful response
    res.status(200).json(result);

  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

/**
 * Controller to trigger the Notion DB sync process.
 */
const triggerNotionSync = async (req, res) => {
  const TASK_NAME = 'notion_sync';

  if (taskState.isTaskRunning(TASK_NAME)) {
    return res.status(409).json({
      message: 'A Notion sync process is already running. Please wait.'
    });
  }

  try {
    taskState.startTask(TASK_NAME);
    // We call this *without* await so the user gets an instant response
    // The 'finally' block inside syncTransactionsToNotion will end the task
    syncTransactionsToNotion().finally(() => {
      taskState.endTask(TASK_NAME);
    });

    res.status(202).json({
      message: 'Accepted. Notion sync has been started.'
    });

  } catch (error) {
    taskState.endTask(TASK_NAME);
    console.error('Error triggering Notion sync:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

module.exports = {
  triggerFetch,
  createManualTransaction,
  getTransactions,
  triggerNotionSync
};