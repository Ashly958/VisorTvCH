<?php
/**
 * Public High-Performance Playlist API for Visor TV
 */
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.php';

$db = get_db();
$sedeId = isset($_GET['sede_id']) ? (int)$_GET['sede_id'] : null;
$slug = isset($_GET['slug']) ? trim($_GET['slug']) : null;
$checkVersionOnly = isset($_GET['check_version']) && $_GET['check_version'] == '1';

if ($sedeId === null && empty($slug)) {
    json_error('Debe especificar el parámetro sede_id o slug', 400);
}

// Find Sede
if ($sedeId !== null) {
    $sedeStmt = $db->prepare("SELECT id, name, slug, description, address, color, icon, is_active FROM sedes WHERE id = :id LIMIT 1");
    $sedeStmt->execute([':id' => $sedeId]);
} else {
    $sedeStmt = $db->prepare("SELECT id, name, slug, description, address, color, icon, is_active FROM sedes WHERE slug = :slug LIMIT 1");
    $sedeStmt->execute([':slug' => $slug]);
}

$sede = $sedeStmt->fetch();
if (!$sede) {
    json_error('Sede no encontrada', 404);
}

if (!$sede['is_active']) {
    json_error('Esta sede se encuentra temporalmente inactiva en el sistema', 403);
}

// Fetch active media items
$mediaStmt = $db->prepare("
    SELECT id, title, type, filename, original_name, file_size, duration, fit_mode, order_num, updated_at
    FROM media_items
    WHERE sede_id = :sede_id AND is_active = 1
    ORDER BY order_num ASC, id ASC
");
$mediaStmt->execute([':sede_id' => $sede['id']]);
$items = $mediaStmt->fetchAll();

// Fetch general TV settings
$settingsStmt = $db->query("SELECT key, value, updated_at FROM settings");
$settingsRows = $settingsStmt->fetchAll();
$rawSettings = [];
$settingsHash = '';
foreach ($settingsRows as $row) {
    $rawSettings[$row['key']] = $row['value'];
    $settingsHash .= $row['key'] . ':' . $row['value'] . ':' . ($row['updated_at'] ?? '') . '_';
}

// Build unique version hash
$hashString = $sede['id'] . '_' . count($items) . '_' . md5($settingsHash);
foreach ($items as $item) {
    $hashString .= '_' . $item['id'] . ':' . $item['updated_at'] . ':' . $item['order_num'];
}
$versionHash = md5($hashString);

// If client only asked for version check
if ($checkVersionOnly) {
    json_response([
        'success' => true,
        'version_hash' => $versionHash,
        'items_count' => count($items)
    ]);
}

$formattedItems = [];
foreach ($items as $item) {
    $formattedItems[] = [
        'id' => (int)$item['id'],
        'title' => $item['title'],
        'type' => $item['type'],
        'filename' => $item['filename'],
        'url' => format_media_url($item['filename']),
        'duration' => $item['type'] === 'video' ? 0 : ((int)$item['duration'] > 0 ? (int)$item['duration'] : 10),
        'fit_mode' => !empty($item['fit_mode']) ? $item['fit_mode'] : 'contain',
        'order_num' => (int)$item['order_num']
    ];
}

json_response([
    'success' => true,
    'version_hash' => $versionHash,
    'sede' => [
        'id' => (int)$sede['id'],
        'name' => $sede['name'],
        'slug' => $sede['slug'],
        'description' => $sede['description'],
        'address' => $sede['address'],
        'color' => $sede['color'],
        'icon' => $sede['icon']
    ],
    'settings' => [
        'app_name' => $rawSettings['app_name'] ?? 'Visor TV Sistemas',
        'tv_show_clock' => ($rawSettings['tv_show_clock'] ?? '1') === '1',
        'tv_show_sede_title' => ($rawSettings['tv_show_sede_title'] ?? '1') === '1',
        'tv_show_progress_bar' => ($rawSettings['tv_show_progress_bar'] ?? '1') === '1',
        'tv_auto_refresh_seconds' => (int)($rawSettings['tv_auto_refresh_seconds'] ?? 30),
        'tv_transition_effect' => $rawSettings['tv_transition_effect'] ?? 'fade'
    ],
    'playlist' => $formattedItems
]);
