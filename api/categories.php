<?php
require __DIR__ . '/config.php';

$rows = db()->query(
    "SELECT c.*, (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id AND p.status = 'active') AS product_count
     FROM categories c ORDER BY c.id"
)->fetchAll();
json_out($rows);
