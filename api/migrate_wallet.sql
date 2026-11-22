-- Adds the e-wallet feature to an existing aniharvest_db (keeps your data)
USE aniharvest_db;

ALTER TABLE users ADD COLUMN IF NOT EXISTS wallet_balance DECIMAL(12,2) NOT NULL DEFAULT 0 AFTER farm_name;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status ENUM('unpaid','paid','refunded') NOT NULL DEFAULT 'unpaid' AFTER payment_method;

CREATE TABLE IF NOT EXISTS wallet_transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  type ENUM('cash_in','payment','refund','earning','withdraw') NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  balance_after DECIMAL(12,2) NOT NULL,
  method VARCHAR(40) DEFAULT NULL,
  account VARCHAR(40) DEFAULT NULL,
  reference VARCHAR(40) NOT NULL,
  order_id INT DEFAULT NULL,
  description VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX (user_id)
) ENGINE=InnoDB;
