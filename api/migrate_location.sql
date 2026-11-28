-- GPS delivery pins (safe to run more than once; keeps your data)
ALTER TABLE users  ADD COLUMN IF NOT EXISTS lat DECIMAL(10,7) NULL AFTER address;
ALTER TABLE users  ADD COLUMN IF NOT EXISTS lng DECIMAL(10,7) NULL AFTER lat;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_lat DECIMAL(10,7) NULL AFTER shipping_address;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_lng DECIMAL(10,7) NULL AFTER delivery_lat;
