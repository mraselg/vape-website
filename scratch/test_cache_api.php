<?php
require_once __DIR__ . '/../lib/bootstrap.php';

session_name('VCDADMIN');
@session_start();
$_SESSION['admin_ok'] = true;
$_SESSION['admin_exp'] = time() + 3600;
$_SESSION['admin_user'] = 'admin';
$_SESSION['admin_role'] = 'admin';
$_SESSION['csrf'] = 'test-token';

$_SERVER['REQUEST_METHOD'] = 'POST';
$_SERVER['HTTP_X_CSRF'] = 'test-token';
$_GET['action'] = 'get_cache_info';

// Test 1: get_cache_info
echo "=== TEST 1: get_cache_info ===\n";
ob_start();
require __DIR__ . '/../admin/api.php';
$out1 = ob_get_clean();
echo "Response: " . $out1 . "\n";

