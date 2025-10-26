const { Client } = require('@notionhq/client');
const { getUnsyncedTransactions, markTransactionsAsSynced } = require('./dbService');

// Initialize Notion Client
const notion = new Client({ auth: process.env.NOTION_API_KEY });
const DATABASE_ID = process.env.NOTION_DATABASE_ID;

/**
 * Formats a transaction from our database into the Notion API format.
 * @param {object} transaction - The transaction object from MySQL.
 * @returns {object} The object formatted for Notion's pages.create API.
 */
const formatTransactionForNotion = (transaction) => {
  return {
    parent: { database_id: DATABASE_ID },
    properties: {
      // 'Title' property
      'Description': {
        title: [{ text: { content: transaction.description || 'N/A' } }]
      },
      'Amount': {
        // We must convert the amount from a string (e.g., "50205.00")
        // to a number (e.g., 50205.00) before sending.
        number: parseFloat(transaction.amount)
      },
      'Flow': {
        select: { name: transaction.flow }
      },
      'Bank': {
        select: { name: transaction.bank }
      },
      'Type': {
        select: { name: transaction.type }
      },
      'Transaction Date': {
        date: { start: new Date(transaction.transaction_date).toISOString() }
      },
      'MySQL_ID': {
        number: transaction.id
      }
    }
  };
};

/**
 * Fetches unsynced transactions from MySQL and syncs them to Notion.
 */
const syncTransactionsToNotion = async () => {
  console.log('Starting Notion Sync...');
  let syncedIds = [];

  try {
    const transactions = await getUnsyncedTransactions();
    if (transactions.length === 0) {
      console.log('No new transactions to sync to Notion.');
      return;
    }

    console.log(`Found ${transactions.length} new transactions to sync...`);

    // We process requests one by one to respect Notion's rate limits
    for (const tx of transactions) {
      try {
        const notionPageData = formatTransactionForNotion(tx);
        await notion.pages.create(notionPageData);
        // If successful, add its ID to the list to be marked as 'synced'
        syncedIds.push(tx.id);
      } catch (apiError) {
        console.error(`Failed to sync transaction ID ${tx.id} to Notion:`, apiError.message);
      }
    }

  } catch (error) {
    console.error('Error during Notion sync process:', error);
  } finally {
    // After the loop (or if an error occurs), mark all successful
    // transactions as synced in our local database.
    if (syncedIds.length > 0) {
      console.log(`Marking ${syncedIds.length} transactions as synced...`);
      await markTransactionsAsSynced(syncedIds);
    }
    console.log('Notion Sync finished.');
  }
};

module.exports = { syncTransactionsToNotion };