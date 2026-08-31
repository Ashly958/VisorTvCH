<?php
/**
 * Database connection & Automatic Schema Initialization
 */
require_once __DIR__ . '/config.php';

function get_db() {
    static $db = null;
    if ($db !== null) {
        return $db;
    }

    try {
        $dbFile = DB_FILE;
        $dbDir = dirname($dbFile);
        if (!is_dir($dbDir)) {
            @mkdir($dbDir, 0777, true);
        }

        $db = new PDO('sqlite:' . $dbFile);
        $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        
        try { $db->exec('PRAGMA foreign_keys = ON;'); } catch (Throwable $t) {}
        try { $db->exec('PRAGMA synchronous = NORMAL;'); } catch (Throwable $t) {}
        try { $db->exec('PRAGMA temp_store = MEMORY;'); } catch (Throwable $t) {}
        
        initialize_schema($db);
        return $db;
    } catch (Throwable $e) {
        json_error('Error de conexión a la base de datos: ' . $e->getMessage(), 500);
    }
}

function initialize_schema($db) {
    // 1. Users table
    $db->exec("
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            name TEXT NOT NULL,
            role TEXT DEFAULT 'admin',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    ");

    // 2. Sedes table
    $db->exec("
        CREATE TABLE IF NOT EXISTS sedes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            slug TEXT UNIQUE NOT NULL,
            description TEXT,
            address TEXT,
            color TEXT DEFAULT '#2563eb',
            icon TEXT DEFAULT 'Building2',
            order_num INTEGER DEFAULT 0,
            is_active INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    ");

    // 3. Media Items table
    $db->exec("
        CREATE TABLE IF NOT EXISTS media_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sede_id INTEGER NOT NULL,
            title TEXT,
            type TEXT NOT NULL, -- 'video' or 'image'
            filename TEXT NOT NULL,
            original_name TEXT NOT NULL,
            mime_type TEXT NOT NULL,
            file_size INTEGER NOT NULL,
            duration INTEGER DEFAULT 10, -- In seconds for images
            fit_mode TEXT DEFAULT 'contain', -- 'contain' or 'cover'
            order_num INTEGER DEFAULT 0,
            is_active INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (sede_id) REFERENCES sedes(id) ON DELETE CASCADE
        );
    ");

    // 4. System Settings table
    $db->exec("
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    ");

    // Indexes for fast querying & polling
    $db->exec("CREATE INDEX IF NOT EXISTS idx_media_sede_order ON media_items(sede_id, is_active, order_num);");
    $db->exec("CREATE INDEX IF NOT EXISTS idx_sedes_order ON sedes(order_num, is_active);");
    $db->exec("CREATE INDEX IF NOT EXISTS idx_sedes_slug ON sedes(slug);");

    // Seed default admin user if none exists
    $stmt = $db->query("SELECT COUNT(*) as count FROM users");
    $userCount = $stmt->fetch()['count'];
    if ($userCount == 0) {
        $defaultPasswordHash = password_hash('admin123', PASSWORD_BCRYPT);
        $insertUser = $db->prepare("
            INSERT INTO users (username, password_hash, name, role)
            VALUES (:username, :hash, :name, :role)
        ");
        $insertUser->execute([
            ':username' => 'admin',
            ':hash' => $defaultPasswordHash,
            ':name' => 'Administrador General',
            ':role' => 'admin'
        ]);
    }

    // Seed default 6 sedes if none exists
    $stmt = $db->query("SELECT COUNT(*) as count FROM sedes");
    $sedeCount = $stmt->fetch()['count'];
    if ($sedeCount == 0) {
        $defaultSedes = [
            [
                'name' => 'Sede Principal (Centro)',
                'slug' => 'sede-principal',
                'description' => 'Recepción y salas de espera centrales',
                'address' => 'Av. Principal # 100 - Torre A',
                'color' => '#2563eb', // Blue
                'icon' => 'Building2',
                'order_num' => 1
            ],
            [
                'name' => 'Sede Norte',
                'slug' => 'sede-norte',
                'description' => 'Área de atención al público y pasillos',
                'address' => 'Calle 140 # 15 - 30',
                'color' => '#059669', // Emerald
                'icon' => 'Compass',
                'order_num' => 2
            ],
            [
                'name' => 'Sede Sur',
                'slug' => 'sede-sur',
                'description' => 'Pantallas de información general',
                'address' => 'Carrera 10 # 35 Sur',
                'color' => '#d97706', // Amber
                'icon' => 'Landmark',
                'order_num' => 3
            ],
            [
                'name' => 'Sede Occidente',
                'slug' => 'sede-occidente',
                'description' => 'Módulo de atención y sala de conferencias',
                'address' => 'Avenida El Dorado # 68 - 90',
                'color' => '#7c3aed', // Purple
                'icon' => 'Store',
                'order_num' => 4
            ],
            [
                'name' => 'Sede Oriente',
                'slug' => 'sede-oriente',
                'description' => 'Visor de novedades y cartelera digital',
                'address' => 'Calle 53 # 13 - 45',
                'color' => '#db2777', // Pink
                'icon' => 'Radio',
                'order_num' => 5
            ],
            [
                'name' => 'Sede VIP / Corporativa',
                'slug' => 'sede-vip',
                'description' => 'Lounge ejecutivo y salas directivas',
                'address' => 'Carrera 7 # 116 - 50 Piso 12',
                'color' => '#0891b2', // Cyan
                'icon' => 'Crown',
                'order_num' => 6
            ]
        ];

        $insertSede = $db->prepare("
            INSERT INTO sedes (name, slug, description, address, color, icon, order_num, is_active)
            VALUES (:name, :slug, :description, :address, :color, :icon, :order_num, 1)
        ");

        foreach ($defaultSedes as $sede) {
            $insertSede->execute([
                ':name' => $sede['name'],
                ':slug' => $sede['slug'],
                ':description' => $sede['description'],
                ':address' => $sede['address'],
                ':color' => $sede['color'],
                ':icon' => $sede['icon'],
                ':order_num' => $sede['order_num']
            ]);
        }
    }

    // Seed default settings
    $stmt = $db->query("SELECT COUNT(*) as count FROM settings");
    $settingsCount = $stmt->fetch()['count'];
    if ($settingsCount == 0) {
        $defaultSettings = [
            ['app_name', 'Visor TV Sistemas'],
            ['default_image_duration', '10'],
            ['tv_show_clock', '1'],
            ['tv_show_sede_title', '1'],
            ['tv_show_progress_bar', '1'],
            ['tv_auto_refresh_seconds', '30'],
            ['tv_transition_effect', 'fade']
        ];
        $insertSetting = $db->prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)");
        foreach ($defaultSettings as $setting) {
            $insertSetting->execute($setting);
        }
    }
}
