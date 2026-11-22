<?php
// Payment accounts (GCash / Maya / bank + QR code) that the admin publishes for buyers
require __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];
$id = (int)($_GET['id'] ?? 0);

if ($method === 'GET') {
    $all = !empty($_GET['all']);
    if ($all) require_user(['admin']);
    $rows = db()->query('SELECT * FROM payment_methods' . ($all ? '' : ' WHERE is_active = 1') . ' ORDER BY id')->fetchAll();
    json_out($rows);
}

require_user(['admin']);

function clean_method(array $in): array {
    $provider = trim($in['provider'] ?? '');
    $name = trim($in['account_name'] ?? '');
    $number = trim($in['account_number'] ?? '');
    if (!$provider || !$name || !$number) json_out(['error' => 'E-wallet name, account name and account number are required.'], 422);
    return [$provider, $name, $number, ($in['qr_image'] ?? '') ?: null, trim($in['instructions'] ?? '') ?: null, !empty($in['is_active']) ? 1 : 0];
}

if ($method === 'POST') {
    $st = db()->prepare('INSERT INTO payment_methods (provider, account_name, account_number, qr_image, instructions, is_active) VALUES (?,?,?,?,?,?)');
    $st->execute(clean_method(body()));
    json_out(['id' => (int)db()->lastInsertId()], 201);
}
if ($method === 'PUT') {
    $st = db()->prepare('UPDATE payment_methods SET provider=?, account_name=?, account_number=?, qr_image=?, instructions=?, is_active=? WHERE id=?');
    $st->execute([...clean_method(body()), $id]);
    json_out(['ok' => true]);
}
if ($method === 'DELETE') {
    db()->prepare('DELETE FROM payment_methods WHERE id = ?')->execute([$id]);
    json_out(['ok' => true]);
}
json_out(['error' => 'Method not allowed'], 405);
