<?php
// ===== AniHarvest API configuration =====
// Read from environment variables in Docker/Dokploy; fall back to XAMPP defaults locally.
define('DB_HOST', getenv('DB_HOST') ?: 'localhost');
define('DB_NAME', getenv('DB_NAME') ?: 'aniharvest_db');
define('DB_USER', getenv('DB_USER') ?: 'root');
define('DB_PASS', getenv('DB_PASS') !== false ? getenv('DB_PASS') : '');   // XAMPP default: empty

// ----- CORS (lets the React dev server talk to this API) -----
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, X-Auth-Token');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(200);
    exit;
}

function db(): PDO {
    static $pdo = null;
    if ($pdo === null) {
        try {
            $pdo = new PDO(
                'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4',
                DB_USER,
                DB_PASS,
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                ]
            );
        } catch (PDOException $e) {
            json_out(['error' => 'Database connection failed. Run install.php first. ' . $e->getMessage()], 500);
        }
    }
    return $pdo;
}

function json_out($data, int $code = 200): void {
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data);
    exit;
}

function body(): array {
    $data = json_decode(file_get_contents('php://input'), true);
    return is_array($data) ? $data : $_POST;
}

function current_user(): ?array {
    $token = $_SERVER['HTTP_X_AUTH_TOKEN'] ?? '';
    if (!$token) return null;
    $st = db()->prepare('SELECT id, name, email, role, phone, address, farm_name, wallet_balance, created_at FROM users WHERE token = ?');
    $st->execute([$token]);
    return $st->fetch() ?: null;
}

/**
 * Moves money in/out of a wallet and records it in the ledger.
 * $amount > 0 credits, $amount < 0 debits. Call inside a DB transaction.
 */
function wallet_move(int $userId, float $amount, string $type, string $description, array $extra = []): array {
    $pdo = db();
    $st = $pdo->prepare('SELECT wallet_balance FROM users WHERE id = ? FOR UPDATE');
    $st->execute([$userId]);
    $balance = (float)$st->fetchColumn();
    $new = round($balance + $amount, 2);
    if ($new < 0) {
        throw new RuntimeException($type === 'payment'
            ? 'Insufficient wallet balance. Please cash in first.'
            : 'Insufficient wallet balance (₱' . number_format($balance, 2) . ' available).');
    }

    $pdo->prepare('UPDATE users SET wallet_balance = ? WHERE id = ?')->execute([$new, $userId]);
    $ref = $extra['reference'] ?? strtoupper(substr($type, 0, 2)) . date('ymd') . strtoupper(bin2hex(random_bytes(4)));
    $pdo->prepare('INSERT INTO wallet_transactions (user_id, type, amount, balance_after, method, account, reference, order_id, description) VALUES (?,?,?,?,?,?,?,?,?)')
        ->execute([$userId, $type, $amount, $new, $extra['method'] ?? null, $extra['account'] ?? null, $ref, $extra['order_id'] ?? null, $description]);
    return ['balance' => $new, 'reference' => $ref];
}

/** Credit each farmer's wallet with their share of a paid (non-COD) order. Call inside a DB transaction. */
function pay_farmers(int $orderId): void {
    $st = db()->prepare('SELECT farmer_id, SUM(subtotal) AS amt FROM order_items WHERE order_id = ? GROUP BY farmer_id');
    $st->execute([$orderId]);
    foreach ($st->fetchAll() as $row) {
        wallet_move((int)$row['farmer_id'], (float)$row['amt'], 'earning', "Earnings from order #$orderId", ['order_id' => $orderId, 'method' => 'E-Wallet']);
    }
}

/**
 * Records a payment the buyer made to one of the admin's payment methods (GCash QR etc.)
 * as "pending" for the admin to verify. Throws RuntimeException on invalid input.
 */
function create_submission(int $userId, string $purpose, ?int $orderId, int $methodId, float $amount, string $ref, ?string $proof): array {
    $st = db()->prepare('SELECT * FROM payment_methods WHERE id = ? AND is_active = 1');
    $st->execute([$methodId]);
    $m = $st->fetch();
    if (!$m) throw new RuntimeException('That payment method is no longer available.');
    $ref = trim($ref);
    if (strlen($ref) < 6) throw new RuntimeException("Enter the reference number from your {$m['provider']} receipt.");
    $dup = db()->prepare("SELECT id FROM payment_submissions WHERE reference_no = ? AND status <> 'rejected'");
    $dup->execute([$ref]);
    if ($dup->fetch()) throw new RuntimeException('This reference number was already submitted.');
    db()->prepare('INSERT INTO payment_submissions (user_id, purpose, order_id, payment_method_id, provider, amount, reference_no, proof_image) VALUES (?,?,?,?,?,?,?,?)')
        ->execute([$userId, $purpose, $orderId, $methodId, $m['provider'], $amount, $ref, $proof ?: null]);
    return ['id' => (int)db()->lastInsertId(), 'provider' => $m['provider']];
}

function require_user(array $roles = []): array {
    $u = current_user();
    if (!$u) json_out(['error' => 'Please log in first.'], 401);
    if ($roles && !in_array($u['role'], $roles, true)) json_out(['error' => 'You are not allowed to do this.'], 403);
    return $u;
}
