# Email Transaction Tracker API

A Node.js + Express API that fetches bank transaction emails (BCA & Mandiri) via IMAP, parses them, stores to MySQL, allows manual inserts, lists with filters/pagination, and can sync unsynced rows to a Notion database. Swagger docs are available.

## Key Features
- Email Fetching (IMAP): Fetches emails from bank senders (Gmail tested)
- Smart Parsing: Regex-based rules extract amount/description/flow
- De-duplication: Uses last fetch timestamp in DB and exact email Date
- RESTful API: Trigger fetch, create manual transaction, list transactions
- Fetch Lock: In-memory lock prevents concurrent fetches
- Validation: Strict input validation for manual inserts
- API Docs: Auto-generated Swagger UI at `/api-docs`
- Notion Sync: Push unsynced transactions to a Notion database and mark them synced

## Getting Started

### 1) Prerequisites
- Node.js (v16+)
- npm
- MySQL server

### 2) Installation
Clone and install dependencies:

```bash
git clone <your-repository-url>
cd <your-project-folder>
npm install
```

### 3) Environment Setup (.env)
Create a `.env` file in the project root and fill it with your credentials.

```ini
# Server
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=your_database

# IMAP (Gmail)
# Use an App Password if 2FA is active
IMAP_USER=your_email@gmail.com
IMAP_PASSWORD=your_app_password
IMAP_HOST=imap.gmail.com
IMAP_PORT=993
IMAP_TLS=true

# Notion
NOTION_API_KEY=your_notion_integration_secret
NOTION_DATABASE_ID=your_notion_database_id
```

### 4) Database Migration
Run the migrations to set up `transactions` and `app_state` tables and additional columns:

```bash
npm run db:migrate
```

### Running the Application
Development (auto-reload):

```bash
npm run dev
```

Server runs at: http://localhost:3000 (or your `PORT`).

### API Documentation (Swagger)
Open: http://localhost:3000/api-docs

---

## API Endpoints (Summary)
- GET `/` → Health check
- POST `/api/transactions/fetch` → Trigger background email fetching
- POST `/api/transactions` → Create manual transaction (validated)
- GET `/api/transactions` → List with filters + pagination
- POST `/api/transactions/sync-notion` → Trigger background sync to Notion

### Create Manual Transaction (example)
```bash
curl -X POST http://localhost:3000/api/transactions \
  -H 'Content-Type: application/json' \
  -d '{
    "amount": 5000000,
    "description": "Gaji bulanan",
    "flow": "IN",
    "bank": "Manual",
    "transaction_type": "Gaji",
    "transaction_date": "2025-10-25T10:00:00Z"
  }'
```

### List Transactions (filters)
```bash
curl "http://localhost:3000/api/transactions?flow=IN&description=Gaji&page=1&limit=10"
```

---

## Sync to Notion
This project can sync unsynced MySQL transactions to a Notion database. It uses the following environment variables:
- `NOTION_API_KEY`: Create a Notion integration and copy its secret
- `NOTION_DATABASE_ID`: The target database ID (from the Notion DB URL)

Trigger sync:
```bash
curl -X POST http://localhost:3000/api/transactions/sync-notion
```
Response is 202 Accepted; the job runs in the background and is guarded by an in-memory lock to avoid concurrent runs.

### How it Works
- Selects up to 50 rows from `transactions` where `is_synced_to_notion = FALSE` (oldest first)
- Creates a Notion page for each transaction
- On success, marks those rows as synced: `is_synced_to_notion = TRUE`

### Required Notion Database Properties
Ensure your Notion database has properties with these exact names and types:
- Description → Title
- Amount → Number
- Flow → Select (values: IN, OUT)
- Bank → Select (e.g., BCA, Mandiri, Manual)
- Type → Select (e.g., Transfer, QRIS/Payment, Manual Input)
- Transaction Date → Date
- MySQL_ID → Number

If names or types differ, adjust `src/services/notionService.js` accordingly.

### Notes & Limits
- Notion rate limits: pages are created sequentially
- Batches are limited to 50 per run (edit in `getUnsyncedTransactions` if needed)
- Only unsynced rows are sent; re-runs are idempotent via the `is_synced_to_notion` flag

---

## Parsing Rules
Rules live in `src/config/parserRules.js`. They define bank/flow/subjects/type and regex patterns to extract `amount` and `description_target`, then build a human-friendly `description`. Current rules cover common OUTgoing BCA and Mandiri emails. Extend to support more subjects and IN flows as needed.

## Validation
Middleware at `src/middleware/validation.js` enforces:
- `amount`: positive number
- `description`: non-empty string
- `flow`: IN or OUT
- Optional `bank`: must be allowed (see `src/config/validation.config.json`)
- Optional `transaction_date`: ISO 8601 format

## Troubleshooting
- db-migrate errors → check DB_* env and permissions
- Gmail IMAP auth → use App Password and enable IMAP
- Duplicate saves → confirm server time and that email Date is used for filtering
- Notion sync errors → confirm NOTION_API_KEY/NOTION_DATABASE_ID and property names in Notion match those expected by the code

---

## Scripts
- `npm start` → node src/index.js
- `npm run dev` → nodemon src/index.js
- `npm run db:migrate` → db-migrate up
- `npm run db:rollback` → db-migrate down
