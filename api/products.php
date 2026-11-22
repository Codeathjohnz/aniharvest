<?php
require __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];
$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;

$select = "SELECT p.*, c.name AS category_name, c.slug AS category_slug,
                  u.name AS farmer_name, u.farm_name, u.address AS farm_location
           FROM products p
           JOIN categories c ON c.id = p.category_id
           JOIN users u ON u.id = p.farmer_id";

function clean_product(array $in): array {
    $name = trim($in['name'] ?? '');
    $price = (float)($in['price'] ?? 0);
    $cat = (int)($in['category_id'] ?? 0);
    if (!$name || $price <= 0 || !$cat) json_out(['error' => 'Name, category and a price above 0 are required.'], 422);
    return [
        'name' => $name,
        'category_id' => $cat,
        'description' => trim($in['description'] ?? ''),
        'price' => $price,
        'unit' => trim($in['unit'] ?? 'kg') ?: 'kg',
        'stock' => max(0, (int)($in['stock'] ?? 0)),
        'image' => ($in['image'] ?? '') ?: null,
        'emoji' => ($in['emoji'] ?? '') ?: '🌱',
        'is_organic' => !empty($in['is_organic']) ? 1 : 0,
        'status' => ($in['status'] ?? 'active') === 'inactive' ? 'inactive' : 'active',
    ];
}

function owned_or_admin(int $id, array $u): void {
    $st = db()->prepare('SELECT farmer_id FROM products WHERE id = ?');
    $st->execute([$id]);
    $row = $st->fetch();
    if (!$row) json_out(['error' => 'Product not found.'], 404);
    if ($u['role'] !== 'admin' && (int)$row['farmer_id'] !== (int)$u['id']) json_out(['error' => 'Not your product.'], 403);
}

switch ($method) {
    case 'GET':
        if ($id) {
            $st = db()->prepare("$select WHERE p.id = ?");
            $st->execute([$id]);
            $p = $st->fetch();
            $p ? json_out($p) : json_out(['error' => 'Product not found.'], 404);
        }
        $where = [];
        $args = [];
        if (!empty($_GET['mine'])) {
            $u = require_user(['farmer', 'admin']);
            if ($u['role'] === 'farmer') { $where[] = 'p.farmer_id = ?'; $args[] = $u['id']; }
        } else {
            $where[] = "p.status = 'active'";
        }
        if (!empty($_GET['category'])) { $where[] = 'c.slug = ?'; $args[] = $_GET['category']; }
        if (!empty($_GET['farmer'])) { $where[] = 'p.farmer_id = ?'; $args[] = (int)$_GET['farmer']; }
        if (!empty($_GET['q'])) {
            $where[] = '(p.name LIKE ? OR p.description LIKE ? OR u.farm_name LIKE ? OR u.name LIKE ? OR u.address LIKE ?)';
            $q = '%' . $_GET['q'] . '%';
            array_push($args, $q, $q, $q, $q, $q);
        }
        if (!empty($_GET['organic'])) $where[] = 'p.is_organic = 1';
        $order = match ($_GET['sort'] ?? '') {
            'price_asc' => 'p.price ASC',
            'price_desc' => 'p.price DESC',
            'name' => 'p.name ASC',
            // best sellers: units sold in non-cancelled orders
            'popular' => "(SELECT COALESCE(SUM(oi.quantity),0) FROM order_items oi JOIN orders o ON o.id = oi.order_id
                           WHERE oi.product_id = p.id AND o.status <> 'cancelled') DESC, p.id DESC",
            default => 'p.created_at DESC, p.id DESC',
        };
        $sql = $select . ($where ? ' WHERE ' . implode(' AND ', $where) : '') . " ORDER BY $order";
        if (!empty($_GET['limit'])) $sql .= ' LIMIT ' . max(1, (int)$_GET['limit']);
        $st = db()->prepare($sql);
        $st->execute($args);
        json_out($st->fetchAll());

    case 'POST':
        $u = require_user(['farmer', 'admin']);
        $d = clean_product(body());
        $st = db()->prepare('INSERT INTO products (farmer_id, category_id, name, description, price, unit, stock, image, emoji, is_organic, status)
                             VALUES (?,?,?,?,?,?,?,?,?,?,?)');
        $st->execute([$u['id'], $d['category_id'], $d['name'], $d['description'], $d['price'], $d['unit'], $d['stock'], $d['image'], $d['emoji'], $d['is_organic'], $d['status']]);
        json_out(['id' => (int)db()->lastInsertId()], 201);

    case 'PUT':
        $u = require_user(['farmer', 'admin']);
        owned_or_admin($id, $u);
        $d = clean_product(body());
        $st = db()->prepare('UPDATE products SET category_id=?, name=?, description=?, price=?, unit=?, stock=?, image=?, emoji=?, is_organic=?, status=? WHERE id=?');
        $st->execute([$d['category_id'], $d['name'], $d['description'], $d['price'], $d['unit'], $d['stock'], $d['image'], $d['emoji'], $d['is_organic'], $d['status'], $id]);
        json_out(['ok' => true]);

    case 'DELETE':
        $u = require_user(['farmer', 'admin']);
        owned_or_admin($id, $u);
        db()->prepare('DELETE FROM products WHERE id = ?')->execute([$id]);
        json_out(['ok' => true]);
}
json_out(['error' => 'Method not allowed'], 405);
