-- AniHarvest Marketplace database
-- Import in phpMyAdmin, or open http://localhost/April/api/install.php

CREATE DATABASE IF NOT EXISTS aniharvest_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE aniharvest_db;

DROP TABLE IF EXISTS payment_submissions;
DROP TABLE IF EXISTS payment_methods;
DROP TABLE IF EXISTS wallet_transactions;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('buyer','farmer','admin') NOT NULL DEFAULT 'buyer',
  phone VARCHAR(40) DEFAULT NULL,
  address VARCHAR(255) DEFAULT NULL,
  farm_name VARCHAR(150) DEFAULT NULL,
  wallet_balance DECIMAL(12,2) NOT NULL DEFAULT 0,
  token VARCHAR(100) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(80) NOT NULL,
  slug VARCHAR(80) NOT NULL UNIQUE,
  icon VARCHAR(16) NOT NULL DEFAULT '🌱'
) ENGINE=InnoDB;

CREATE TABLE products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  farmer_id INT NOT NULL,
  category_id INT NOT NULL,
  name VARCHAR(150) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  unit VARCHAR(30) NOT NULL DEFAULT 'kg',
  stock INT NOT NULL DEFAULT 0,
  image VARCHAR(255) DEFAULT NULL,
  emoji VARCHAR(16) DEFAULT '🌱',
  is_organic TINYINT(1) NOT NULL DEFAULT 0,
  status ENUM('active','inactive') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (farmer_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id)
) ENGINE=InnoDB;

CREATE TABLE orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  buyer_id INT NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  status ENUM('pending','processing','shipped','delivered','cancelled') NOT NULL DEFAULT 'pending',
  shipping_address VARCHAR(255) NOT NULL,
  phone VARCHAR(40) NOT NULL,
  payment_method VARCHAR(40) NOT NULL DEFAULT 'Cash on Delivery',
  payment_status ENUM('unpaid','for_verification','paid','rejected','refunded') NOT NULL DEFAULT 'unpaid',
  notes VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT DEFAULT NULL,
  farmer_id INT NOT NULL,
  product_name VARCHAR(150) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  quantity INT NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- E-wallet ledger: every peso in or out of a wallet is recorded here
CREATE TABLE wallet_transactions (
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

-- Payment accounts the admin publishes (GCash / Maya / bank) with a QR code
CREATE TABLE payment_methods (
  id INT AUTO_INCREMENT PRIMARY KEY,
  provider VARCHAR(60) NOT NULL,
  account_name VARCHAR(120) NOT NULL,
  account_number VARCHAR(60) NOT NULL,
  qr_image VARCHAR(255) DEFAULT NULL,
  instructions VARCHAR(255) DEFAULT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Payments sent by buyers (reference no. + screenshot) waiting for admin verification
CREATE TABLE payment_submissions (
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

-- Seed users  (admin123 / farmer123 / buyer123)
INSERT INTO users (name, email, password, role, phone, address, farm_name) VALUES
('Site Admin', 'admin@aniharvest.com', '$2y$10$tLgnEYoLWjI9kyP9JwMKUeUh9y8kIBPX7syPqTDwPrRL/Qm0novDq', 'admin', '09170000000', 'Main Office', NULL),
('Mang Pedro Santos', 'farmer@aniharvest.com', '$2y$10$vwMfyF/scnQ4gI2jkHDqnu2QyDVlCYuY7pt7AcvjYvVRP6qh6rVfC', 'farmer', '09171111111', 'Brgy. Malinis, Nueva Ecija', 'Santos Family Farm'),
('Aling Rosa Dela Cruz', 'rosa@aniharvest.com', '$2y$10$vwMfyF/scnQ4gI2jkHDqnu2QyDVlCYuY7pt7AcvjYvVRP6qh6rVfC', 'farmer', '09172222222', 'La Trinidad, Benguet', 'Highland Greens'),
('Juan Buyer', 'buyer@aniharvest.com', '$2y$10$Ty0pHTdJnCfqwjOPGkyRN.cKvSm7DvHdgLbAJkgIYzmAVBud5xiGC', 'buyer', '09173333333', '123 Rizal St., Quezon City', NULL);

INSERT INTO categories (name, slug, icon) VALUES
('Vegetables', 'vegetables', '🥬'),
('Fruits', 'fruits', '🍎'),
('Grains & Rice', 'grains', '🌾'),
('Dairy & Eggs', 'dairy', '🥚'),
('Livestock & Poultry', 'livestock', '🐔'),
('Herbs & Spices', 'herbs', '🌿'),
('Root Crops', 'root-crops', '🥔'),
('Seeds & Seedlings', 'seeds', '🌱');

INSERT INTO products (farmer_id, category_id, name, description, price, unit, stock, emoji, is_organic) VALUES
(2, 3, 'Premium Dinorado Rice', 'Aromatic, soft and freshly milled rice from the plains of Nueva Ecija.', 62.00, 'kg', 500, '🌾', 0),
(2, 1, 'Fresh Pechay', 'Crisp, leafy pechay harvested every morning. Perfect for soups and stir-fry.', 45.00, 'bundle', 120, '🥬', 1),
(2, 2, 'Carabao Mango', 'Sweet, golden mangoes picked at peak ripeness.', 140.00, 'kg', 80, '🥭', 0),
(2, 4, 'Free-Range Brown Eggs', 'Eggs from happy, pasture-raised hens.', 210.00, 'tray', 40, '🥚', 1),
(2, 5, 'Native Chicken (Dressed)', 'Naturally raised native chicken, cleaned and ready to cook.', 380.00, 'kg', 25, '🐔', 0),
(3, 1, 'Highland Broccoli', 'Cool-climate broccoli from the mountains of Benguet.', 160.00, 'kg', 60, '🥦', 1),
(3, 1, 'Baguio Carrots', 'Sweet and crunchy carrots, great for salads and stews.', 85.00, 'kg', 150, '🥕', 1),
(3, 2, 'Strawberries', 'Hand-picked La Trinidad strawberries.', 320.00, 'kg', 35, '🍓', 1),
(3, 6, 'Fresh Basil', 'Fragrant sweet basil for pesto and pasta.', 60.00, 'bundle', 50, '🌿', 1),
(3, 7, 'Sweet Potato (Kamote)', 'Nutritious purple and orange sweet potatoes.', 55.00, 'kg', 200, '🍠', 0),
(3, 7, 'Potatoes', 'Highland potatoes ideal for frying and mashing.', 75.00, 'kg', 180, '🥔', 0),
(2, 2, 'Lakatan Banana', 'Sweet lakatan bananas sold per hand.', 90.00, 'hand', 70, '🍌', 0),
(2, 1, 'Tomatoes', 'Juicy vine-ripened tomatoes.', 70.00, 'kg', 100, '🍅', 0),
(3, 8, 'Lettuce Seedlings', 'Healthy romaine seedlings ready for transplanting (tray of 50).', 150.00, 'tray', 30, '🌱', 1),
(2, 6, 'Native Garlic', 'Small but potent Ilocos-style native garlic.', 240.00, 'kg', 45, '🧄', 0),
(3, 4, 'Fresh Carabao Milk', 'Creamy, pasteurized carabao milk.', 120.00, 'liter', 30, '🥛', 0);
