<?php
// Creates the aniharvest_db database with tables and sample data.
// Visit: http://localhost/April/api/install.php
header('Content-Type: text/html; charset=utf-8');
try {
    $pdo = new PDO('mysql:host=localhost;charset=utf8mb4', 'root', '', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
    $sql = file_get_contents(__DIR__ . '/database.sql');
    $pdo->exec($sql);
    // extra sample buyers, farmers and their products
    $pdo->exec(file_get_contents(__DIR__ . '/seed_more_users.sql'));
    echo '<h2 style="font-family:sans-serif;color:#2e7d32">✅ AniHarvest database installed successfully!</h2>';
    echo '<p style="font-family:sans-serif">Demo accounts: admin@aniharvest.com / admin123, farmer@aniharvest.com / farmer123, buyer@aniharvest.com / buyer123</p>';
} catch (Throwable $e) {
    echo '<h2 style="font-family:sans-serif;color:#c62828">❌ Install failed</h2><pre>' . htmlspecialchars($e->getMessage()) . '</pre>';
}
