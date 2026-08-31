<?php
/**
 * Main API Router / Status & Upload static server fallback
 */
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.php';

// If requested directly:
$uri = $_SERVER['REQUEST_URI'] ?? '';
$path = parse_url($uri, PHP_URL_PATH);

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
