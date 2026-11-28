<?php
require __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];
$u = require_user();

function attach_items(array $orders, ?int $farmerId = null): array {
    if (!$orders) return [];
    $ids = array_column($orders, 'id');
    $in = implode(',', array_fill(0, count($ids), '?'));
    $sql = "SELECT oi.*, p.emoji, p.image, p.unit, u.farm_name, u.name AS farmer_name
            FROM order_items oi
            LEFT JOIN products p ON p.id = oi.product_id
            JOIN users u ON u.id = oi.farmer_id
            WHERE oi.order_id IN ($in)";
    $args = $ids;
    if ($farmerId) { $sql .= ' AND oi.farmer_id = ?'; $args[] = $farmerId; }
    $st = db()->prepare($sql);
    $st->execute($args);
    $byOrder = [];
    foreach ($st->fetchAll() as $it) $byOrder[$it['order_id']][] = $it;
    foreach ($orders as &$o) $o['items'] = $byOrder[$o['id']] ?? [];
    return $orders;
}

if ($method === 'GET') {
    $base = 'SELECT o.*, b.name AS buyer_name, b.email AS buyer_email FROM orders o JOIN users b ON b.id = o.buyer_id';
    if ($u['role'] === 'admin') {
        $orders = db()->query("$base ORDER BY o.id DESC")->fetchAll();
        json_out(attach_items($orders));
    }
    if ($u['role'] === 'farmer') {
        $st = db()->prepare("$base WHERE o.id IN (SELECT order_id FROM order_items WHERE farmer_id = ?) ORDER BY o.id DESC");
        $st->execute([$u['id']]);
        json_out(attach_items($st->fetchAll(), (int)$u['id']));
    }
    $st = db()->prepare("$base WHERE o.buyer_id = ? ORDER BY o.id DESC");
    $st->execute([$u['id']]);
    json_out(attach_items($st->fetchAll()));
}

if ($method === 'POST') {
    // Place an order from the cart
    $in = body();
    $items = $in['items'] ?? [];
    $address = trim($in['shipping_address'] ?? '');
    $phone = trim($in['phone'] ?? '');
    if (!$items || !$address || !$phone) json_out(['error' => 'Cart items, address and phone are required.'], 422);
    if ($u['role'] !== 'buyer') json_out(['error' => 'Only buyer accounts can place orders.'], 403);
    // exact delivery spot (GPS or map pin) so the seller/courier can route to it
    [$pinLat, $pinLng] = clean_pin($in['delivery_lat'] ?? null, $in['delivery_lng'] ?? null, true);
    // 'Cash on Delivery' | 'E-Wallet' | 'QR' (pay to one of the admin's GCash/Maya accounts, verified by admin)
    $payMethod = in_array($in['payment_method'] ?? '', ['Cash on Delivery', 'E-Wallet', 'QR'], true) ? $in['payment_method'] : 'Cash on Delivery';

    $pdo = db();
    $pdo->beginTransaction();
    try {
        $lines = [];
        $total = 0;
        $st = $pdo->prepare("SELECT * FROM products WHERE id = ? AND status = 'active' FOR UPDATE");
        foreach ($items as $it) {
            $qty = max(1, (int)($it['quantity'] ?? 1));
            $st->execute([(int)($it['id'] ?? 0)]);
            $p = $st->fetch();
            if (!$p) throw new RuntimeException('A product in your cart is no longer available.');
            if ($p['stock'] < $qty) throw new RuntimeException("Only {$p['stock']} {$p['unit']} of {$p['name']} left in stock.");
            $sub = $p['price'] * $qty;
            $total += $sub;
            $lines[] = [$p, $qty, $sub];
        }
        $pdo->prepare('INSERT INTO orders (buyer_id, total, shipping_address, delivery_lat, delivery_lng, phone, payment_method, notes) VALUES (?,?,?,?,?,?,?,?)')
            ->execute([$u['id'], $total, $address, $pinLat, $pinLng, $phone, $payMethod, $in['notes'] ?? null]);
        $orderId = (int)$pdo->lastInsertId();
        // remember the pin as the buyer's default for next time
        $pdo->prepare('UPDATE users SET lat = ?, lng = ? WHERE id = ?')->execute([$pinLat, $pinLng, $u['id']]);
        if ($payMethod === 'E-Wallet') {
            // throws "Insufficient wallet balance" → whole order is rolled back
            wallet_move((int)$u['id'], -$total, 'payment', "Payment for order #$orderId", ['order_id' => $orderId, 'method' => 'E-Wallet']);
            $pdo->prepare("UPDATE orders SET payment_status = 'paid' WHERE id = ?")->execute([$orderId]);
        }
        if ($payMethod === 'QR') {
            $sub = create_submission((int)$u['id'], 'order', $orderId, (int)($in['payment_method_id'] ?? 0), $total, (string)($in['reference_no'] ?? ''), $in['proof_image'] ?? null);
            $pdo->prepare("UPDATE orders SET payment_method = ?, payment_status = 'for_verification' WHERE id = ?")->execute([$sub['provider'], $orderId]);
        }
        $ins =$pdo->prepare('INSERT INTO order_items (order_id, product_id, farmer_id, product_name, price, quantity, subtotal) VALUES (?,?,?,?,?,?,?)');
        $dec = $pdo->prepare('UPDATE products SET stock = stock - ? WHERE id = ?');
        foreach ($lines as [$p, $qty, $sub]) {
            $ins->execute([$orderId, $p['id'], $p['farmer_id'], $p['name'], $p['price'], $qty, $sub]);
            $dec->execute([$qty, $p['id']]);
        }
        $pdo->commit();
        json_out(['id' => $orderId, 'total' => $total], 201);
    } catch (RuntimeException $e) {
        $pdo->rollBack();
        json_out(['error' => $e->getMessage()], 422);
    }
}

if ($method === 'PUT') {
    // Update order status
    $id = (int)($_GET['id'] ?? 0);
    $status = body()['status'] ?? '';
    $valid = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!in_array($status, $valid, true)) json_out(['error' => 'Invalid status.'], 422);

    $st = db()->prepare('SELECT * FROM orders WHERE id = ?');
    $st->execute([$id]);
    $order = $st->fetch();
    if (!$order) json_out(['error' => 'Order not found.'], 404);

    if ($u['role'] === 'buyer') {
        if ((int)$order['buyer_id'] !== (int)$u['id'] || $status !== 'cancelled' || $order['status'] !== 'pending') {
            json_out(['error' => 'You can only cancel your own pending orders.'], 403);
        }
    } elseif ($u['role'] === 'farmer') {
        $chk = db()->prepare('SELECT 1 FROM order_items WHERE order_id = ? AND farmer_id = ?');
        $chk->execute([$id, $u['id']]);
        if (!$chk->fetch()) json_out(['error' => 'This order has none of your products.'], 403);
    }

    if (in_array($order['status'], ['delivered', 'cancelled'], true)) {
        json_out(['error' => "This order is already {$order['status']} and can no longer change."], 422);
    }
    if ($status === $order['status']) json_out(['ok' => true]);

    $pdo = db();
    $pdo->beginTransaction();
    try {
        if ($status === 'cancelled') {
            // Return stock to the farm
            $pdo->prepare('UPDATE products p JOIN order_items oi ON oi.product_id = p.id SET p.stock = p.stock + oi.quantity WHERE oi.order_id = ?')
                ->execute([$id]);
            // Refund prepaid orders (E-Wallet or verified GCash/Maya) to the buyer's wallet.
            // A payment still "for_verification" is refunded when the admin approves it (see payments.php).
            if ($order['payment_status'] === 'paid') {
                wallet_move((int)$order['buyer_id'], (float)$order['total'], 'refund', "Refund for cancelled order #$id", ['order_id' => $id, 'method' => $order['payment_method']]);
                $pdo->prepare("UPDATE orders SET payment_status = 'refunded' WHERE id = ?")->execute([$id]);
            }
        }
        if ($status === 'delivered') {
            if ($order['payment_method'] === 'Cash on Delivery') {
                // collected by the rider on delivery
                $pdo->prepare("UPDATE orders SET payment_status = 'paid' WHERE id = ?")->execute([$id]);
            } elseif ($order['payment_status'] === 'paid') {
                // prepaid → credit each farmer's wallet with their share
                pay_farmers($id);
            }
            // still for_verification → farmers are paid when the admin approves the payment
        }
        $pdo->prepare('UPDATE orders SET status = ? WHERE id = ?')->execute([$status, $id]);
        $pdo->commit();
    } catch (RuntimeException $e) {
        $pdo->rollBack();
        json_out(['error' => $e->getMessage()], 422);
    }
    json_out(['ok' => true]);
}

json_out(['error' => 'Method not allowed'], 405);
