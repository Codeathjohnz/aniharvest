<?php
require __DIR__ . '/config.php';

$action = $_GET['action'] ?? '';
$in = body();

switch ($action) {
    case 'register':
        $name = trim($in['name'] ?? '');
        $email = strtolower(trim($in['email'] ?? ''));
        $pass = $in['password'] ?? '';
        $role = in_array($in['role'] ?? '', ['buyer', 'farmer'], true) ? $in['role'] : 'buyer';
        if (!$name || !filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($pass) < 6) {
            json_out(['error' => 'Name, valid email and a password of at least 6 characters are required.'], 422);
        }
        $st = db()->prepare('SELECT id FROM users WHERE email = ?');
        $st->execute([$email]);
        if ($st->fetch()) json_out(['error' => 'That email is already registered.'], 409);

        $token = bin2hex(random_bytes(32));
        $st = db()->prepare('INSERT INTO users (name, email, password, role, phone, address, farm_name, token) VALUES (?,?,?,?,?,?,?,?)');
        $st->execute([
            $name, $email, password_hash($pass, PASSWORD_BCRYPT), $role,
            $in['phone'] ?? null, $in['address'] ?? null,
            $role === 'farmer' ? ($in['farm_name'] ?? null) : null, $token,
        ]);
        $_SERVER['HTTP_X_AUTH_TOKEN'] = $token;
        json_out(['token' => $token, 'user' => current_user()], 201);

    case 'login':
        $email = strtolower(trim($in['email'] ?? ''));
        $st = db()->prepare('SELECT id, password FROM users WHERE email = ?');
        $st->execute([$email]);
        $row = $st->fetch();
        if (!$row || !password_verify($in['password'] ?? '', $row['password'])) {
            json_out(['error' => 'Invalid email or password.'], 401);
        }
        $token = bin2hex(random_bytes(32));
        db()->prepare('UPDATE users SET token = ? WHERE id = ?')->execute([$token, $row['id']]);
        $_SERVER['HTTP_X_AUTH_TOKEN'] = $token;
        json_out(['token' => $token, 'user' => current_user()]);

    case 'me':
        json_out(['user' => require_user()]);

    case 'update':
        $u = require_user();
        [$lat, $lng] = clean_pin($in['lat'] ?? null, $in['lng'] ?? null);
        db()->prepare('UPDATE users SET name = ?, phone = ?, address = ?, lat = ?, lng = ?, farm_name = ? WHERE id = ?')->execute([
            trim($in['name'] ?? $u['name']), $in['phone'] ?? null, $in['address'] ?? null, $lat, $lng,
            $u['role'] === 'farmer' ? ($in['farm_name'] ?? null) : null, $u['id'],
        ]);
        json_out(['user' => current_user()]);

    case 'logout':
        $u = current_user();
        if ($u) db()->prepare('UPDATE users SET token = NULL WHERE id = ?')->execute([$u['id']]);
        json_out(['ok' => true]);

    default:
        json_out(['error' => 'Unknown action'], 404);
}
