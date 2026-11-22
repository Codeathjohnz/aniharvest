<?php
// Farmer sales analytics for the farmer's home page.  GET ?days=7|30|90
require __DIR__ . '/config.php';

$u = require_user(['farmer']);
$fid = (int)$u['id'];
$days = in_array((int)($_GET['days'] ?? 30), [7, 30, 90], true) ? (int)$_GET['days'] : 30;
$pdo = db();

$start = (new DateTime('today'))->modify('-' . ($days - 1) . ' days');   // first day of current period
$prevStart = (clone $start)->modify("-$days days");                     // same length, just before
$s = $start->format('Y-m-d 00:00:00');
$ps = $prevStart->format('Y-m-d 00:00:00');

function rows(string $sql, array $args): array {
    $st = db()->prepare($sql);
    $st->execute($args);
    return $st->fetchAll();
}

// Headline numbers for a period [from, to) — cancelled orders excluded
function kpis(int $fid, string $from, ?string $to): array {
    $sql = "SELECT COALESCE(SUM(oi.subtotal),0) revenue, COUNT(DISTINCT o.id) orders,
                   COALESCE(SUM(oi.quantity),0) units, COUNT(DISTINCT o.buyer_id) customers
            FROM order_items oi JOIN orders o ON o.id = oi.order_id
            WHERE oi.farmer_id = ? AND o.status <> 'cancelled' AND o.created_at >= ?" . ($to ? ' AND o.created_at < ?' : '');
    $r = rows($sql, $to ? [$fid, $from, $to] : [$fid, $from])[0];
    $r = array_map('floatval', $r);
    $r['aov'] = $r['orders'] ? round($r['revenue'] / $r['orders'], 2) : 0;
    return $r;
}

// Revenue + orders per day, zero-filled so the line has a point for every day
$daily = [];
for ($d = clone $start; $d <= new DateTime('today'); $d->modify('+1 day')) {
    $daily[$d->format('Y-m-d')] = ['date' => $d->format('Y-m-d'), 'revenue' => 0, 'orders' => 0];
}
foreach (rows("SELECT DATE(o.created_at) d, SUM(oi.subtotal) revenue, COUNT(DISTINCT o.id) orders
               FROM order_items oi JOIN orders o ON o.id = oi.order_id
               WHERE oi.farmer_id = ? AND o.status <> 'cancelled' AND o.created_at >= ?
               GROUP BY DATE(o.created_at)", [$fid, $s]) as $r) {
    if (isset($daily[$r['d']])) $daily[$r['d']] = ['date' => $r['d'], 'revenue' => (float)$r['revenue'], 'orders' => (int)$r['orders']];
}

json_out([
    'days' => $days,
    'current' => kpis($fid, $s, null),
    'previous' => kpis($fid, $ps, $s),
    'daily' => array_values($daily),
    'top_products' => rows("SELECT oi.product_name name, MAX(p.emoji) emoji, SUM(oi.quantity) units, SUM(oi.subtotal) revenue, MAX(p.unit) unit
                            FROM order_items oi JOIN orders o ON o.id = oi.order_id LEFT JOIN products p ON p.id = oi.product_id
                            WHERE oi.farmer_id = ? AND o.status <> 'cancelled' AND o.created_at >= ?
                            GROUP BY oi.product_name ORDER BY revenue DESC LIMIT 6", [$fid, $s]),
    'by_category' => rows("SELECT c.name, SUM(oi.subtotal) revenue
                           FROM order_items oi JOIN orders o ON o.id = oi.order_id
                           JOIN products p ON p.id = oi.product_id JOIN categories c ON c.id = p.category_id
                           WHERE oi.farmer_id = ? AND o.status <> 'cancelled' AND o.created_at >= ?
                           GROUP BY c.id ORDER BY revenue DESC", [$fid, $s]),
    'by_status' => rows("SELECT o.status, COUNT(DISTINCT o.id) count
                         FROM orders o JOIN order_items oi ON oi.order_id = o.id
                         WHERE oi.farmer_id = ? AND o.created_at >= ?
                         GROUP BY o.status", [$fid, $s]),
    'to_pack' => (int)rows("SELECT COUNT(DISTINCT o.id) n FROM orders o JOIN order_items oi ON oi.order_id = o.id
                            WHERE oi.farmer_id = ? AND o.status IN ('pending','processing')", [$fid])[0]['n'],
    'low_stock' => rows("SELECT id, name, emoji, stock, unit FROM products WHERE farmer_id = ? AND status = 'active' AND stock < 15 ORDER BY stock ASC LIMIT 6", [$fid]),
    'products' => rows("SELECT COUNT(*) total, SUM(status = 'active') active FROM products WHERE farmer_id = ?", [$fid])[0],
    'wallet' => (float)$u['wallet_balance'],
]);
