const pool = require('../config/database');
const { format } = require('date-fns');

/**
 * Retrieves the last fetch timestamp from the database.
 * @returns {Date} The last fetch timestamp as a Date object.
 */
const getLastFetchTimestamp = async () => {
  const [rows] = await pool.query("SELECT key_value FROM app_state WHERE key_name = 'last_fetch_timestamp'");

  // If a timestamp is found in the DB, use it.
  if (rows.length > 0 && rows[0].key_value) {
    return new Date(rows[0].key_value);
  }

  // Fallback to the Unix epoch (January 1, 1970) if not found.
  // This instructs the IMAP server to fetch ALL emails since the beginning.
  console.log('No timestamp found. Fetching all emails since the beginning of time.');
  return new Date('1970-01-01T00:00:00Z');
};

/**
 * Updates the last fetch timestamp in the database.
 * This function now uses 'UPSERT' (INSERT ... ON DUPLICATE KEY UPDATE)
 * to ensure it works even if the row was deleted or truncated.
 */
const updateLastFetchTimestamp = async () => {
  const now = new Date();
  
  // This is the "UPSERT" command.
  const sql = `
    INSERT INTO app_state (key_name, key_value) 
    VALUES (?, ?)
    ON DUPLICATE KEY UPDATE key_value = ?;
  `;
  
  // The values array needs 'now' twice, one for INSERT, one for UPDATE.
  const values = ['last_fetch_timestamp', now, now];

  await pool.query(sql, values);
  console.log(`Timestamp updated (Upserted) to: ${format(now, 'yyyy-MM-dd HH:mm:ss')}`);
};

/**
 * Saves a single transaction to the database.
 * @param {object} transaction - The transaction object to save.
 */
const saveTransaction = async (transaction) => {
  const { bank, type, transaction_date, amount, description, flow } = transaction; // Add 'flow'
  const sql = 'INSERT INTO transactions (bank, type, transaction_date, amount, description, flow) VALUES (?, ?, ?, ?, ?, ?)'; // Add 'flow'
  await pool.query(sql, [bank, type, transaction_date, amount, description, flow]); // Add 'flow'
};

/**
 * Builds a dynamic and secure WHERE clause for transaction filtering.
 * @param {object} filters - An object containing all filter parameters.
 * @returns {object} An object with the WHERE clause string and the parameters array.
 */
const buildWhereClause = (filters) => {
  const whereClauses = [];
  const params = [];

  // This '1=1' is a common trick to safely append all other
  // clauses with 'AND' without worrying about the first one.
  whereClauses.push('1=1');

  if (filters.flow) {
    whereClauses.push('flow = ?');
    params.push(filters.flow);
  }
  if (filters.description) {
    whereClauses.push('description LIKE ?');
    params.push(`%${filters.description}%`); // Partial match
  }
  if (filters.date_start) {
    whereClauses.push('transaction_date >= ?');
    params.push(filters.date_start);
  }
  if (filters.date_end) {
    whereClauses.push('transaction_date <= ?');
    params.push(filters.date_end);
  }
  if (filters.amount_start) {
    whereClauses.push('amount >= ?');
    params.push(parseFloat(filters.amount_start));
  }
  if (filters.amount_end) {
    whereClauses.push('amount <= ?');
    params.push(parseFloat(filters.amount_end));
  }

  // Join all clauses with 'AND'
  return {
    sql: `WHERE ${whereClauses.join(' AND ')}`,
    params: params
  };
};

/**
 * Fetches a paginated and filtered list of transactions.
 * @param {number} page - The current page number (starts at 1).
 * @param {number} limit - The number of items per page.
 * @param {object} filters - An object containing all filter parameters.
 * @returns {object} An object with the transaction data and pagination info.
 */
const getTransactionsList = async (page, limit, filters) => {
  // 1. Build the dynamic WHERE clause
  const { sql: whereSql, params: whereParams } = buildWhereClause(filters);

  // 2. Get the TOTAL count of items that match the filters (for pagination)
  const countSql = `SELECT COUNT(*) as total FROM transactions ${whereSql}`;
  const [countRows] = await pool.query(countSql, whereParams);
  const totalItems = countRows[0].total;
  const totalPages = Math.ceil(totalItems / limit);

  // 3. Get the actual paginated data
  const offset = (page - 1) * limit;
  const dataSql = `
    SELECT * FROM transactions 
    ${whereSql} 
    ORDER BY transaction_date DESC 
    LIMIT ? OFFSET ?
  `;
  
  // We add pagination params AFTER the filter params
  const dataParams = [...whereParams, limit, offset];
  const [transactions] = await pool.query(dataSql, dataParams);

  // 4. Return the complete result
  return {
    // Information about the request
    pagination: {
      totalItems,
      totalPages,
      currentPage: page,
      itemsPerPage: limit
    },
    // The data itself
    data: transactions
  };  
};

/**
 * Fetches all transactions that have not yet been synced to Notion.
 * @returns {Array} A list of transaction objects.
 */
const getUnsyncedTransactions = async () => {
  const sql = "SELECT * FROM transactions WHERE is_synced_to_notion = FALSE ORDER BY transaction_date ASC LIMIT 50"; // Limit to 50 per batch
  const [rows] = await pool.query(sql);
  return rows;
};

/**
 * Marks a list of transactions as synced to Notion.
 * @param {Array<number>} ids - An array of transaction IDs.
 */
const markTransactionsAsSynced = async (ids) => {
  if (ids.length === 0) return;
  // Using '?' with an array automatically creates a '(id1, id2, ...)' list
  const sql = "UPDATE transactions SET is_synced_to_notion = TRUE WHERE id IN (?)";
  await pool.query(sql, [ids]);
};

module.exports = {
  getLastFetchTimestamp,
  updateLastFetchTimestamp,
  saveTransaction,
  getTransactionsList,
  getUnsyncedTransactions,
  markTransactionsAsSynced
};