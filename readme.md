Email Transaction Tracker API

This is a simple Node.js and Express API designed to automatically fetch and parse bank transaction notifications (BCA & Mandiri) from an email inbox (via IMAP) and save them to a MySQL database.

The API also provides RESTful endpoints to add transactions manually (e.g., for income) and retrieve filtered, paginated data.

Key Features

Email Fetching: Connects to an IMAP account (tested with Gmail) to fetch new emails from specified bank senders.

Smart Parsing: Uses regex rules from a config file to parse details (amount, description, flow) from the email body.

State Management: Tracks the last fetch timestamp in the database to prevent duplicate processing.

RESTful API: Provides endpoints to trigger fetching, add manual data, and retrieve data.

Fetch Lock: Prevents multiple email fetch processes from running concurrently.

Input Validation: Strict validation for all manual API inputs.

API Documentation: Auto-generated, interactive API documentation using Swagger.

Getting Started

1. Prerequisites

Node.js (v16 or later)

npm

A running MySQL server

2. Installation

Clone the repository:

git clone <your-repository-url>
cd <your-project-folder>


Install dependencies:

npm install


3. Environment Setup (.env)

Create a .env file in the project root and fill it with your credentials.

# Server Configuration
PORT=3000

# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=your_database

# IMAP (Gmail) Configuration
# Make sure to use an "App Password" if 2FA is active
IMAP_USER=your_email@gmail.com
IMAP_PASSWORD=your_app_password
IMAP_HOST=imap.gmail.com
IMAP_PORT=993
IMAP_TLS=true


4. Database Migration

Run the migration to set up the transactions and app_state tables in your database.

npm run db:migrate


Running the Application

To run the server in development mode (with auto-reload):

npm run dev


The server will run on http://localhost:3000 (or your specified PORT).

API Documentation (Swagger)

Once the server is running, you can access the complete, interactive API documentation in your browser.

Open this URL:
http://localhost:3000/api-docs

From there, you can see all endpoints, data schemas, and test each API directly.