-- Adds admin-managed payment methods (GCash/Maya QR) + payment verification
-- Safe to run on an existing aniharvest_db (keeps your data)
USE aniharvest_db;

ALTER TABLE orders MODIFY payment_status ENUM('unpaid','for_verification','paid','rejected','refunded') NOT NULL DEFAULT 'unpaid';

CREATE TABLE IF NOT EXISTS payment_methods (
  id INT AUTO_INCREMENT PRIMARY KEY,
  provider VARCHAR(60) NOT NULL,          -- e.g. GCash, Maya, BPI
  account_name VARCHAR(120) NOT NULL,
  account_number VARCHAR(60) NOT NULL,
  qr_image VARCHAR(255) DEFAULT NULL,
  instructions VARCHAR(255) DEFAULT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS payment_submissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  purpose ENUM('cash_in','order') NOT NULL,
  order_id INT DEFAULT NULL,
  payment_method_id INT DEFAULT NULL,
  provider VARCHAR(60) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  reference_no VARCHAR(60) NOT NULL,
  proof_image VARCHAR(255) DEFAULT NULL,
  status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  admin_note VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP NULL DEFAULT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id) ON DELETE SET NULL,
  INDEX (status)
) ENGINE=InnoDB;
