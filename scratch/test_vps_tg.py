import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('104.207.64.113', port=22022, username='root', password='R@sel88990', timeout=15)

cmd = """/usr/local/bin/php -r "require '/var/www/vape-website/lib/bootstrap.php'; print_r(vcd_telegram_send('<b>Hello VPS Test</b>'));" """
stdin, stdout, stderr = client.exec_command(cmd)
print("STDOUT:", stdout.read().decode())
print("STDERR:", stderr.read().decode())

# Check settings.json on VPS
cmd2 = "cat /var/www/vape-website/data/settings.json | grep telegram"
stdin, stdout, stderr = client.exec_command(cmd2)
print("VPS Settings Telegram lines:\n", stdout.read().decode())

client.close()
