<?php
$h = '$2y$10$dxLpPbsGZxYZqACPQY4JJuZZU7XItfwTNKp85ZWAVZP5uZWMARFHO';
$candidates = ['admin123', 'admin', 'password', 'password123', 'Password123!', 'R@sel88990', 'vape123', 'vapeclub', 'dubai123', 'iqos123', 'admin2024', 'admin2025', 'admin2026', 'secret'];
foreach ($candidates as $c) {
    if (password_verify($c, $h)) {
        echo "MATCH: $c\n";
        exit;
    }
}
echo "No match found\n";
