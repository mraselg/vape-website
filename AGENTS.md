# Vape Website — Agent Instructions & Live Deployment Policy

## Live Deployment Protocol
Whenever the user asks to push or make code live ("লাইভ করো", "পুশ করো", "আপডেট দাও", etc.):
1. **GitHub Sync**: Push all workspace changes to GitHub remote `origin/main` (`https://github.com/mraselg/vape-website`).
2. **VPS Deploy**: Deployed to VPS (`104.207.93.68:22022`, `/var/www/users/karim/iqosai.com`), powered by high-performance Nginx + PHP 8.3 FPM listening on port `80`, `443`, and direct port `8010`.
3. **Links Protocol**: Always present the following links clearly in the response:
   - **Production Domain**: `https://iqosai.com/` (Admin: `https://iqosai.com/admin/`)
   - **VPS Direct**: `http://104.207.93.68:8010/`
   - **GitHub**: `https://github.com/mraselg/vape-website`
   - **Local PC**: `http://localhost:8010/`
   - **Wi-Fi Mobile**: `http://192.168.0.100:8010/`
   - **Assigned Port**: `8010`
