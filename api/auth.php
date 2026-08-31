<?php
/**
 * Authentication Endpoint
 */
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.php';

$db = get_db();
$action = $_GET['action'] ?? 'login';
$method = $_SERVER['REQUEST_METHOD'];

if ($action === 'login' && $method === 'POST') {
    $input = get_json_input();
    $username = trim($input['username'] ?? '');
    $password = trim($input['password'] ?? '');

    if (empty($username) || empty($password)) {
        json_error('Por favor ingrese usuario y contraseña.', 400);
    }

    $stmt = $db->prepare("SELECT * FROM users WHERE username = :username LIMIT 1");
    $stmt->execute([':username' => $username]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($password, $user['password_hash'])) {
        json_error('Credenciales incorrectas. Verifique su usuario y contraseña.', 401);
    }

    $token = generate_token($user['id'], $user['username']);

    json_response([
        'success' => true,
        'message' => 'Inicio de sesión exitoso',
        'token' => $token,
        'user' => [
            'id' => (int)$user['id'],
            'username' => $user['username'],
            'name' => $user['name'],
            'role' => $user['role']
        ]
    ]);
}

if ($action === 'me' && $method === 'GET') {
    $payload = require_auth();
    $stmt = $db->prepare("SELECT id, username, name, role, created_at FROM users WHERE id = :id LIMIT 1");
    $stmt->execute([':id' => $payload['user_id']]);
    $user = $stmt->fetch();

    if (!$user) {
        json_error('Usuario no encontrado', 404);
    }

    json_response([
        'success' => true,
        'user' => [
            'id' => (int)$user['id'],
            'username' => $user['username'],
            'name' => $user['name'],
            'role' => $user['role'],
            'created_at' => $user['created_at']
        ]
    ]);
}

if ($action === 'change-password' && $method === 'POST') {
    $payload = require_auth();
    $input = get_json_input();
    $currentPassword = $input['current_password'] ?? '';
    $newPassword = $input['new_password'] ?? '';

    if (strlen($newPassword) < 4) {
        json_error('La nueva contraseña debe tener al menos 4 caracteres.', 400);
    }

    $stmt = $db->prepare("SELECT * FROM users WHERE id = :id LIMIT 1");
    $stmt->execute([':id' => $payload['user_id']]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($currentPassword, $user['password_hash'])) {
        json_error('La contraseña actual es incorrecta.', 400);
    }

    $newHash = password_hash($newPassword, PASSWORD_BCRYPT);
    $updateStmt = $db->prepare("UPDATE users SET password_hash = :hash, updated_at = CURRENT_TIMESTAMP WHERE id = :id");
    $updateStmt->execute([':hash' => $newHash, ':id' => $payload['user_id']]);

    json_response([
        'success' => true,
        'message' => 'Contraseña actualizada correctamente.'
    ]);
}

if ($action === 'update-profile' && $method === 'POST') {
    $payload = require_auth();
    $input = get_json_input();
    $name = trim($input['name'] ?? '');

    if (empty($name)) {
        json_error('El nombre no puede estar vacío.', 400);
    }

    $stmt = $db->prepare("UPDATE users SET name = :name, updated_at = CURRENT_TIMESTAMP WHERE id = :id");
    $stmt->execute([':name' => $name, ':id' => $payload['user_id']]);

    json_response([
        'success' => true,
        'message' => 'Perfil actualizado exitosamente.',
        'name' => $name
    ]);
}

json_error('Acción de autenticación no válida', 404);
