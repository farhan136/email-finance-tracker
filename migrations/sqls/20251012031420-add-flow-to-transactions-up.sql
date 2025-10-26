ALTER TABLE transactions 
ADD COLUMN flow ENUM('IN', 'OUT') NOT NULL COMMENT 'IN for income, OUT for expense';