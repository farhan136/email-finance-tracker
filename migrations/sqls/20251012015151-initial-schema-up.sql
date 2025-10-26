-- migrations/sqls/YYYYMMDDHHMMSS-initial-schema-up.sql

-- Table to store transaction data
CREATE TABLE `transactions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `bank` VARCHAR(20) NOT NULL,
  `type` VARCHAR(50) NOT NULL,
  `transaction_date` DATETIME NOT NULL,
  `amount` DECIMAL(15, 2) NOT NULL,
  `description` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table to store application state, like the last fetch time
CREATE TABLE `app_state` (
  `key_name` VARCHAR(50) PRIMARY KEY,
  `key_value` VARCHAR(255)
);

-- Insert the initial timestamp so our app doesn't fetch everything on first run
-- We set it to one week ago from now. Adjust if needed.
INSERT INTO `app_state` (key_name, key_value) VALUES ('last_fetch_timestamp', NOW() - INTERVAL 7 DAY);