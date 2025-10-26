ALTER TABLE transactions
ADD COLUMN is_synced_to_notion BOOLEAN NOT NULL DEFAULT FALSE,
ADD INDEX idx_synced (is_synced_to_notion);