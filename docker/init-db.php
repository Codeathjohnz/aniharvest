<?php
// Runs at container start (see docker/entrypoint.sh).
// 1. Waits for MySQL.  2. On the FIRST start only, creates the tables + demo data.
// 3. Always makes sure the admin password is the one from ADMIN_PASSWORD (never the public demo one).
// 4. Optionally adds sample sales history for the farmer analytics (SEED_SAMPLE_ORDERS=1).

$dir = getenv('SETUP_DIR') ?: '/var/www/setup';
$host = getenv('DB_HOST') ?: 'aniharvest-db';
$name = getenv('DB_NAME') ?: 'aniharvest_db';
$user = getenv('DB_USER') ?: 'aniharvest';
$pass = getenv('DB_PASS') ?: '';

$pdo = null;
for ($i = 1; $i <= 60; $i++) {
    try {
        $pdo = new PDO("mysql:host=$host;dbname=$name;charset=utf8mb4", $user, $pass, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
        break;
    } catch (PDOException $e) {
        fwrite(STDERR, "[init-db] waiting for MySQL ($i/60): {$e->getMessage()}\n");
        if (str_contains($e->getMessage(), '[1045]') && $i === 1) {
            fwrite(STDERR, "[init-db] HINT: the database volume was created with a different DB_PASSWORD. "
                . "MariaDB keeps the password it was first started with; changing DB_PASSWORD later does not update it. "
                . "Put back the original DB_PASSWORD, or start the database on a new, empty volume.\n");
        }
        sleep(2);
    }
}
if (!$pdo) { fwrite(STDERR, "[init-db] MySQL never became ready — giving up\n"); exit(1); }

// strip CREATE DATABASE / USE lines: the database already exists and the app user may not create databases
$load = function (string $file) use ($pdo) {
    $sql = file_get_contents($file);
    $sql = preg_replace('/^\s*(CREATE DATABASE|USE)\b[^;]*;/mi', '', $sql);
    $pdo->exec($sql);
};

$hasTables = (bool)$pdo->query("SHOW TABLES LIKE 'users'")->fetch();
if (!$hasTables) {
    echo "[init-db] empty database → creating tables and demo data\n";
    $load($dir . '/database.sql');
    $load($dir . '/seed_more_users.sql');
} else {
    echo "[init-db] tables exist → leaving data untouched\n";
}

// Admin account: email + password from the environment (the demo 'admin123' must never be live)
$adminEmail = strtolower(trim(getenv('ADMIN_EMAIL') ?: 'admin@aniharvest.com'));
$adminPass = getenv('ADMIN_PASSWORD') ?: '';
if (strlen($adminPass) < 8) {
    // no strong password given → lock the admin account with a random one instead of leaving admin123
    $adminPass = bin2hex(random_bytes(16));
    fwrite(STDERR, "[init-db] WARNING: ADMIN_PASSWORD missing or shorter than 8 characters — admin login is disabled until you set it\n");
}
$st = $pdo->prepare("SELECT id FROM users WHERE role = 'admin' ORDER BY id LIMIT 1");
$st->execute();
$adminId = $st->fetchColumn();
if ($adminId) {
    $pdo->prepare('UPDATE users SET email = ?, password = ?, token = NULL WHERE id = ?')
        ->execute([$adminEmail, password_hash($adminPass, PASSWORD_BCRYPT), $adminId]);
    echo "[init-db] admin account set to $adminEmail\n";
}

if (!$hasTables && getenv('SEED_SAMPLE_ORDERS') === '1') {
    echo "[init-db] adding sample sales history\n";
    passthru(PHP_BINARY . ' ' . escapeshellarg($dir . '/seed_sample_orders.php'));
}
echo "[init-db] done\n";
