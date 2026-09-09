# Vape Website — Agent Instructions & Live Deployment Policy

## Live Deployment Protocol
Whenever the user asks to push or make code live ("লাইভ করো", "পুশ করো", "আপডেট দাও", etc.):
1. **GitHub Sync**: Push all workspace changes to GitHub remote `origin/main` (`https://github.com/mraselg/vape-website`).
2. **VPS Deploy**: Package and deploy to VPS (`104.207.64.113:22022`, `/var/www/vape-website`), restart `vape-website.service` (`php -S 0.0.0.0:8010 router.php`), and verify Apache reverse proxy for `iqosai.com`.
3. **Links Protocol**: Always present the following links clearly in the response:
   - **Production Domain**: `https://iqosai.com/` (Admin: `https://iqosai.com/admin/`)
   - **VPS Direct**: `http://104.207.64.113:8010/`
   - **GitHub**: `https://github.com/mraselg/vape-website`
   - **Local PC**: `http://localhost:8010/`
   - **Wi-Fi Mobile**: `http://192.168.0.100:8010/`
   - **Assigned Port**: `8010`
