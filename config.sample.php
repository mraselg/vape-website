<?php
/**
 * Vape Club Dubai — Database & Environment Configuration Sample
 *
 * NOTE: The website works out-of-the-box using the ultra-fast JSON database
 * in /data/ without requiring any MySQL database setup.
 *
 * If you want to connect to MySQL / MariaDB on cPanel or OpenShift,
 * rename this file to "config.php" and enter your database credentials below:
 */

// Database Connection Settings (Optional)
define('DB_HOST', 'localhost');
define('DB_NAME', 'vapeclub_db');
define('DB_USER', 'vapeclub_user');
define('DB_PASS', 'your_password_here');
define('DB_PORT', 3306);
define('DB_CHARSET', 'utf8mb4');

// Production Base URL
define('SITE_DOMAIN', 'https://iqosae.com');
