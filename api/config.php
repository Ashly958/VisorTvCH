<?php
/**
 * Configuration & Core Helpers - Visor TV Sistemas
 */

// Enable error reporting for development logging
error_reporting(E_ALL);
ini_set('display_errors', '0');
ini_set('log_errors', '1');

// Lift all file size and execution limits for unlimited video sizes and durations
@ini_set('upload_max_filesize', '10G');
@ini_set('post_max_size', '10G');
@ini_set('memory_limit', '2048M');
@ini_set('max_execution_time', '0');
@ini_set('max_input_time', '0');

// Set time zone
date_default_timezone_set('America/Bogota');

// CORS Headers
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Max-Age: 86400");

// Handle preflight OPTIONS request
$reqMethod = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($reqMethod === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// System Paths (with Vercel / Serverless /tmp fallback)
define('BASE_DIR', dirname(__DIR__));
$isServerless = getenv('VERCEL') || getenv('AWS_LAMBDA_FUNCTION_NAME') || (!is_writable(BASE_DIR . DIRECTORY_SEPARATOR . 'database') && is_dir('/tmp'));

if ($isServerless) {
    define('DB_FILE', '/tmp/visor_tv.sqlite');
    define('UPLOAD_DIR', '/tmp/uploads');
    $sourceDb = BASE_DIR . DIRECTORY_SEPARATOR . 'database' . DIRECTORY_SEPARATOR . 'visor_tv.sqlite';
    if (!file_exists(DB_FILE) && file_exists($sourceDb)) {
        @copy($sourceDb, DB_FILE);
    }
} else {
    define('DB_FILE', BASE_DIR . DIRECTORY_SEPARATOR . 'database' . DIRECTORY_SEPARATOR . 'visor_tv.sqlite');
    define('UPLOAD_DIR', __DIR__ . DIRECTORY_SEPARATOR . 'uploads');
}

define('MEDIA_UPLOAD_DIR', UPLOAD_DIR . DIRECTORY_SEPARATOR . 'media');
define('SEDES_UPLOAD_DIR', UPLOAD_DIR . DIRECTORY_SEPARATOR . 'sedes');

// JWT / Token secret
define('SECRET_KEY', 'visor_tv_secret_key_2026_antigravity_safe_hash_token_#99');

// Ensure directories exist
if (!is_dir(UPLOAD_DIR)) @mkdir(UPLOAD_DIR, 0777, true);
if (!is_dir(MEDIA_UPLOAD_DIR)) @mkdir(MEDIA_UPLOAD_DIR, 0777, true);
if (!is_dir(SEDES_UPLOAD_DIR)) @mkdir(SEDES_UPLOAD_DIR, 0777, true);
if (!is_dir(dirname(DB_FILE))) @mkdir(dirname(DB_FILE), 0777, true);

/**
 * Return JSON response and exit
 */
function json_response($data, $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit();
}

/**
 * Return JSON error response and exit
 */
function json_error($message, $statusCode = 400, $errors = null) {
    $payload = [
        'success' => false,
        'error' => $message
    ];
    if ($errors !== null) {
        $payload['details'] = $errors;
    }
    json_response($payload, $statusCode);
}

/**
 * Get request JSON payload
 */
function get_json_input() {
    $raw = file_get_contents('php://input');
    if (empty($raw)) return [];
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

/**
 * Generate a secure token
 */
function generate_token($userId, $username) {
    $header = base64_encode(json_encode(['typ' => 'JWT', 'alg' => 'HS256']));
    $payload = base64_encode(json_encode([
        'user_id' => $userId,
        'username' => $username,
        'iat' => time(),
        'exp' => time() + (30 * 24 * 60 * 60) // 30 days
    ]));
    $signature = hash_hmac('sha256', "$header.$payload", SECRET_KEY, true);
    $encodedSignature = base64_encode($signature);
    return "$header.$payload.$encodedSignature";
}

/**
 * Verify and decode token
 */
function verify_token($jwt) {
    if (empty($jwt)) return false;
    $parts = explode('.', $jwt);
    if (count($parts) !== 3) return false;

    list($header64, $payload64, $signature64) = $parts;
    $signature = base64_decode($signature64);
    $expectedSignature = hash_hmac('sha256', "$header64.$payload64", SECRET_KEY, true);

    if (!hash_equals($signature, $expectedSignature)) {
        return false;
    }

    $payload = json_decode(base64_decode($payload64), true);
    if (!$payload || !isset($payload['exp']) || $payload['exp'] < time()) {
        return false;
    }

    return $payload;
}

/**
 * Require valid authentication token
 */
function require_auth() {
    $headers = function_exists('getallheaders') ? getallheaders() : [];
    $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    
    if (empty($authHeader) && isset($_SERVER['HTTP_AUTHORIZATION'])) {
        $authHeader = $_SERVER['HTTP_AUTHORIZATION'];
    }

    if (!empty($authHeader) && preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
        $token = $matches[1];
        $payload = verify_token($token);
        if ($payload) {
            return $payload;
        }
    }

    json_error('Acceso no autorizado. Por favor inicie sesión como administrador.', 401);
}

/**
 * Get base URL for uploaded media files
 */
function get_base_url() {
    $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off' || ($_SERVER['SERVER_PORT'] ?? 80) == 443) ? "https://" : "http://";
    $host = $_SERVER['HTTP_HOST'] ?? 'localhost:8000';
    return $protocol . $host;
}

/**
 * Resolve media URL (handles both external URLs and local uploads)
 */
function format_media_url($filename) {
    if (empty($filename)) return '';
    if (preg_match('/^https?:\/\//i', $filename)) {
        return $filename;
    }
    return get_base_url() . '/uploads/media/' . $filename;
}

/**
 * Format bytes to readable size
 */
function format_bytes($bytes, $precision = 2) {
    $units = ['B', 'KB', 'MB', 'GB', 'TB'];
    $bytes = max($bytes, 0);
    $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
    $pow = min($pow, count($units) - 1);
    $bytes /= pow(1024, $pow);
    return round($bytes, $precision) . ' ' . $units[$pow];
}
