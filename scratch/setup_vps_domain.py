import os
import tarfile
import paramiko
import time
import sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

local_dir = r"c:\xampp\htdocs\Vape Website"
archive_path = os.path.join(local_dir, "scratch", "vape_website.tar.gz")

print("1. Packaging website files into tar.gz...")
with tarfile.open(archive_path, "w:gz") as tar:
    for root, dirs, files in os.walk(local_dir):
        rel_root = os.path.relpath(root, local_dir)
        if rel_root == "scratch" or rel_root.startswith("scratch" + os.sep):
            # Include backup-static if needed, but skip temp archives
            if not rel_root.startswith(os.path.join("scratch", "backup-static")):
                continue
        if rel_root == ".git" or rel_root.startswith(".git" + os.sep):
            continue
        for f in files:
            if f.endswith(".tar.gz") or f == "cookies.txt":
                continue
            full_path = os.path.join(root, f)
            arc_name = os.path.relpath(full_path, local_dir)
            tar.add(full_path, arcname=arc_name)

size_mb = os.path.getsize(archive_path) / (1024 * 1024)
print(f"Archive created: {size_mb:.2f} MB")

host = "104.207.64.113"
port = 22022
user = "root"
password = "R@sel88990"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    print(f"2. Connecting to VPS {host}:{port}...")
    client.connect(host, port=port, username=user, password=password, timeout=20)
    print("Connected to VPS.")

    # Upload archive via SFTP
    print("3. Uploading archive to /var/www/vape-website/vape_website.tar.gz...")
    sftp = client.open_sftp()
    sftp.put(archive_path, "/var/www/vape-website/vape_website.tar.gz")
    print("Upload complete.")

    # Extract archive on VPS
    print("4. Extracting archive on VPS...")
    cmd_extract = "cd /var/www/vape-website && tar -xzf vape_website.tar.gz && rm -f vape_website.tar.gz && chmod -R 755 /var/www/vape-website"
    stdin, stdout, stderr = client.exec_command(cmd_extract)
    out = stdout.read().decode()
    err = stderr.read().decode()
    if err:
        print("Extract stderr:", err)
    print("Extraction done.")

    # Update systemd service to use router.php
    print("5. Updating systemd service with router.php...")
    service_content = """[Unit]
Description=Vape Club Dubai Web Service
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/var/www/vape-website
ExecStart=/usr/local/bin/php -S 0.0.0.0:8010 router.php
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
"""
    with sftp.file("/etc/systemd/system/vape-website.service", "w") as f:
        f.write(service_content)

    # Configure Apache Reverse Proxy for iqosai.com
    print("6. Configuring Apache VirtualHost for iqosai.com...")
    apache_vhost = """# Apache Reverse Proxy for iqosai.com -> PHP Server on port 8010
<VirtualHost 104.207.64.113:80 127.0.0.1:80>
    ServerName iqosai.com
    ServerAlias www.iqosai.com
    ServerAdmin webmaster@iqosai.com

    ProxyPreserveHost On
    ProxyPass / http://127.0.0.1:8010/
    ProxyPassReverse / http://127.0.0.1:8010/

    RequestHeader set X-Forwarded-Proto "http"
    RequestHeader set X-Forwarded-Port "80"
</VirtualHost>

<VirtualHost 104.207.64.113:443 127.0.0.1:443>
    ServerName iqosai.com
    ServerAlias www.iqosai.com
    ServerAdmin webmaster@iqosai.com

    SSLEngine on
    SSLCertificateFile /etc/apache2/conf.d/ssl.crt/server.crt
    SSLCertificateKeyFile /etc/apache2/conf.d/ssl.key/server.key

    ProxyPreserveHost On
    ProxyPass / http://127.0.0.1:8010/
    ProxyPassReverse / http://127.0.0.1:8010/

    RequestHeader set X-Forwarded-Proto "https"
    RequestHeader set X-Forwarded-Port "443"
</VirtualHost>
"""
    with sftp.file("/etc/apache2/conf.d/includes/post_virtualhost_global.conf", "w") as f:
        f.write(apache_vhost)
    sftp.close()

    # Verify and reload services
    print("7. Reloading systemd and restarting vape-website service...")
    cmds = [
        "systemctl daemon-reload",
        "systemctl restart vape-website",
        "sleep 1",
        "systemctl status vape-website --no-pager",
        "httpd -t",
        "systemctl reload httpd",
        "curl -s -o /dev/null -w 'Direct port 8010 status: %{http_code}\\n' http://127.0.0.1:8010/",
        "curl -s -o /dev/null -w 'Proxy port 80 (iqosai.com) status: %{http_code}\\n' -H 'Host: iqosai.com' http://127.0.0.1/",
        "curl -s -k -o /dev/null -w 'Proxy port 443 (iqosai.com) status: %{http_code}\\n' -H 'Host: iqosai.com' https://127.0.0.1/"
    ]
    for c in cmds:
        print(f"=== {c} ===")
        stdin, stdout, stderr = client.exec_command(c)
        out = stdout.read().decode().strip()
        err = stderr.read().decode().strip()
        if out:
            print(out)
        if err and "Syntax OK" not in err:
            print("ERR:", err)

    print("\nVPS Deployment & Domain Configuration Complete!")

finally:
    client.close()
