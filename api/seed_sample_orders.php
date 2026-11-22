<?php
// Generates ~60 days of SAMPLE order history so the farmer analytics have data.
// Only demo farmers/buyers are used. Every sample order has notes = '[sample]'.
//
//   Run:     php seed_sample_orders.php          (or open it in the browser)
//   Remove:  php seed_sample_orders.php remove
//   (Re-running first removes the previous sample orders, so it never doubles up.)
require __DIR__ . '/config.php';
if (PHP_SAPI !== 'cli') header('Content-Type: text/plain; charset=utf-8');

$pdo = db();
$remove = ($argv[1] ?? $_GET['action'] ?? '') === 'remove';

$deleted = $pdo->exec("DELETE FROM orders WHERE notes = '[sample]'");   // order_items cascade
echo "Removed $deleted old sample orders.\n";
if ($remove) exit;

$farmerEmails = ['farmer@aniharvest.com', 'rosa@aniharvest.com', 'tomas.ramirez@aniharvest.com', 'nena.castillo@aniharvest.com',
                 'rodel.pascual@aniharvest.com', 'liza.domingo@aniharvest.com', 'ernesto.n@aniharvest.com'];
$buyerEmails = ['buyer@aniharvest.com', 'maria.reyes@aniharvest.com', 'jose.bautista@aniharvest.com', 'angelica.v@aniharvest.com',
                'mark.garcia@aniharvest.com', 'kristine.m@aniharvest.com', 'paolo.f@aniharvest.com', 'grace.tan@aniharvest.com', 'ramon.aquino@aniharvest.com'];

$in = fn(array $a) => implode(',', array_fill(0, count($a), '?'));
$st = $pdo->prepare("SELECT id, address, phone FROM users WHERE role = 'buyer' AND email IN (" . $in($buyerEmails) . ')');
$st->execute($buyerEmails);
$buyers = $st->fetchAll();
$st = $pdo->prepare("SELECT p.id, p.farmer_id, p.name, p.price FROM products p JOIN users u ON u.id = p.farmer_id
                     WHERE p.status = 'active' AND u.email IN (" . $in($farmerEmails) . ')');
$st->execute($farmerEmails);
$byFarmer = [];
foreach ($st->fetchAll() as $p) $byFarmer[$p['farmer_id']][] = $p;
if (!$buyers || !$byFarmer) exit("Demo buyers/farmers not found — run seed_more_users.sql first.\n");

mt_srand(2026); // same history every run
$farmerIds = array_keys($byFarmer);
$insOrder = $pdo->prepare("INSERT INTO orders (buyer_id, total, status, shipping_address, phone, payment_method, payment_status, notes, created_at)
                           VALUES (?,?,?,?,?,'Cash on Delivery',?,'[sample]',?)");
$insItem = $pdo->prepare('INSERT INTO order_items (order_id, product_id, farmer_id, product_name, price, quantity, subtotal) VALUES (?,?,?,?,?,?,?)');

$pdo->beginTransaction();
$count = 0;
for ($daysAgo = 59; $daysAgo >= 0; $daysAgo--) {
    // busier on weekends and slowly growing over time
    $date = (new DateTime('today'))->modify("-$daysAgo days");
    $weekend = in_array((int)$date->format('N'), [6, 7], true);
    $n = mt_rand(2, 5) + ($weekend ? 3 : 0) + (int)((60 - $daysAgo) / 12);
    for ($k = 0; $k < $n; $k++) {
        $buyer = $buyers[mt_rand(0, count($buyers) - 1)];
        $fid = $farmerIds[mt_rand(0, count($farmerIds) - 1)];
        $prods = $byFarmer[$fid];
        shuffle($prods);
        $lines = array_slice($prods, 0, mt_rand(1, min(3, count($prods))));

        if ($daysAgo > 6) $status = mt_rand(1, 100) <= 7 ? 'cancelled' : 'delivered';
        else $status = ['pending', 'processing', 'shipped', 'delivered'][min(3, intdiv($daysAgo, 2) + mt_rand(0, 1))];
        $created = (clone $date)->setTime(mt_rand(7, 20), mt_rand(0, 59))->format('Y-m-d H:i:s');

        $total = 0;
        $items = [];
        foreach ($lines as $p) {
            $qty = mt_rand(1, 4);
            $sub = round($p['price'] * $qty, 2);
            $total += $sub;
            $items[] = [$p, $qty, $sub];
        }
        $insOrder->execute([$buyer['id'], $total, $status, $buyer['address'] ?: 'Sample address', $buyer['phone'] ?: '09170000000',
                            $status === 'delivered' ? 'paid' : 'unpaid', $created]);
        $oid = (int)$pdo->lastInsertId();
        foreach ($items as [$p, $qty, $sub]) $insItem->execute([$oid, $p['id'], $p['farmer_id'], $p['name'], $p['price'], $qty, $sub]);
        $count++;
    }
}
$pdo->commit();
echo "Created $count sample orders over the last 60 days.\n";
