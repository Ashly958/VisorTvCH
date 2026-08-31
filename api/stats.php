<?php
/**
 * Admin Dashboard Stats API
 */
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.php';

require_auth();
$db = get_db();

// Total sedes
$sedesCount = $db->query("
    SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active
    FROM sedes
")->fetch();

// Media counts
$mediaCount = $db->query("
    SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN type = 'video' THEN 1 ELSE 0 END) as videos,
        SUM(CASE WHEN type = 'image' THEN 1 ELSE 0 END) as images,
        SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active,
        SUM(file_size) as total_bytes
    FROM media_items
")->fetch();

// Sedes with counts
$sedesList = $db->query("
    SELECT 
        s.id, s.name, s.slug, s.color, s.icon, s.is_active,
        COUNT(m.id) as media_count,
        SUM(CASE WHEN m.type = 'video' THEN 1 ELSE 0 END) as video_count,
        SUM(CASE WHEN m.type = 'image' THEN 1 ELSE 0 END) as image_count,
        SUM(CASE WHEN m.is_active = 1 THEN 1 ELSE 0 END) as active_media_count
    FROM sedes s
    LEFT JOIN media_items m ON s.id = m.sede_id
    GROUP BY s.id
    ORDER BY s.order_num ASC, s.id ASC
")->fetchAll();

// Disk usage in upload folder
$totalDirSize = 0;
if (is_dir(MEDIA_UPLOAD_DIR)) {
    foreach (scandir(MEDIA_UPLOAD_DIR) as $f) {
        if ($f !== '.' && $f !== '..') {
            $totalDirSize += filesize(MEDIA_UPLOAD_DIR . DIRECTORY_SEPARATOR . $f);
        }
    }
}

// Recent uploads
$recentUploads = $db->query("
    SELECT m.id, m.title, m.type, m.filename, m.file_size, m.created_at, s.name as sede_name, s.color as sede_color
    FROM media_items m
    JOIN sedes s ON m.sede_id = s.id
    ORDER BY m.id DESC
    LIMIT 6
")->fetchAll();

foreach ($recentUploads as &$item) {
    $item['url'] = format_media_url($item['filename']);
    $item['formatted_size'] = format_bytes((int)$item['file_size']);
}

json_response([
    'success' => true,
    'stats' => [
        'total_sedes' => (int)($sedesCount['total'] ?? 0),
        'active_sedes' => (int)($sedesCount['active'] ?? 0),
        'total_media' => (int)($mediaCount['total'] ?? 0),
        'total_videos' => (int)($mediaCount['videos'] ?? 0),
        'total_images' => (int)($mediaCount['images'] ?? 0),
        'active_media' => (int)($mediaCount['active'] ?? 0),
        'total_storage_bytes' => (int)($mediaCount['total_bytes'] ?? $totalDirSize),
        'formatted_storage' => format_bytes((int)($mediaCount['total_bytes'] ?? $totalDirSize))
    ],
    'sedes' => $sedesList,
    'recent_media' => $recentUploads,
    'system' => [
        'php_version' => PHP_VERSION,
        'upload_max_filesize' => ini_get('upload_max_filesize'),
        'post_max_size' => ini_get('post_max_size'),
        'server_time' => date('Y-m-d H:i:s')
    ]
]);
