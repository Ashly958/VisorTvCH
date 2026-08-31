<?php
/**
 * Sedes Management API
 */
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.php';

$db = get_db();
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';
$id = isset($_GET['id']) ? (int)$_GET['id'] : null;
$slug = isset($_GET['slug']) ? trim($_GET['slug']) : null;

// Helper to create a URL-safe slug
function make_slug($text) {
    $text = preg_replace('~[^\pL\d]+~u', '-', $text);
    $text = iconv('utf-8', 'us-ascii//TRANSLIT', $text);
    $text = preg_replace('~[^-\w]+~', '', $text);
    $text = trim($text, '-');
    $text = preg_replace('~-+~', '-', $text);
    $text = strtolower($text);
    return empty($text) ? 'sede-' . time() : $text;
}

// 1. REORDER SEDES
if ($action === 'reorder' && $method === 'POST') {
    require_auth();
    $input = get_json_input();
    $orders = $input['orders'] ?? [];

    if (!is_array($orders)) {
        json_error('Formato de orden inválido', 400);
    }

    $db->beginTransaction();
    try {
        $stmt = $db->prepare("UPDATE sedes SET order_num = :order_num, updated_at = CURRENT_TIMESTAMP WHERE id = :id");
        foreach ($orders as $item) {
            if (isset($item['id']) && isset($item['order_num'])) {
                $stmt->execute([
                    ':id' => (int)$item['id'],
                    ':order_num' => (int)$item['order_num']
                ]);
            }
        }
        $db->commit();
        json_response(['success' => true, 'message' => 'Orden de sedes actualizado']);
    } catch (Exception $e) {
        $db->rollBack();
        json_error('Error al reordenar sedes: ' . $e->getMessage(), 500);
    }
}

// 2. GET SINGLE SEDE
if ($method === 'GET' && ($id !== null || $slug !== null)) {
    if ($id !== null) {
        $stmt = $db->prepare("SELECT * FROM sedes WHERE id = :id LIMIT 1");
        $stmt->execute([':id' => $id]);
    } else {
        $stmt = $db->prepare("SELECT * FROM sedes WHERE slug = :slug LIMIT 1");
        $stmt->execute([':slug' => $slug]);
    }
    
    $sede = $stmt->fetch();
    if (!$sede) {
        json_error('Sede no encontrada', 404);
    }

    // Fetch stats for this sede
    $statsStmt = $db->prepare("
        SELECT 
            COUNT(*) as total_media,
            SUM(CASE WHEN type = 'video' THEN 1 ELSE 0 END) as total_videos,
            SUM(CASE WHEN type = 'image' THEN 1 ELSE 0 END) as total_images,
            SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_media
        FROM media_items
        WHERE sede_id = :sede_id
    ");
    $statsStmt->execute([':sede_id' => $sede['id']]);
    $stats = $statsStmt->fetch();

    $sede['total_media'] = (int)($stats['total_media'] ?? 0);
    $sede['total_videos'] = (int)($stats['total_videos'] ?? 0);
    $sede['total_images'] = (int)($stats['total_images'] ?? 0);
    $sede['active_media'] = (int)($stats['active_media'] ?? 0);

    json_response(['success' => true, 'data' => $sede]);
}

// 3. GET ALL SEDES
if ($method === 'GET') {
    $onlyActive = isset($_GET['public']) && $_GET['public'] == '1';
    $where = $onlyActive ? "WHERE s.is_active = 1" : "";

    $query = "
        SELECT 
            s.*,
            COUNT(m.id) as total_media,
            SUM(CASE WHEN m.type = 'video' THEN 1 ELSE 0 END) as total_videos,
            SUM(CASE WHEN m.type = 'image' THEN 1 ELSE 0 END) as total_images,
            SUM(CASE WHEN m.is_active = 1 THEN 1 ELSE 0 END) as active_media,
            (
                SELECT m2.filename 
                FROM media_items m2 
                WHERE m2.sede_id = s.id AND m2.is_active = 1 
                ORDER BY m2.order_num ASC, m2.id ASC 
                LIMIT 1
            ) as preview_filename,
            (
                SELECT m2.type 
                FROM media_items m2 
                WHERE m2.sede_id = s.id AND m2.is_active = 1 
                ORDER BY m2.order_num ASC, m2.id ASC 
                LIMIT 1
            ) as preview_type
        FROM sedes s
        LEFT JOIN media_items m ON s.id = m.sede_id
        $where
        GROUP BY s.id
        ORDER BY s.order_num ASC, s.id ASC
    ";

    $stmt = $db->query($query);
    $sedes = $stmt->fetchAll();

    foreach ($sedes as &$sede) {
        $sede['id'] = (int)$sede['id'];
        $sede['order_num'] = (int)$sede['order_num'];
        $sede['is_active'] = (int)$sede['is_active'];
        $sede['total_media'] = (int)($sede['total_media'] ?? 0);
        $sede['total_videos'] = (int)($sede['total_videos'] ?? 0);
        $sede['total_images'] = (int)($sede['total_images'] ?? 0);
        $sede['active_media'] = (int)($sede['active_media'] ?? 0);
        
        if (!empty($sede['preview_filename'])) {
            $sede['preview_url'] = format_media_url($sede['preview_filename']);
        } else {
            $sede['preview_url'] = null;
        }
    }

    json_response(['success' => true, 'data' => $sedes]);
}

// 4. CREATE NEW SEDE
if ($method === 'POST') {
    require_auth();
    $input = get_json_input();

    $name = trim($input['name'] ?? '');
    $description = trim($input['description'] ?? '');
    $address = trim($input['address'] ?? '');
    $color = trim($input['color'] ?? '#2563eb');
    $icon = trim($input['icon'] ?? 'Building2');
    $isActive = isset($input['is_active']) ? (int)$input['is_active'] : 1;

    if (empty($name)) {
        json_error('El nombre de la sede es obligatorio.', 400);
    }

    $slugBase = make_slug($name);
    $slug = $slugBase;
    $counter = 1;
    while (true) {
        $check = $db->prepare("SELECT id FROM sedes WHERE slug = :slug LIMIT 1");
        $check->execute([':slug' => $slug]);
        if (!$check->fetch()) break;
        $slug = $slugBase . '-' . $counter;
        $counter++;
    }

    // Get max order
    $orderStmt = $db->query("SELECT MAX(order_num) as max_order FROM sedes");
    $maxOrder = (int)($orderStmt->fetch()['max_order'] ?? 0);
    $orderNum = $maxOrder + 1;

    $stmt = $db->prepare("
        INSERT INTO sedes (name, slug, description, address, color, icon, order_num, is_active)
        VALUES (:name, :slug, :description, :address, :color, :icon, :order_num, :is_active)
    ");

    $stmt->execute([
        ':name' => $name,
        ':slug' => $slug,
        ':description' => $description,
        ':address' => $address,
        ':color' => $color,
        ':icon' => $icon,
        ':order_num' => $orderNum,
        ':is_active' => $isActive
    ]);

    $newId = (int)$db->lastInsertId();

    json_response([
        'success' => true,
        'message' => 'Sede creada exitosamente',
        'data' => [
            'id' => $newId,
            'name' => $name,
            'slug' => $slug,
            'description' => $description,
            'address' => $address,
            'color' => $color,
            'icon' => $icon,
            'order_num' => $orderNum,
            'is_active' => $isActive,
            'total_media' => 0,
            'active_media' => 0
        ]
    ], 201);
}

// 5. UPDATE SEDE
if ($method === 'PUT' && $id !== null) {
    require_auth();
    $input = get_json_input();

    $stmt = $db->prepare("SELECT * FROM sedes WHERE id = :id LIMIT 1");
    $stmt->execute([':id' => $id]);
    $sede = $stmt->fetch();
    if (!$sede) {
        json_error('Sede no encontrada', 404);
    }

    $name = trim($input['name'] ?? $sede['name']);
    $description = isset($input['description']) ? trim($input['description']) : $sede['description'];
    $address = isset($input['address']) ? trim($input['address']) : $sede['address'];
    $color = trim($input['color'] ?? $sede['color']);
    $icon = trim($input['icon'] ?? $sede['icon']);
    $isActive = isset($input['is_active']) ? (int)$input['is_active'] : (int)$sede['is_active'];
    $orderNum = isset($input['order_num']) ? (int)$input['order_num'] : (int)$sede['order_num'];

    if (empty($name)) {
        json_error('El nombre de la sede no puede estar vacío.', 400);
    }

    $updateStmt = $db->prepare("
        UPDATE sedes 
        SET name = :name, 
            description = :description, 
            address = :address, 
            color = :color, 
            icon = :icon, 
            order_num = :order_num, 
            is_active = :is_active, 
            updated_at = CURRENT_TIMESTAMP 
        WHERE id = :id
    ");

    $updateStmt->execute([
        ':name' => $name,
        ':description' => $description,
        ':address' => $address,
        ':color' => $color,
        ':icon' => $icon,
        ':order_num' => $orderNum,
        ':is_active' => $isActive,
        ':id' => $id
    ]);

    json_response([
        'success' => true,
        'message' => 'Sede actualizada correctamente'
    ]);
}

// 6. DELETE SEDE
if ($method === 'DELETE' && $id !== null) {
    require_auth();
    
    // Find all media items to delete files from disk
    $mediaStmt = $db->prepare("SELECT filename FROM media_items WHERE sede_id = :id");
    $mediaStmt->execute([':id' => $id]);
    $mediaFiles = $mediaStmt->fetchAll();

    foreach ($mediaFiles as $file) {
        $filePath = MEDIA_UPLOAD_DIR . DIRECTORY_SEPARATOR . $file['filename'];
        if (file_exists($filePath)) {
            @unlink($filePath);
        }
    }

    // Delete sede (foreign key cascade deletes media_items rows)
    $stmt = $db->prepare("DELETE FROM sedes WHERE id = :id");
    $stmt->execute([':id' => $id]);

    json_response([
        'success' => true,
        'message' => 'Sede y todos sus contenidos multimedia fueron eliminados'
    ]);
}

json_error('Método o solicitud no permitida', 405);
