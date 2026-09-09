import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('104.207.64.113', port=22022, username='root', password='R@sel88990', timeout=15)

commands = [
    "ls -la /var/cpanel/ssl/ /etc/apache2/conf.d/ssl.crt/ 2>/dev/null || true",
    "cat /etc/apache2/conf.d/includes/post_virtualhost_global.conf 2>/dev/null || true",
    "cat /etc/apache2/conf.d/includes/cloudflare.conf 2>/dev/null || true"
]

for cmd in commands:
    print(f"=== {cmd} ===")
    stdin, stdout, stderr = client.exec_command(cmd)
    print(stdout.read().decode())

client.close()
