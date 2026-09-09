# Vape Website — Live Synchronization & Deployment Workflow

Whenever the user instructs to "live", "push", "deploy", or go live with updates ("লাইভ করো", "পুশ করো", "আপডেট লাইভে দাও"):

## Mandatory Protocol:
1. **Push to GitHub**:
   - Ensure all modified files in `C:\xampp\htdocs\Vape Website` are committed.
   - Push to `main` branch on GitHub: `https://github.com/mraselg/vape-website.git`.

2. **Push to VPS**:
   - Run `python scratch/setup_vps_domain.py` (or execute SFTP upload of the tarball to `/var/www/vape-website`).
   - Ensure the systemd service `vape-website.service` runs `php -S 0.0.0.0:8010 router.php`.
   - Ensure Apache reverse proxy (`/etc/apache2/conf.d/includes/post_virtualhost_global.conf`) for domain `iqosai.com` forwards port 80 & 443 traffic to `127.0.0.1:8010`.
   - Restart the service: `systemctl restart vape-website`.

3. **Provide Complete Access Links in Response**:
   - **Production Custom Domain**: `https://iqosai.com/` (and `https://iqosai.com/admin/`)
   - **VPS Direct Port**: `http://104.207.64.113:8010/`
   - **GitHub Repository**: `https://github.com/mraselg/vape-website`
   - **Local PC**: `http://localhost:8010/`
   - **Wi-Fi Mobile (Current IP)**: `http://192.168.0.100:8010/`
   - **Dedicated Port**: `8010`
