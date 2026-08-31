<?php
/**
 * System Settings API
 */
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.php';

$db = get_db();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $stmt = $db->query("SELECT key, value FROM settings");
    $settings = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);
    json_response(['success' => true, 'settings' => $settings]);
}

if ($method === 'PUT' || $method === 'POST') {
    require_auth();
    $input = get_json_input();
    $allowedKeys = [
        'app_name',
        'default_image_duration',
        'tv_show_clock',
        'tv_show_sede_title',
        'tv_show_progress_bar',
        'tv_auto_refresh_seconds',
        'tv_transition_effect'
    ];

    $stmt = $db->prepare("INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (:key, :value, CURRENT_TIMESTAMP)");

    foreach ($input as $key => $value) {
        if (in_array($key, $allowedKeys)) {
            $stmt->execute([
                ':key' => $key,
                ':value' => (string)$value
            ]);
        }
    }

    json_response(['success' => true, 'message' => 'Configuración guardada exitosamente']);
}

json_error('Método no permitido', 405);
