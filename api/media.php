<?php
/**
 * Media Management API (Videos & Images CRUD + Upload)
 */
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.php';

$db = get_db();
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';
$id = isset($_GET['id']) ? (int)$_GET['id'] : null;
$sedeId = isset($_GET['sede_id']) ? (int)$_GET['sede_id'] : (isset($_POST['sede_id']) ? (int)$_POST['sede_id'] : null);

// Helper for allowed extensions and types
function get_media_type($filename, $mimeType = '') {
    $ext = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
    $videoExts = ['mp4', 'webm', 'ogg', 'mov', 'm4v', 'mkv'];
    $imageExts = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'];

    if (in_array($ext, $videoExts, true)) {
        return 'video';
    }
    if (in_array($ext, $imageExts, true)) {
        return 'image';
    }
    return null;
}

// 1. REORDER MEDIA ITEMS
if ($action === 'reorder' && $method === 'POST') {
    require_auth();
    $input = get_json_input();
    $orders = $input['orders'] ?? [];

    if (!is_array($orders)) {
        json_error('Formato de orden inválido', 400);
    }

    $db->beginTransaction();
    try {
        $stmt = $db->prepare("UPDATE media_items SET order_num = :order_num, updated_at = CURRENT_TIMESTAMP WHERE id = :id");
        foreach ($orders as $item) {
            if (isset($item['id']) && isset($item['order_num'])) {
                $stmt->execute([
                    ':id' => (int)$item['id'],
                    ':order_num' => (int)$item['order_num']
                ]);
            }
        }
        $db->commit();
        json_response(['success' => true, 'message' => 'Orden multimedia actualizado con éxito']);
    } catch (Exception $e) {
        $db->rollBack();
        json_error('Error al actualizar el orden: ' . $e->getMessage(), 500);
    }
}

// 2. BULK DELETE MEDIA ITEMS
if ($action === 'bulk-delete' && $method === 'POST') {
    require_auth();
    $input = get_json_input();
    $ids = $input['ids'] ?? [];

    if (!is_array($ids) || empty($ids)) {
        json_error('No se especificaron elementos para eliminar', 400);
    }

    $placeholders = implode(',', array_fill(0, count($ids), '?'));
    $stmt = $db->prepare("SELECT id, filename FROM media_items WHERE id IN ($placeholders)");
    $stmt->execute($ids);
    $items = $stmt->fetchAll();

    foreach ($items as $item) {
        $filePath = MEDIA_UPLOAD_DIR . DIRECTORY_SEPARATOR . $item['filename'];
        if (file_exists($filePath)) {
            @unlink($filePath);
        }
    }

    $deleteStmt = $db->prepare("DELETE FROM media_items WHERE id IN ($placeholders)");
    $deleteStmt->execute($ids);

    json_response([
        'success' => true,
        'message' => count($items) . ' elemento(s) multimedia eliminado(s) exitosamente'
    ]);
}

// 3. ADD MEDIA VIA URL (Unlimited Video Size / Vercel External CDN support)
if ($action === 'add-url' && $method === 'POST') {
    require_auth();
    $input = get_json_input();
    
    $targetSedeId = isset($input['sede_id']) ? (int)$input['sede_id'] : $sedeId;
    $url = isset($input['url']) ? trim($input['url']) : '';
    $title = isset($input['title']) ? trim($input['title']) : '';
    $type = isset($input['type']) && in_array($input['type'], ['video', 'image']) ? $input['type'] : null;
    $duration = isset($input['duration']) ? (int)$input['duration'] : 10;
    $fitMode = isset($input['fit_mode']) && in_array($input['fit_mode'], ['contain', 'cover']) ? $input['fit_mode'] : 'contain';

    if (empty($url) || !preg_match('/^https?:\/\//i', $url)) {
        json_error('Debe ingresar una URL válida que empiece con http:// o https://', 400);
    }
    if ($targetSedeId === null || $targetSedeId <= 0) {
        json_error('Debe especificar la sede correspondiente', 400);
    }

    if (!$type) {
        $pathOnly = parse_url($url, PHP_URL_PATH) ?? '';
        $type = get_media_type($pathOnly) ?: 'video';
    }

    if (empty($title)) {
        $pathOnly = parse_url($url, PHP_URL_PATH) ?? 'video';
        $title = pathinfo($pathOnly, PATHINFO_FILENAME) ?: 'Enlace Multimedia';
    }

    $orderStmt = $db->prepare("SELECT MAX(order_num) as max_order FROM media_items WHERE sede_id = :sede_id");
    $orderStmt->execute([':sede_id' => $targetSedeId]);
    $currentMaxOrder = (int)($orderStmt->fetch()['max_order'] ?? 0) + 1;

    $insertStmt = $db->prepare("
        INSERT INTO media_items (sede_id, title, type, filename, original_name, mime_type, file_size, duration, fit_mode, order_num, is_active)
        VALUES (:sede_id, :title, :type, :filename, :original_name, :mime_type, 0, :duration, :fit_mode, :order_num, 1)
    ");

    $insertStmt->execute([
        ':sede_id' => $targetSedeId,
        ':title' => $title,
        ':type' => $type,
        ':filename' => $url,
        ':original_name' => $url,
        ':mime_type' => ($type === 'video' ? 'video/mp4' : 'image/jpeg'),
        ':duration' => ($type === 'video' ? 0 : $duration),
        ':fit_mode' => $fitMode,
        ':order_num' => $currentMaxOrder
    ]);

    $newItemId = (int)$db->lastInsertId();

    json_response([
        'success' => true,
        'message' => 'Contenido multimedia por URL añadido exitosamente',
        'data' => [
            'id' => $newItemId,
            'sede_id' => $targetSedeId,
            'title' => $title,
            'type' => $type,
            'filename' => $url,
            'url' => $url,
            'duration' => ($type === 'video' ? 0 : $duration),
            'fit_mode' => $fitMode,
            'order_num' => $currentMaxOrder,
            'is_active' => 1
        ]
    ], 201);
}

// 4. GET MEDIA ITEMS (List by Sede or single item)
if ($method === 'GET') {
    if ($id !== null) {
        $stmt = $db->prepare("SELECT m.*, s.name as sede_name FROM media_items m JOIN sedes s ON m.sede_id = s.id WHERE m.id = :id LIMIT 1");
        $stmt->execute([':id' => $id]);
        $item = $stmt->fetch();
        if (!$item) json_error('Elemento no encontrado', 404);
        
        $item['url'] = format_media_url($item['filename']);
        $item['formatted_size'] = format_bytes($item['file_size']);
        json_response(['success' => true, 'data' => $item]);
    }

    if ($sedeId === null) {
        json_error('El ID de sede es requerido para listar los archivos multimedia', 400);
    }

    $onlyActive = isset($_GET['active_only']) && $_GET['active_only'] == '1';
    $where = "WHERE sede_id = :sede_id";
    if ($onlyActive) {
        $where .= " AND is_active = 1";
    }

    $stmt = $db->prepare("
        SELECT * FROM media_items 
        $where 
        ORDER BY order_num ASC, id ASC
    ");
    $stmt->execute([':sede_id' => $sedeId]);
    $items = $stmt->fetchAll();

    foreach ($items as &$item) {
        $item['id'] = (int)$item['id'];
        $item['sede_id'] = (int)$item['sede_id'];
        $item['file_size'] = (int)$item['file_size'];
        $item['duration'] = (int)$item['duration'];
        $item['order_num'] = (int)$item['order_num'];
        $item['is_active'] = (int)$item['is_active'];
        $item['url'] = format_media_url($item['filename']);
        $item['formatted_size'] = format_bytes($item['file_size']);
    }

    json_response(['success' => true, 'data' => $items]);
}

// 4. UPLOAD MEDIA (Single or Multiple files)
if ($method === 'POST') {
    require_auth();

    if ($sedeId === null) {
        json_error('Debe especificar la sede para los archivos subidos (sede_id)', 400);
    }

    // Verify Sede exists
    $checkSede = $db->prepare("SELECT id FROM sedes WHERE id = :id");
    $checkSede->execute([':id' => $sedeId]);
    if (!$checkSede->fetch()) {
        json_error('La sede especificada no existe', 404);
    }

    if (empty($_FILES)) {
        json_error('No se recibió ningún archivo para subir. Verifique el tamaño máximo permitido.', 400);
    }

    // Normalize $_FILES into an array of files
    $files = [];
    if (isset($_FILES['files'])) {
        $f = $_FILES['files'];
        if (is_array($f['name'])) {
            for ($i = 0; $i < count($f['name']); $i++) {
                if ($f['error'][$i] === UPLOAD_ERR_OK) {
                    $files[] = [
                        'name' => $f['name'][$i],
                        'type' => $f['type'][$i],
                        'tmp_name' => $f['tmp_name'][$i],
                        'error' => $f['error'][$i],
                        'size' => $f['size'][$i]
                    ];
                }
            }
        } else if ($f['error'] === UPLOAD_ERR_OK) {
            $files[] = $f;
        }
    } elseif (isset($_FILES['file'])) {
        if ($_FILES['file']['error'] === UPLOAD_ERR_OK) {
            $files[] = $_FILES['file'];
        }
    }

    if (empty($files)) {
        json_error('No se pudo procesar ningún archivo válido o hubo un error en la carga.', 400);
    }

    // Get current max order for this sede
    $orderStmt = $db->prepare("SELECT MAX(order_num) as max_order FROM media_items WHERE sede_id = :sede_id");
    $orderStmt->execute([':sede_id' => $sedeId]);
    $currentMaxOrder = (int)($orderStmt->fetch()['max_order'] ?? 0);

    $durationParam = isset($_POST['duration']) ? max(3, (int)$_POST['duration']) : 10;
    $fitMode = isset($_POST['fit_mode']) && in_array($_POST['fit_mode'], ['contain', 'cover']) ? $_POST['fit_mode'] : 'contain';

    $uploadedItems = [];
    $insertStmt = $db->prepare("
        INSERT INTO media_items (sede_id, title, type, filename, original_name, mime_type, file_size, duration, fit_mode, order_num, is_active)
        VALUES (:sede_id, :title, :type, :filename, :original_name, :mime_type, :file_size, :duration, :fit_mode, :order_num, 1)
    ");

    $baseUrl = get_base_url();

    foreach ($files as $file) {
        $originalName = $file['name'];
        $ext = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
        $mimeType = mime_content_type($file['tmp_name']) ?: $file['type'];
        $type = get_media_type($originalName, $mimeType);

        if (!$type) {
            continue; // Skip unsupported formats
        }

        // Generate unique filename
        $cleanBaseName = preg_replace('/[^a-zA-Z0-9_-]/', '_', pathinfo($originalName, PATHINFO_FILENAME));
        $uniqueFilename = 'sede' . $sedeId . '_' . time() . '_' . substr(md5(uniqid(rand(), true)), 0, 8) . '.' . $ext;
        $targetPath = MEDIA_UPLOAD_DIR . DIRECTORY_SEPARATOR . $uniqueFilename;

        if (move_uploaded_file($file['tmp_name'], $targetPath)) {
            $currentMaxOrder++;
            $title = pathinfo($originalName, PATHINFO_FILENAME);
            $fileSize = (int)$file['size'];

            $insertStmt->execute([
                ':sede_id' => $sedeId,
                ':title' => $title,
                ':type' => $type,
                ':filename' => $uniqueFilename,
                ':original_name' => $originalName,
                ':mime_type' => $mimeType,
                ':file_size' => $fileSize,
                ':duration' => ($type === 'image' ? $durationParam : 0),
                ':fit_mode' => $fitMode,
                ':order_num' => $currentMaxOrder
            ]);

            $newItemId = (int)$db->lastInsertId();

            $uploadedItems[] = [
                'id' => $newItemId,
                'sede_id' => $sedeId,
                'title' => $title,
                'type' => $type,
                'filename' => $uniqueFilename,
                'original_name' => $originalName,
                'mime_type' => $mimeType,
                'file_size' => $fileSize,
                'formatted_size' => format_bytes($fileSize),
                'duration' => ($type === 'image' ? $durationParam : 0),
                'fit_mode' => $fitMode,
                'order_num' => $currentMaxOrder,
                'is_active' => 1,
                'url' => $baseUrl . '/uploads/media/' . $uniqueFilename
            ];
        }
    }

    if (empty($uploadedItems)) {
        json_error('Los archivos no tenían formatos permitidos (Videos: MP4, WebM, MOV. Imágenes: JPG, PNG, WEBP, GIF)', 400);
    }

    json_response([
        'success' => true,
        'message' => count($uploadedItems) . ' archivo(s) subido(s) con éxito',
        'data' => $uploadedItems
    ], 201);
}

// 5. UPDATE MEDIA ITEM
if ($method === 'PUT' && $id !== null) {
    require_auth();
    $input = get_json_input();

    $stmt = $db->prepare("SELECT * FROM media_items WHERE id = :id LIMIT 1");
    $stmt->execute([':id' => $id]);
    $item = $stmt->fetch();
    if (!$item) json_error('Elemento no encontrado', 404);

    $title = isset($input['title']) ? trim($input['title']) : $item['title'];
    $duration = isset($input['duration']) ? max(2, (int)$input['duration']) : (int)$item['duration'];
    $fitMode = isset($input['fit_mode']) && in_array($input['fit_mode'], ['contain', 'cover']) ? $input['fit_mode'] : $item['fit_mode'];
    $isActive = isset($input['is_active']) ? (int)$input['is_active'] : (int)$item['is_active'];
    $orderNum = isset($input['order_num']) ? (int)$input['order_num'] : (int)$item['order_num'];

    $updateStmt = $db->prepare("
        UPDATE media_items 
        SET title = :title, 
            duration = :duration, 
            fit_mode = :fit_mode, 
            is_active = :is_active, 
            order_num = :order_num, 
            updated_at = CURRENT_TIMESTAMP 
        WHERE id = :id
    ");

    $updateStmt->execute([
        ':title' => $title,
        ':duration' => $duration,
        ':fit_mode' => $fitMode,
        ':is_active' => $isActive,
        ':order_num' => $orderNum,
        ':id' => $id
    ]);

    json_response([
        'success' => true,
        'message' => 'Multimedia actualizada correctamente'
    ]);
}

// 6. DELETE SINGLE MEDIA ITEM
if ($method === 'DELETE' && $id !== null) {
    require_auth();

    $stmt = $db->prepare("SELECT filename FROM media_items WHERE id = :id LIMIT 1");
    $stmt->execute([':id' => $id]);
    $item = $stmt->fetch();
    if (!$item) json_error('Elemento no encontrado', 404);

    $filePath = MEDIA_UPLOAD_DIR . DIRECTORY_SEPARATOR . $item['filename'];
    if (file_exists($filePath)) {
        @unlink($filePath);
    }

    $delStmt = $db->prepare("DELETE FROM media_items WHERE id = :id");
    $delStmt->execute([':id' => $id]);

    json_response([
        'success' => true,
        'message' => 'Archivo multimedia eliminado'
    ]);
}

json_error('Solicitud no permitida', 405);
