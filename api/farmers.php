<?php
// Public farmer stores: list/search (GET ?q=) and a single store (GET ?id=)
require __DIR__ . '/config.php';

$base = "SELECT u.id, u.name, u.farm_name, u.address, u.created_at,
                COUNT(p.id) AS product_count,
                SUM(p.is_organic = 1) AS organic_count,
                MIN(p.price) AS min_price,
                GROUP_CONCAT(DISTINCT c.name ORDER BY c.id SEPARATOR ', ') AS category_names,
                (SELECT GROUP_CONCAT(p2.emoji ORDER BY p2.id SEPARATOR '') FROM
                    (SELECT emoji, id, farmer_id FROM products WHERE status = 'active') p2
                  WHERE p2.farmer_id = u.id) AS product_emojis
         FROM users u
         LEFT JOIN products p ON p.farmer_id = u.id AND p.status = 'active'
         LEFT JOIN categories c ON c.id = p.category_id
         WHERE u.role = 'farmer'";

if (!empty($_GET['id'])) {
    $st = db()->prepare("$base AND u.id = ? GROUP BY u.id");
    $st->execute([(int)$_GET['id']]);
    $farm = $st->fetch();
    if (!$farm) json_out(['error' => 'Farm not found.'], 404);
    json_out($farm);
}

$args = [];
$sql = $base;
$q = trim($_GET['q'] ?? '');
if ($q !== '') {
    // match farmer name, farm name, location, or anything they sell
    $sql .= " AND (u.name LIKE ? OR u.farm_name LIKE ? OR u.address LIKE ?
                   OR EXISTS (SELECT 1 FROM products px JOIN categories cx ON cx.id = px.category_id
                              WHERE px.farmer_id = u.id AND px.status = 'active' AND (px.name LIKE ? OR cx.name LIKE ?)))";
    $like = "%$q%";
    array_push($args, $like, $like, $like, $like, $like);
}
$sql .= ' GROUP BY u.id ORDER BY product_count DESC, u.farm_name';
if (!empty($_GET['limit'])) $sql .= ' LIMIT ' . max(1, (int)$_GET['limit']);

$st = db()->prepare($sql);
$st->execute($args);
json_out($st->fetchAll());
