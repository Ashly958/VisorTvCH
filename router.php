<?php
/**
 * Built-in PHP Server Router for Visor TV Sistemas
 * Handles API endpoints, media streaming with Range requests, caching, and React SPA routing.
 */

$rawUri = $_SERVER['REQUEST_URI'] ?? '/';
$uri = parse_url($rawUri, PHP_URL_PATH) ?: '/';

// 1. API Endpoints
if (strpos($uri, '/api') === 0) {
    $apiFile = preg_replace('#^/api/?#', '', $uri);
    if (empty($apiFile) || $apiFile === 'index.php') {
        require __DIR__ . '/api/index.php';
        exit();
    }
    
    if (!preg_match('/\.php$/', $apiFile)) {
        $apiFile .= '.php';
    }
    
    // Prevent directory traversal
    $cleanPath = basename($apiFile);
    $targetScript = __DIR__ . '/api/' . $cleanPath;

    if (file_exists($targetScript)) {
        require $targetScript;
        exit();
    } else {
        http_response_code(404);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['error' => 'Endpoint no encontrado: ' . $uri], JSON_UNESCAPED_UNICODE);
        exit();
    }
}

// 2. Media Uploads with Video Streaming (Range Requests & Caching)
if (strpos($uri, '/uploads') === 0) {
    $relativePath = ltrim(preg_replace('#^/uploads/#', '', $uri), '/');
    $realUploadDir = realpath(__DIR__ . '/api/uploads');
    $requestedPath = realpath(__DIR__ . '/api/uploads/' . $relativePath);

    // Verify path exists and stays inside uploads directory
    if ($requestedPath && $realUploadDir && strpos($requestedPath, $realUploadDir) === 0 && !is_dir($requestedPath)) {
        serve_media_file($requestedPath);
        exit();
    } else {
        http_response_code(404);
        header('Content-Type: text/plain; charset=utf-8');
        echo 'Archivo multimedia no encontrado';
        exit();
    }
}

// 3. React Static Assets
$distDir = realpath(__DIR__ . '/client/dist');
if ($distDir) {
    $requestedStatic = realpath($distDir . $uri);
    if ($requestedStatic && strpos($requestedStatic, $distDir) === 0 && !is_dir($requestedStatic) && $uri !== '/' && $uri !== '') {
        $ext = strtolower(pathinfo($requestedStatic, PATHINFO_EXTENSION));
        $mimeTypes = [
            'js' => 'application/javascript; charset=utf-8',
            'css' => 'text/css; charset=utf-8',
            'json' => 'application/json; charset=utf-8',
            'png' => 'image/png',
            'jpg' => 'image/jpeg',
            'jpeg' => 'image/jpeg',
            'svg' => 'image/svg+xml',
            'ico' => 'image/x-icon',
            'woff' => 'font/woff',
            'woff2' => 'font/woff2',
            'ttf' => 'font/ttf',
            'webp' => 'image/webp',
            'mp4' => 'video/mp4',
        ];

        if (isset($mimeTypes[$ext])) {
            header('Content-Type: ' . $mimeTypes[$ext]);
        }

        // Cache hashed assets from Vite build for 1 year
        if (strpos($uri, '/assets/') === 0) {
            header('Cache-Control: public, max-age=31536000, immutable');
        } else {
            header('Cache-Control: public, max-age=86400');
        }

        header('Content-Length: ' . filesize($requestedStatic));
        readfile($requestedStatic);
        exit();
    }
}

// 4. SPA Fallback (Single Page Application Router)
$spaIndex = __DIR__ . '/client/dist/index.html';
if (file_exists($spaIndex)) {
    header('Content-Type: text/html; charset=utf-8');
    header('Cache-Control: no-cache, no-store, must-revalidate');
    readfile($spaIndex);
    exit();
}

// If dist is not built yet, show guidance
echo '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Visor TV Sistemas</title></head><body style="font-family:system-ui,sans-serif;text-align:center;padding:50px;background:#0f172a;color:#f8fafc;"><h1>Visor TV Sistemas</h1><p>Por favor ejecute <code>npm run build</code> en la carpeta <code>client</code> para compilar la interfaz de usuario.</p></body></html>';
exit();

/**
 * Stream media file supporting HTTP Range requests for video seeking on TVs and ETag caching
 */
function serve_media_file($path) {
    $size = filesize($path);
    $mtime = filemtime($path);
    $etag = '"' . md5($path . $size . $mtime) . '"';

    // Check ETag
    if (isset($_SERVER['HTTP_IF_NONE_MATCH']) && trim($_SERVER['HTTP_IF_NONE_MATCH']) === $etag) {
        http_response_code(304);
        exit();
    }

    $mime = mime_content_type($path) ?: 'application/octet-stream';
    $ext = strtolower(pathinfo($path, PATHINFO_EXTENSION));
    
    // Explicit MIME mapping for modern media formats
    $mimeMap = [
        'mp4' => 'video/mp4',
        'webm' => 'video/webm',
        'mov' => 'video/quicktime',
        'm4v' => 'video/mp4',
        'ogg' => 'video/ogg',
        'jpg' => 'image/jpeg',
        'jpeg' => 'image/jpeg',
        'png' => 'image/png',
        'webp' => 'image/webp',
        'gif' => 'image/gif',
        'svg' => 'image/svg+xml',
    ];

    if (isset($mimeMap[$ext])) {
        $mime = $mimeMap[$ext];
    }

    header('Content-Type: ' . $mime);
    header('Accept-Ranges: bytes');
    header('Access-Control-Allow-Origin: *');
    header('ETag: ' . $etag);
    header('Last-Modified: ' . gmdate('D, d M Y H:i:s', $mtime) . ' GMT');
    header('Cache-Control: public, max-age=604800, stale-while-revalidate=86400');

    $start = 0;
    $end = $size - 1;

    if (isset($_SERVER['HTTP_RANGE'])) {
        $range = $_SERVER['HTTP_RANGE'];
        if (preg_match('/bytes=\h*(\d+)-(\d*)[\D.*]?/i', $range, $matches)) {
            $start = intval($matches[1]);
            if (!empty($matches[2])) {
                $end = intval($matches[2]);
            }
        }

        // Validate range bounds
        if ($start > $end || $start >= $size || $end >= $size) {
            http_response_code(416);
            header("Content-Range: bytes */$size");
            exit();
        }

        $length = $end - $start + 1;
        http_response_code(206);
        header("Content-Range: bytes $start-$end/$size");
        header("Content-Length: $length");

        $fp = fopen($path, 'rb');
        if ($fp === false) {
            http_response_code(500);
            exit();
        }

        fseek($fp, $start);
        $bufferSize = 1024 * 512; // 512 KB high-speed chunks for smooth HD/4K video playback
        while (!feof($fp) && ($pos = ftell($fp)) <= $end) {
            if (connection_aborted()) {
                break;
            }
            if ($pos + $bufferSize > $end) {
                $bufferSize = $end - $pos + 1;
            }
            echo fread($fp, $bufferSize);
            flush();
        }
        fclose($fp);
    } else {
        header('Content-Length: ' . $size);
        readfile($path);
    }
}
