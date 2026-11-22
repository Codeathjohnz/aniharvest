<?php
require __DIR__ . '/config.php';
// any logged-in user: farmers/admin upload product photos & QR codes, buyers upload payment screenshots
require_user();

if (empty($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
    json_out(['error' => 'No image uploaded.'], 422);
}
$f = $_FILES['image'];
if ($f['size'] > 3 * 1024 * 1024) json_out(['error' => 'Image must be 3 MB or smaller.'], 422);

$allowed = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp', 'image/gif' => 'gif'];
$mime = mime_content_type($f['tmp_name']);
if (!isset($allowed[$mime])) json_out(['error' => 'Only JPG, PNG, WEBP or GIF images are allowed.'], 422);

$dir = __DIR__ . '/uploads';
if (!is_dir($dir)) mkdir($dir, 0775, true);
$name = bin2hex(random_bytes(10)) . '.' . $allowed[$mime];
move_uploaded_file($f['tmp_name'], "$dir/$name");

json_out(['path' => "uploads/$name"], 201);
