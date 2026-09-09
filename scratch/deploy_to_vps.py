import os
import tarfile
import paramiko
import time
import urllib.request

local_dir = r"c:\xampp\htdocs\Vape Website"
archive_path = os.path.join(local_dir, "scratch", "vape_website.tar.gz")

print("Packaging website files into tar.gz...")
with tarfile.open(archive_path, "w:gz") as tar:
    for root, dirs, files in os.walk(local_dir):
        # Skip scratch and git directories
        rel_root = os.path.relpath(root, local_dir)
        if rel_root == "scratch" or rel_root.startswith("scratch" + os.sep):
            continue
        if rel_root == ".git" or rel_root.startswith(".git" + os.sep):
            continue
        for f in files:
            full_path = os.path.join(root, f)
            arc_name = os.path.relpath(full_path, local_dir)
            tar.add(full_path, arcname=arc_name)

size_mb = os.path.getsize(archive_path) / (1024 * 1024)
print(f"Archive created successfully: {archive_path} ({size_mb:.2f} MB)")

host = "104.207.64.113"
port = 22022
user = "root"
password = "R@sel88990"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    print(f"Connecting to VPS {host}:{port}...")
    client.connect(host, port=port, username=user, password=password, timeout=20)
    print("Connected to VPS via SSH.")

    # Stop any previous process on 8010
    client.exec_command("fuser -k 8010/tcp || true")
    time.sleep(1)

    # Create destination directory
    stdin, stdout, stderr = client.exec_command("mkdir -p /var/www/vape-website")
    stdout.read()

    # Upload archive via SFTP
    print("Uploading archive via SFTP to /var/www/vape-website/vape_website.tar.gz...")
    sftp = client.open_sftp()
    sftp.put(archive_path, "/var/www/vape-website/vape_website.tar.gz")
    sftp.close()
    print("Upload complete.")

    # Extract archive on VPS
    print("Extracting files on VPS...")
    cmd_extract = "cd /var/www/vape-website && tar -xzf vape_website.tar.gz && rm -f vape_website.tar.gz && chmod -R 755 /var/www/vape-website"
    stdin, stdout, stderr = client.exec_command(cmd_extract)
    out = stdout.read().decode()
    err = stderr.read().decode()
    if err:
        print("Extract warnings/errors:", err)
    print("Extracted successfully.")

    # Create systemd service
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
    print("Setting up systemd service /etc/systemd/system/vape-website.service...")
    sftp = client.open_sftp()
    with sftp.file("/etc/systemd/system/vape-website.service", "w") as f:
        f.write(service_content)
    sftp.close()

    # Reload systemd and start service
    setup_cmds = [
        "systemctl daemon-reload",
        "systemctl enable vape-website",
        "systemctl restart vape-website",
        "sleep 2",
        "systemctl status vape-website --no-pager",
        "ss -tulpn | grep 8010"
    ]
    for c in setup_cmds:
        stdin, stdout, stderr = client.exec_command(c)
        out = stdout.read().decode().strip()
        print(f"=== {c} ===")
        if out:
            print(out.encode('ascii', errors='replace').decode('ascii'))

finally:
    client.close()

# Test public accessibility from local machine
print("\nTesting public endpoint http://104.207.64.113:8010/ ...")
time.sleep(2)
try:
    req = urllib.request.urlopen("http://104.207.64.113:8010/", timeout=8)
    print(f"SUCCESS! HTTP Status Code: {req.status}")
except Exception as e:
    print("Error reaching endpoint:", e)
