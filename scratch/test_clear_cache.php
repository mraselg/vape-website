<?php
$_SERVER['REQUEST_METHOD'] = 'POST';
$_SERVER['HTTP_X_CSRF'] = 'test-token';
$_GET['action'] = 'clear_cache';

session_name('VCDADMIN');
@session_start();
$_SESSION['admin_ok'] = true;
$_SESSION['admin_exp'] = time() + 3600;
$_SESSION['admin_user'] = 'admin';
$_SESSION['admin_role'] = 'admin';
$_SESSION['csrf'] = 'test-token';

ob_start();
require __DIR__ . '/../admin/api.php';
$out = ob_get_clean();
echo "Clear cache response: " . $out . "\n";
