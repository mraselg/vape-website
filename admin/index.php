<?php
/**
 * Admin panel shell — login screen or SPA, depending on session.
 */
declare(strict_types=1);

require_once __DIR__ . '/../lib/bootstrap.php';

session_name('VCDADMIN');
session_set_cookie_params(['httponly' => true, 'samesite' => 'Lax', 'path' => '/']);
session_start();

$authed = !empty($_SESSION['admin_ok']) && ($_SESSION['admin_exp'] ?? 0) > time();
if ($authed) {
    if (empty($_SESSION['csrf'])) {
        $_SESSION['csrf'] = bin2hex(random_bytes(16));
    }
}
?><!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
<meta charset="UTF-8">
<base href="/admin/">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="robots" content="noindex, nofollow">
<title>Admin — Vape Club Dubai</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/admin/assets/admin.css?v=2.0">
</head>
<body class="adm-body">

<?php if (!$authed): ?>
<!-- ============ LOGIN ============ -->
<div class="adm-login-wrap">
  <form class="adm-login-card" id="loginForm" autocomplete="off">
    <div class="adm-login-logo">⚡</div>
    <h1>Vape Club <span>Admin</span></h1>
    <p class="adm-login-sub">Site management &amp; Staff control center</p>
    <label>Username or Phone Number
      <input type="text" id="loginUser" required placeholder="admin or +971 50 123 4567">
    </label>
    <label>Password
      <input type="password" id="loginPass" required placeholder="••••••••">
    </label>
    <div class="adm-login-err" id="loginErr"></div>
    <button type="submit" class="adm-btn adm-btn-primary adm-btn-block" id="loginBtn">Sign In</button>
    <p class="adm-login-hint">Default Admin: <b>admin</b> / <b>admin123</b> (or Phone: <b>+971 50 123 4567</b>)</p>
  </form>
</div>
<?php else: ?>
<!-- ============ ADMIN SPA ============ -->
<div class="adm-backdrop" id="admBackdrop"></div>
<div class="adm-shell">
  <aside class="adm-side" id="admSide">
    <div class="adm-brand">
      <span class="adm-brand-zap">⚡</span>
      <div><b>VAPE CLUB</b><small>Admin Panel</small></div>
      <button class="adm-side-close" id="admSideClose" aria-label="Close menu">✕</button>
    </div>

    <div class="adm-user-profile-badge">
      <div class="adm-user-avatar">👤</div>
      <div class="adm-user-info">
        <div class="adm-user-name"><?= htmlspecialchars($_SESSION['admin_name'] ?? 'Admin') ?></div>
        <div class="adm-user-role-tag adm-role-<?= htmlspecialchars($_SESSION['admin_role'] ?? 'admin') ?>"><?= strtoupper(htmlspecialchars($_SESSION['admin_role'] ?? 'admin')) ?></div>
      </div>
    </div>

    <nav class="adm-nav" id="admNav">
      <button class="adm-nav-btn is-active" data-view="dashboard"><span>📊</span> Dashboard</button>
      <button class="adm-nav-btn" data-view="products"><span>📦</span> Products</button>
      <button class="adm-nav-btn" data-view="categories"><span>🗂️</span> Categories</button>
      <button class="adm-nav-btn" data-view="homepage"><span>🏠</span> Homepage Customizer</button>
      <button class="adm-nav-btn" data-view="seo"><span>🔍</span> SEO &amp; Schema</button>
      <button class="adm-nav-btn" data-view="orders"><span>🧾</span> Orders <em class="adm-nav-badge" id="ordersBadge" style="display:none"></em></button>
      <button class="adm-nav-btn" data-view="leads"><span>💬</span> WhatsApp Leads <em class="adm-nav-badge" id="leadsBadge" style="display:none"></em></button>
      <button class="adm-nav-btn" data-view="team" id="navTeamBtn"><span>👥</span> Staff &amp; Roles</button>
      <button class="adm-nav-btn" data-view="settings"><span>⚙️</span> Branding &amp; Settings</button>
      <button class="adm-nav-btn" data-view="account"><span>🔐</span> Account &amp; Backup</button>
    </nav>
    <div class="adm-side-foot">
      <a href="../" target="_blank" rel="noopener" class="adm-view-site">↗ View Live Site</a>
      <button class="adm-logout" id="logoutBtn">⏻ Logout</button>
    </div>
  </aside>
  <main class="adm-main">
    <header class="adm-topbar">
      <div class="adm-topbar-left">
        <button class="adm-menu-toggle" id="admMenuBtn" aria-label="Toggle menu">☰</button>
        <h2 id="admViewTitle">Dashboard</h2>
      </div>
      <div class="adm-topbar-actions">
        <span class="adm-save-state" id="saveState"></span>
        <button class="adm-btn adm-btn-primary" id="saveBtn" style="display:none">💾 Save Changes</button>
      </div>
    </header>
    <div id="admContent" class="adm-content"></div>
  </main>
</div>
<div class="adm-toast-stack" id="admToasts"></div>
<script>
  window.ADM_CSRF = <?= json_encode($_SESSION['csrf'] ?? '') ?>;
  window.ADM_USER = <?= json_encode($_SESSION['admin_user'] ?? 'admin') ?>;
  window.ADM_NAME = <?= json_encode($_SESSION['admin_name'] ?? 'Admin') ?>;
  window.ADM_ROLE = <?= json_encode($_SESSION['admin_role'] ?? 'admin') ?>;
  window.ADM_PHONE = <?= json_encode($_SESSION['admin_phone'] ?? '') ?>;
</script>
<script src="/admin/assets/admin.js?v=2.2"></script>
<?php endif; ?>

<script>
/* Login (screen shown only when logged out) */
(function () {
  const f = document.getElementById('loginForm');
  if (!f) return;
  f.addEventListener('submit', async (e) => {
    e.preventDefault();
    const err = document.getElementById('loginErr');
    const btn = document.getElementById('loginBtn');
    err.textContent = '';
    btn.disabled = true;
    btn.textContent = 'Signing in…';
    try {
      const r = await fetch('/admin/api.php?action=login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: document.getElementById('loginUser').value.trim(), password: document.getElementById('loginPass').value })
      });
      const d = await r.json();
      if (d.ok) {
        if (d.must_change) sessionStorage.setItem('adm_must_change', '1');
        location.reload();
      } else {
        err.textContent = d.error === 'too_many_attempts' ? 'Too many attempts — wait a moment.' : 'Invalid username or password.';
        btn.disabled = false;
        btn.textContent = 'Sign In';
      }
    } catch (ex) {
      err.textContent = 'Network error — try again.';
      btn.disabled = false;
      btn.textContent = 'Sign In';
    }
  });
})();
</script>
</body>
</html>
