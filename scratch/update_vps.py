import os
import tarfile
import paramiko
import time
import urllib.request

local_dir = r"c:\xampp\htdocs\Vape Website"
archive_path = os.path.join(local_dir, "scratch", "vape_website_update.tar.gz")

print("Packaging updated website files...")
with tarfile.open(archive_path, "w:gz") as tar:
    for root, dirs, files in os.walk(local_dir):
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
print(f"Archive created: {archive_path} ({size_mb:.2f} MB)")

host = "104.207.64.113"
port = 22022
user = "root"
password = "R@sel88990"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    print(f"Connecting to VPS {host}:{port}...")
    client.connect(host, port=port, username=user, password=password, timeout=20)
    print("Connected to VPS.")

    sftp = client.open_sftp()
    print("Uploading archive to VPS...")
    sftp.put(archive_path, "/var/www/vape-website/update.tar.gz")
    sftp.close()

    print("Extracting update on VPS...")
    cmd = "cd /var/www/vape-website && tar -xzf update.tar.gz && rm -f update.tar.gz && chmod -R 755 /var/www/vape-website && systemctl restart vape-website"
    stdin, stdout, stderr = client.exec_command(cmd)
    stdout.read()
    print("VPS updated and vape-website service restarted.")

    # Check status
    stdin, stdout, stderr = client.exec_command("systemctl is-active vape-website")
    status = stdout.read().decode().strip()
    print(f"Service status: {status}")

finally:
    client.close()

print("\nTesting VPS public endpoint http://104.207.64.113:8010/ ...")
time.sleep(2)
try:
    req = urllib.request.urlopen("http://104.207.64.113:8010/", timeout=8)
    print(f"VPS HTTP Response: {req.status}")
except Exception as e:
    print("Error:", e)
