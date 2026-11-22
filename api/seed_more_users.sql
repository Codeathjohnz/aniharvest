-- Extra sample buyers and farmers (with products) for AniHarvest.
-- Safe to run more than once: existing emails are skipped.
-- Passwords:  buyers = buyer123   farmers = farmer123
USE aniharvest_db;

SET @buyer_pw  = '$2y$10$Ty0pHTdJnCfqwjOPGkyRN.cKvSm7DvHdgLbAJkgIYzmAVBud5xiGC';
SET @farmer_pw = '$2y$10$vwMfyF/scnQ4gI2jkHDqnu2QyDVlCYuY7pt7AcvjYvVRP6qh6rVfC';

-- ---------- Buyers ----------
INSERT IGNORE INTO users (name, email, password, role, phone, address) VALUES
('Maria Clara Reyes',   'maria.reyes@aniharvest.com',   @buyer_pw, 'buyer', '09181234501', '45 Mabini St., Makati City'),
('Jose Bautista',       'jose.bautista@aniharvest.com', @buyer_pw, 'buyer', '09181234502', '12 Katipunan Ave., Quezon City'),
('Angelica Villanueva', 'angelica.v@aniharvest.com',    @buyer_pw, 'buyer', '09181234503', '88 Osmeña Blvd., Cebu City'),
('Mark Anthony Garcia', 'mark.garcia@aniharvest.com',   @buyer_pw, 'buyer', '09181234504', '7 Burgos St., Tagum City'),
('Kristine Mendoza',    'kristine.m@aniharvest.com',    @buyer_pw, 'buyer', '09181234505', '230 Lacson St., Bacolod City'),
('Paolo Fernandez',     'paolo.f@aniharvest.com',       @buyer_pw, 'buyer', '09181234506', '15 J.P. Laurel Ave., Davao City'),
('Grace Tan',           'grace.tan@aniharvest.com',     @buyer_pw, 'buyer', '09181234507', '3 Session Rd., Baguio City'),
('Ramon Aquino',        'ramon.aquino@aniharvest.com',  @buyer_pw, 'buyer', '09181234508', '61 Rizal Ave., Iloilo City');

-- ---------- Farmers ----------
INSERT IGNORE INTO users (name, email, password, role, phone, address, farm_name) VALUES
('Mang Tomas Ramirez',  'tomas.ramirez@aniharvest.com', @farmer_pw, 'farmer', '09191234501', 'Brgy. San Isidro, Bukidnon',       'Ramirez Highland Farm'),
('Aling Nena Castillo', 'nena.castillo@aniharvest.com', @farmer_pw, 'farmer', '09191234502', 'Guimaras Island',                  'Castillo Mango Orchard'),
('Rodel Pascual',       'rodel.pascual@aniharvest.com', @farmer_pw, 'farmer', '09191234503', 'San Jose City, Nueva Ecija',       'Pascual Rice Fields'),
('Liza Domingo',        'liza.domingo@aniharvest.com',  @farmer_pw, 'farmer', '09191234504', 'Tagaytay City, Cavite',            'Domingo Organic Garden'),
('Ernesto Navarro',     'ernesto.n@aniharvest.com',     @farmer_pw, 'farmer', '09191234505', 'Lipa City, Batangas',              'Navarro Poultry & Eggs');

-- ---------- Products for the new farmers ----------
-- (only added if that farmer doesn't already have a product with the same name)
INSERT INTO products (farmer_id, category_id, name, description, price, unit, stock, emoji, is_organic)
SELECT u.id, c.id, p.name, p.descr, p.price, p.unit, p.stock, p.emoji, p.organic
FROM (
  SELECT 'tomas.ramirez@aniharvest.com' email, 'vegetables' cat, 'Highland Cabbage' name, 'Firm, crisp cabbage grown in cool Bukidnon highlands.' descr, 65.00 price, 'kg' unit, 150 stock, '🥬' emoji, 0 organic
  UNION ALL SELECT 'tomas.ramirez@aniharvest.com', 'vegetables', 'Sweet Corn', 'Golden sweet corn, perfect for boiling or grilling.', 25.00, 'piece', 300, '🌽', 0
  UNION ALL SELECT 'tomas.ramirez@aniharvest.com', 'fruits', 'Pineapple', 'Juicy, sweet Bukidnon pineapples.', 80.00, 'piece', 90, '🍍', 0
  UNION ALL SELECT 'nena.castillo@aniharvest.com', 'fruits', 'Guimaras Mango', 'World-famous sweet Guimaras mangoes.', 180.00, 'kg', 120, '🥭', 1
  UNION ALL SELECT 'nena.castillo@aniharvest.com', 'fruits', 'Green Mango (Indian)', 'Crunchy, tangy green mangoes — great with bagoong.', 95.00, 'kg', 60, '🥭', 0
  UNION ALL SELECT 'nena.castillo@aniharvest.com', 'seeds', 'Mango Seedlings', 'Grafted carabao mango seedlings ready for planting.', 250.00, 'piece', 40, '🌱', 1
  UNION ALL SELECT 'rodel.pascual@aniharvest.com', 'grains', 'Sinandomeng Rice', 'Everyday well-milled rice, soft and fluffy.', 52.00, 'kg', 800, '🌾', 0
  UNION ALL SELECT 'rodel.pascual@aniharvest.com', 'grains', 'Brown Rice', 'Unpolished, fiber-rich brown rice.', 75.00, 'kg', 250, '🌾', 1
  UNION ALL SELECT 'rodel.pascual@aniharvest.com', 'grains', 'Malagkit (Glutinous Rice)', 'Sticky rice for suman, biko and champorado.', 85.00, 'kg', 150, '🍚', 0
  UNION ALL SELECT 'liza.domingo@aniharvest.com', 'vegetables', 'Organic Lettuce Mix', 'Fresh romaine and green ice lettuce, pesticide-free.', 120.00, 'bundle', 70, '🥗', 1
  UNION ALL SELECT 'liza.domingo@aniharvest.com', 'herbs', 'Lemongrass (Tanglad)', 'Fragrant lemongrass for tea and cooking.', 40.00, 'bundle', 100, '🌿', 1
  UNION ALL SELECT 'liza.domingo@aniharvest.com', 'vegetables', 'Eggplant (Talong)', 'Long purple eggplants, freshly picked.', 70.00, 'kg', 90, '🍆', 1
  UNION ALL SELECT 'ernesto.n@aniharvest.com', 'dairy', 'Fresh Duck Eggs', 'Large duck eggs, great for itlog na maalat.', 240.00, 'tray', 35, '🥚', 0
  UNION ALL SELECT 'ernesto.n@aniharvest.com', 'livestock', 'Free-Range Chicken (Whole)', 'Pasture-raised chicken, dressed and cleaned.', 320.00, 'kg', 30, '🐔', 0
  UNION ALL SELECT 'ernesto.n@aniharvest.com', 'dairy', 'Quail Eggs', 'Fresh quail eggs, 50 pieces per pack.', 95.00, 'pack', 80, '🥚', 0
) p
JOIN users u ON u.email = p.email
JOIN categories c ON c.slug = p.cat
WHERE NOT EXISTS (SELECT 1 FROM products x WHERE x.farmer_id = u.id AND x.name = p.name);
