<?php
// Payment submissions: buyer sends money to the admin's GCash/Maya (via QR), then submits
// the reference number + screenshot here. The admin approves or rejects it.
require __DIR__ . '/config.php';

$u = require_user();
$method = $_SERVER['REQUEST_METHOD'];
$pdo = db();

$sel = 'SELECT s.*, u.name AS user_name, u.email AS user_email, m.account_name, m.account_number, o.status AS order_status
        FROM payment_submissions s
        JOIN users u ON u.id = s.user_id
        LEFT JOIN payment_methods m ON m.id = s.payment_method_id
        LEFT JOIN orders o ON o.id = s.order_id';

if ($method === 'GET') {
    if ($u['role'] === 'admin') {
        $status = $_GET['status'] ?? '';
        if (in_array($status, ['pending', 'approved', 'rejected'], true)) {
            $st = $pdo->prepare("$sel WHERE s.status = ? ORDER BY s.id DESC");
            $st->execute([$status]);
        } else {
            $st = $pdo->query("$sel ORDER BY s.status = 'pending' DESC, s.id DESC LIMIT 200");
        }
        json_out($st->fetchAll());
    }
    $st = $pdo->prepare("$sel WHERE s.user_id = ? ORDER BY s.id DESC LIMIT 50");
    $st->execute([$u['id']]);
    json_out($st->fetchAll());
}

if ($method === 'POST') {
    // Buyer: cash in to the e-wallet through one of the admin's payment methods
    if ($u['role'] !== 'buyer') json_out(['error' => 'Only buyers can cash in.'], 403);
    $in = body();
    $amount = round((float)($in['amount'] ?? 0), 2);
    if ($amount < 20 || $amount > 50000) json_out(['error' => 'Cash-in amount must be between ₱20 and ₱50,000.'], 422);
    try {
        $r = create_submission((int)$u['id'], 'cash_in', null, (int)($in['payment_method_id'] ?? 0), $amount, (string)($in['reference_no'] ?? ''), $in['proof_image'] ?? null);
    } catch (RuntimeException $e) {
        json_out(['error' => $e->getMessage()], 422);
    }
    json_out($r, 201);
}

if ($method === 'PUT') {
    // Admin: approve or reject a submission
    require_user(['admin']);
    $id = (int)($_GET['id'] ?? 0);
    $in = body();
    $decision = $in['status'] ?? '';
    if (!in_array($decision, ['approved', 'rejected'], true)) json_out(['error' => 'Invalid decision.'], 422);

    $pdo->beginTransaction();
    try {
        $st = $pdo->prepare('SELECT * FROM payment_submissions WHERE id = ? FOR UPDATE');
        $st->execute([$id]);
        $s = $st->fetch();
        if (!$s) throw new RuntimeException('Payment not found.');
        if ($s['status'] !== 'pending') throw new RuntimeException("This payment was already {$s['status']}.");

        $pdo->prepare('UPDATE payment_submissions SET status = ?, admin_note = ?, reviewed_at = NOW() WHERE id = ?')
            ->execute([$decision, trim($in['note'] ?? '') ?: null, $id]);

        if ($s['purpose'] === 'cash_in' && $decision === 'approved') {
            wallet_move((int)$s['user_id'], (float)$s['amount'], 'cash_in', "Cash in via {$s['provider']}", [
                'method' => $s['provider'], 'reference' => $s['reference_no'],
            ]);
        }

        if ($s['purpose'] === 'order' && $s['order_id']) {
            $o = $pdo->prepare('SELECT * FROM orders WHERE id = ? FOR UPDATE');
            $o->execute([$s['order_id']]);
            $order = $o->fetch();
            if ($order) {
                if ($decision === 'rejected') {
                    $pdo->prepare("UPDATE orders SET payment_status = 'rejected' WHERE id = ?")->execute([$order['id']]);
                } elseif ($order['status'] === 'cancelled') {
                    // buyer cancelled before we verified → money goes back to their wallet
                    wallet_move((int)$order['buyer_id'], (float)$s['amount'], 'refund', "Refund for cancelled order #{$order['id']}", ['order_id' => $order['id'], 'method' => $s['provider']]);
                    $pdo->prepare("UPDATE orders SET payment_status = 'refunded' WHERE id = ?")->execute([$order['id']]);
                } else {
                    $pdo->prepare("UPDATE orders SET payment_status = 'paid' WHERE id = ?")->execute([$order['id']]);
                    if ($order['status'] === 'delivered') pay_farmers((int)$order['id']); // delivered before verification
                }
            }
        }
        $pdo->commit();
    } catch (RuntimeException $e) {
        $pdo->rollBack();
        json_out(['error' => $e->getMessage()], 422);
    }
    json_out(['ok' => true]);
}

json_out(['error' => 'Method not allowed'], 405);
