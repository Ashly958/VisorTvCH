<?php
/**
 * Main API Router / Status & Upload static server fallback
 */
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.php';

$uri = $_SERVER['REQUEST_URI'] ?? '';
$path = parse_url($uri, PHP_URL_PATH) ?? '';

// Handle serving uploaded media files if routed through api/index.php (e.g. on Vercel)
if (strpos($path, '/uploads/') !== false) {
    $relative = preg_replace('#^.*?/uploads/#', '', $path);
    $filePath = UPLOAD_DIR . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, $relative);
    
    if (!file_exists($filePath)) {
        // Check fallback in api/uploads
        $fallback = __DIR__ . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, $relative);
        if (file_exists($fallback)) {
            $filePath = $fallback;
        }
    }

    if (file_exists($filePath) && is_file($filePath)) {
        $ext = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));
        $mimes = [
            'mp4' => 'video/mp4',
            'webm' => 'video/webm',
            'mov' => 'video/quicktime',
            'jpg' => 'image/jpeg',
            'jpeg' => 'image/jpeg',
            'png' => 'image/png',
            'webp' => 'image/webp',
            'gif' => 'image/gif',
            'svg' => 'image/svg+xml'
        ];
        $contentType = $mimes[$ext] ?? mime_content_type($filePath) ?: 'application/octet-stream';
        
        header('Content-Type: ' . $contentType);
        header('Content-Length: ' . filesize($filePath));
        header('Cache-Control: public, max-age=86400');
        readfile($filePath);
        exit();
    } else {
        json_error('Archivo multimedia no encontrado', 404);
    }
}

// Simple health check response
json_response([
    'success' => true,
    'app' => 'Visor TV Sistemas API',
    'status' => 'online',
    'version' => '1.0.0',
    'server_time' => date('Y-m-d H:i:s'),
    'endpoints' => [
        'POST /api/auth.php?action=login',
        'GET /api/auth.php?action=me',
        'GET /api/sedes.php',
        'POST /api/sedes.php',
        'GET /api/media.php?sede_id={id}',
        'POST /api/media.php',
        'GET /api/playlist.php?sede_id={id}',
        'GET /api/stats.php',
        'GET /api/settings.php'
    ]
]);
