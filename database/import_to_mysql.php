<?php
/**
 * CLI / Web MySQL Importer for Vape Club Dubai
 * Imports database/database.sql into MySQL.
 */
declare(strict_types=1);

if (php_sapi_name() !== 'cli') {
    header('Content-Type: text/plain; charset=utf-8');
}

$configFile = __DIR__ . '/../config.php';
if (!file_exists($configFile)) {
    die("Error: config.php not found. Copy config.sample.php to config.php and set your MySQL database credentials.\n");
}

require_once $configFile;

if (!defined('DB_HOST') || !defined('DB_NAME') || !defined('DB_USER')) {
    die("Error: Database constants DB_HOST, DB_NAME, DB_USER must be defined in config.php.\n");
}

$sqlFile = __DIR__ . '/database.sql';
if (!file_exists($sqlFile)) {
    die("Error: database/database.sql not found.\n");
}

try {
    $dsn = "mysql:host=" . DB_HOST . ";port=" . (defined('DB_PORT') ? DB_PORT : 3306) . ";dbname=" . DB_NAME . ";charset=utf8mb4";
    $pdo = new PDO($dsn, DB_USER, defined('DB_PASS') ? DB_PASS : '', [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);

    echo "Connected to MySQL database [" . DB_NAME . "] on [" . DB_HOST . "] successfully.\n";
    echo "Importing database.sql...\n";

    $sql = file_get_contents($sqlFile);
    $pdo->exec($sql);

    echo "Success: Database imported completely! All tables and data are live.\n";
} catch (PDOException $e) {
    die("Database Error: " . $e->getMessage() . "\n");
}
