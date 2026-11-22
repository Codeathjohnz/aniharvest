<?php
require __DIR__ . '/config.php';

$scope = $_GET['scope'] ?? 'public';
$pdo = db();

if ($scope === 'public') {
    // Numbers for the landing page
    json_out([
        'farmers' => (int)$pdo->query("SELECT COUNT(*) FROM users WHERE role = 'farmer'")->fetchColumn(),
        'products' => (int)$pdo->query("SELECT COUNT(*) FROM products WHERE status = 'active'")->fetchColumn(),
        'buyers' => (int)$pdo->query("SELECT COUNT(*) FROM users WHERE role = 'buyer'")->fetchColumn(),
        'orders' => (int)$pdo->query('SELECT COUNT(*) FROM orders')->fetchColumn(),
    ]);
}

$u = require_user(['farmer', 'admin']);

if ($u['role'] === 'farmer') {
    $q = function (string $sql) use ($pdo, $u) {
        $st = $pdo->prepare($sql);
        $st->execute([$u['id']]);
        return $st->fetchColumn();
    };
    json_out([
        'products' => (int)$q('SELECT COUNT(*) FROM products WHERE farmer_id = ?'),
        'low_stock' => (int)$q('SELECT COUNT(*) FROM products WHERE farmer_id = ? AND stock < 10'),
        'orders' => (int)$q('SELECT COUNT(DISTINCT order_id) FROM order_items WHERE farmer_id = ?'),
        'revenue' => (float)$q("SELECT COALESCE(SUM(oi.subtotal),0) FROM order_items oi JOIN orders o ON o.id = oi.order_id WHERE oi.farmer_id = ? AND o.status <> 'cancelled'"),
    ]);
}

// Admin
if (($_GET['list'] ?? '') === 'users') {
    json_out($pdo->query('SELECT id, name, email, role, phone, address, farm_name, wallet_balance, created_at FROM users ORDER BY id DESC')->fetchAll());
}
if ($_SERVER['REQUEST_METHOD'] === 'DELETE' && !empty($_GET['user'])) {
    $id = (int)$_GET['user'];
    if ($id === (int)$u['id']) json_out(['error' => 'You cannot delete your own account.'], 422);
    $pdo->prepare('DELETE FROM users WHERE id = ?')->execute([$id]);
    json_out(['ok' => true]);
}
json_out([
    'users' => (int)$pdo->query('SELECT COUNT(*) FROM users')->fetchColumn(),
    'farmers' => (int)$pdo->query("SELECT COUNT(*) FROM users WHERE role = 'farmer'")->fetchColumn(),
    'products' => (int)$pdo->query('SELECT COUNT(*) FROM products')->fetchColumn(),
    'orders' => (int)$pdo->query('SELECT COUNT(*) FROM orders')->fetchColumn(),
    'revenue' => (float)$pdo->query("SELECT COALESCE(SUM(total),0) FROM orders WHERE status <> 'cancelled'")->fetchColumn(),
    'wallet_total' => (float)$pdo->query('SELECT COALESCE(SUM(wallet_balance),0) FROM users')->fetchColumn(),
    'by_status' =>$pdo->query('SELECT status, COUNT(*) AS count FROM orders GROUP BY status')->fetchAll(),
]);
