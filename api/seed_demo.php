<?php
/**
 * Demo Media Generator for Visor TV
 */
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.php';

$db = get_db();

// Function to generate a stylish SVG image banner
function generate_sample_image($title, $subtitle, $bgColor, $badge, $filename) {
    $filepath = MEDIA_UPLOAD_DIR . DIRECTORY_SEPARATOR . $filename;
    if (file_exists($filepath)) return $filename;

    $svg = <<<SVG
<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#090d16" />
      <stop offset="50%" stop-color="#111827" />
      <stop offset="100%" stop-color="{$bgColor}" stop-opacity="0.8" />
    </linearGradient>
    <radialGradient id="glow" cx="80%" cy="20%" r="50%">
      <stop offset="0%" stop-color="{$bgColor}" stop-opacity="0.4" />
      <stop offset="100%" stop-color="#000000" stop-opacity="0" />
    </radialGradient>
  </defs>

  <!-- Background -->
  <rect width="1920" height="1080" fill="url(#bgGrad)" />
  <rect width="1920" height="1080" fill="url(#glow)" />

  <!-- Grid overlay -->
  <g stroke="rgba(255,255,255,0.03)" stroke-width="1">
    <line x1="0" y1="270" x2="1920" y2="270" />
    <line x1="0" y1="540" x2="1920" y2="540" />
    <line x1="0" y1="810" x2="1920" y2="810" />
    <line x1="480" y1="0" x2="480" y2="1080" />
    <line x1="960" y1="0" x2="960" y2="1080" />
    <line x1="1440" y1="0" x2="1440" y2="1080" />
  </g>

  <!-- Badge -->
  <rect x="140" y="240" width="300" height="56" rx="28" fill="{$bgColor}" fill-opacity="0.2" stroke="{$bgColor}" stroke-width="2" />
  <text x="290" y="275" fill="#ffffff" font-family="system-ui, sans-serif" font-size="20" font-weight="bold" text-anchor="middle" letter-spacing="3">{$badge}</text>

  <!-- Title -->
  <text x="140" y="420" fill="#ffffff" font-family="system-ui, sans-serif" font-size="72" font-weight="900">{$title}</text>

  <!-- Subtitle -->
  <text x="140" y="510" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="32" font-weight="400">{$subtitle}</text>

  <!-- Decorative Footer Bar -->
  <rect x="140" y="880" width="1640" height="80" rx="20" fill="rgba(15, 23, 42, 0.7)" stroke="rgba(255,255,255,0.1)" stroke-width="1" />
  <text x="190" y="930" fill="#38bdf8" font-family="system-ui, sans-serif" font-size="22" font-weight="bold">● VISOR DIGITAL INFORMATIVO</text>
  <text x="1730" y="930" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="20" font-weight="500" text-anchor="end">Información Institucional 2026</text>
</svg>
SVG;

    file_put_contents($filepath, $svg);
    return $filename;
}

// Check if any media exists
$stmt = $db->query("SELECT COUNT(*) as count FROM media_items");
if ($stmt->fetch()['count'] == 0) {
    $demoItems = [
        // Sede 1 - Principal
        [
            'sede_id' => 1,
            'title' => 'Bienvenida Sede Principal',
            'subtitle' => 'Horario de atención: Lunes a Viernes de 8:00 AM a 6:00 PM',
            'badge' => 'BIENVENIDOS',
            'color' => '#2563eb',
            'filename' => 'demo_sede1_banner1.svg',
            'duration' => 8
        ],
        [
            'sede_id' => 1,
            'title' => 'Nuevos Servicios Disponibles',
            'subtitle' => 'Consulte con nuestros asesores en los módulos centrales de atención.',
            'badge' => 'NOVEDADES',
            'color' => '#3b82f6',
            'filename' => 'demo_sede1_banner2.svg',
            'duration' => 10
        ],
        // Sede 2 - Norte
        [
            'sede_id' => 2,
            'title' => 'Sede Norte - Atención Integral',
            'subtitle' => 'Turnos digitales y asesoría personalizada en el segundo piso.',
            'badge' => 'SEDE NORTE',
            'color' => '#059669',
            'filename' => 'demo_sede2_banner1.svg',
            'duration' => 8
        ],
        // Sede 3 - Sur
        [
            'sede_id' => 3,
            'title' => 'Sede Sur - Información General',
            'subtitle' => 'Mantenga sus documentos listos para una atención más ágil.',
            'badge' => 'SEDE SUR',
            'color' => '#d97706',
            'filename' => 'demo_sede3_banner1.svg',
            'duration' => 9
        ],
        // Sede 4 - Occidente
        [
            'sede_id' => 4,
            'title' => 'Sede Occidente - Innovación & Servicio',
            'subtitle' => 'Conéctese a nuestra red WiFi institucional gratuita para visitantes.',
            'badge' => 'OCCIDENTE',
            'color' => '#7c3aed',
            'filename' => 'demo_sede4_banner1.svg',
            'duration' => 8
        ],
        // Sede 5 - Oriente
        [
            'sede_id' => 5,
            'title' => 'Sede Oriente - Cartelera Digital',
            'subtitle' => 'Próximos eventos y capacitaciones del mes.',
            'badge' => 'ORIENTE',
            'color' => '#db2777',
            'filename' => 'demo_sede5_banner1.svg',
            'duration' => 10
        ],
        // Sede 6 - VIP
        [
            'sede_id' => 6,
            'title' => 'Sede VIP - Lounge Corporativo',
            'subtitle' => 'Salas ejecutivas y atención preferencial para cuentas empresariales.',
            'badge' => 'VIP LOUNGE',
            'color' => '#0891b2',
            'filename' => 'demo_sede6_banner1.svg',
            'duration' => 12
        ]
    ];

    $insert = $db->prepare("
        INSERT INTO media_items (sede_id, title, type, filename, original_name, mime_type, file_size, duration, fit_mode, order_num, is_active)
        VALUES (:sede_id, :title, 'image', :filename, :original_name, 'image/svg+xml', :file_size, :duration, 'contain', :order_num, 1)
    ");

    foreach ($demoItems as $idx => $item) {
        $filename = generate_sample_image($item['title'], $item['subtitle'], $item['color'], $item['badge'], $item['filename']);
        $filePath = MEDIA_UPLOAD_DIR . DIRECTORY_SEPARATOR . $filename;
        $size = file_exists($filePath) ? filesize($filePath) : 1024;

        $insert->execute([
            ':sede_id' => $item['sede_id'],
            ':title' => $item['title'],
            ':filename' => $filename,
            ':original_name' => $filename,
            ':file_size' => $size,
            ':duration' => $item['duration'],
            ':order_num' => $idx + 1
        ]);
    }

    echo "Demo media successfully created for 6 sedes!\n";
} else {
    echo "Media items already exist.\n";
}
