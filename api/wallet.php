<?php
// AniHarvest e-Wallet: balance + history (GET) and farmer withdrawals (POST ?action=withdraw).
// Cash-in goes through payments.php: buyer pays the admin's GCash/Maya QR, admin verifies.
// NOTE: withdrawal only records the payout — the admin sends the money manually.
require __DIR__ . '/config.php';

$u = require_user(['buyer', 'farmer']);
$action = $_GET['action'] ?? '';
$methods = ['GCash', 'Maya', 'Bank Transfer'];

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $st = db()->prepare('SELECT * FROM wallet_transactions WHERE user_id = ? ORDER BY id DESC LIMIT 100');
    $st->execute([$u['id']]);
    json_out(['balance' => (float)$u['wallet_balance'], 'transactions' => $st->fetchAll()]);
}

$in = body();
$amount = round((float)($in['amount'] ?? 0), 2);
$method = $in['method'] ?? '';
$account = preg_replace('/\D/', '', $in['account'] ?? '');

if (!in_array($method, $methods, true)) json_out(['error' => 'Choose GCash, Maya or Bank Transfer.'], 422);
if ($method !== 'Bank Transfer' && !preg_match('/^09\d{9}$/', $account)) {
    json_out(['error' => "Enter a valid 11-digit $method mobile number (09XXXXXXXXX)."], 422);
}
if ($method === 'Bank Transfer' && strlen($account) < 8) json_out(['error' => 'Enter a valid bank account number.'], 422);

$masked = str_repeat('•', max(0, strlen($account) - 4)) . substr($account, -4);
$pdo = db();

try {
    $pdo->beginTransaction();
    // Cash-in is handled by payments.php (QR payment + admin verification)
    if ($action === 'withdraw') {
        if ($amount < 100) throw new RuntimeException('Minimum withdrawal is ₱100.');
        $r = wallet_move((int)$u['id'], -$amount, 'withdraw', "Withdraw to $method", [
            'method' => $method, 'account' => $masked,
            'reference' => 'WD' . date('ymdHis') . random_int(100, 999),
        ]);
    } else {
        throw new RuntimeException('Unknown action.');
    }
    $pdo->commit();
    json_out(['ok' => true] + $r);
} catch (RuntimeException $e) {
    $pdo->rollBack();
    json_out(['error' => $e->getMessage()], 422);
}
