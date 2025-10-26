// src/services/emailService.js (Final Cleaned Version)

const imaps = require('imap-simple');
const { simpleParser } = require('mailparser');
const { format } = require('date-fns'); // Still used for logging
const { convert } = require('html-to-text');
const { getLastFetchTimestamp, updateLastFetchTimestamp, saveTransaction } = require('./dbService');
const { PARSER_RULES } = require('../config/parserRules.js');
const fetchState = require('./fetchStateService');

// --- DELETED ---
// Fungsi parseTransactionDate yang rumit sudah tidak diperlukan lagi.

/**
 * A universal number parser for '1.234,56' and '1,234.56' formats.
 * @param {string} currencyStr - The currency string from the email.
 * @returns {number} The parsed number.
 */
const parseAmount = (currencyStr) => {
  if (!currencyStr) return 0;
  let cleanStr = currencyStr.replace(/[^0-9.,]/g, '').trim();
  const lastComma = cleanStr.lastIndexOf(',');
  const lastDot = cleanStr.lastIndexOf('.');
  if (lastComma > lastDot) {
    cleanStr = cleanStr.replace(/\./g, '').replace(',', '.');
  } else if (lastDot > lastComma) {
    cleanStr = cleanStr.replace(/,/g, '');
  } else {
    cleanStr = cleanStr.replace(',', '.');
  }
  return parseFloat(cleanStr);
};

/**
 * Parses an email using simplified rules and the email's own received date.
 * @param {string} plainTextBody - The clean, plain-text content of the email.
 * @param {string} subject - The subject of the email.
 * @param {Date} emailDate - The date the email was received.
 * @returns {object|null} A structured transaction object or null.
 */
const parseEmailBody = (plainTextBody, subject, emailDate) => { // <-- CHANGED: Added emailDate
  for (const rule of PARSER_RULES) {
    const subjectMatch = rule.subjects.some(s => subject.toLowerCase().includes(s.toLowerCase()));

    if (subjectMatch) {
      const data = {};
      let allRequiredFound = true;

      for (const key in rule.patterns) {
        const match = plainTextBody.match(rule.patterns[key]);
        if (match && match[1]) {
          data[key] = match[1].trim().replace(/\s+/g, ' ');
        }
      }

      for (const field of rule.required_fields) {
        if (!data[field]) {
          allRequiredFound = false;
          break;
        }
      }

      if (allRequiredFound) {
        const description = rule.description.replace('{{description_target}}', data.description_target || '');
        
        // --- THIS IS THE FIX ---
        // We use the reliable email date. Use new Date() as a fallback.
        const transaction_date = emailDate || new Date();

        return {
          bank: rule.bank,
          type: rule.type,
          amount: parseAmount(data.amount),
          description,
          transaction_date, // <-- FIXED
          flow: rule.flow,
        };
      }
    }
  }
  return null;
};

const processEmails = async () => {
  const config = {
    imap: {
      user: process.env.IMAP_USER,
      password: process.env.IMAP_PASSWORD,
      host: process.env.IMAP_HOST,
      port: process.env.IMAP_PORT,
      tls: process.env.IMAP_TLS === 'true',
      tlsOptions: { rejectUnauthorized: false },
      authTimeout: 20000
    }
  };
  let connection;
  try {
    // 1. Get the *exact* last fetch timestamp (e.g., 2025-10-26 10:30:00)
    const lastFetchDate = await getLastFetchTimestamp();
    console.log(`Fetching emails since: ${format(lastFetchDate, 'yyyy-MM-dd HH:mm:ss')}`);

    connection = await imaps.connect(config);
    await connection.openBox('INBOX');

    // 2. Search criteria still uses DATE-only, as IMAP 'SINCE' requires.
    // This will fetch all emails from that day.
    const searchCriteria = [
      // We use the date part for the IMAP query
      ['SINCE', format(lastFetchDate, 'dd-LLL-yyyy')], 
      ['OR',
        ['FROM', 'bca@bca.co.id'],
        ['FROM', 'noreply.livin@bankmandiri.co.id']
      ]
    ];
    
    const fetchOptions = { bodies: [''] };
    const messages = await connection.search(searchCriteria, fetchOptions);
    console.log(`Found ${messages.length} emails from today to check.`);

    let processedCount = 0; // Counter for new emails

    for (const message of messages) {
      try {
        const rawMessageBodyPart = message.parts.find(part => part.which === '');
        if (!rawMessageBodyPart || !rawMessageBodyPart.body) continue;

        const parsedEmail = await simpleParser(rawMessageBodyPart.body);
        
        if (!parsedEmail || !parsedEmail.html || !parsedEmail.date) {
            console.log('⚠️  Skipping email: basic headers (html or date) not found.');
            continue;
        }

        // We manually check if the email's full datetime
        // is *newer* than our last saved timestamp.
        if (parsedEmail.date <= lastFetchDate) {
          // This email was already processed in the last run. Skip it.
          continue; 
        }

        const plainTextBody = convert(parsedEmail.html, {
          selectors: [{ selector: 'img', format: 'skip' }, { selector: 'a', options: { ignoreHref: true } }]
        });

        const parsedTransaction = parseEmailBody(plainTextBody, parsedEmail.subject || '', parsedEmail.date);
        
        if (parsedTransaction) {
          console.log('✅ Parsed Transaction:', parsedTransaction);
          await saveTransaction(parsedTransaction);
          console.log('💾 Transaction saved to database.');
          processedCount++; // Increment counter
        }
      } catch (perEmailError) {
        console.error(`❌ Error processing one email: ${perEmailError.message}. Skipping.`);
        continue;
      }
    }
    
    console.log(`Successfully processed ${processedCount} new emails.`);
    await updateLastFetchTimestamp(); // This will now run correctly

  } catch (error) {
    console.error(`❌ A major error occurred: ${error.message}`);
  } finally {
    if (connection) {
      console.log('Closing IMAP connection...');
      await connection.end();
    }

    // No matter what happens (success or error),
    // always release the lock when the process is finished.
    fetchState.endFetch();
  }
};

module.exports = { processEmails };