import paramiko

host = "104.207.64.113"
port = 22022
user = "root"
password = "R@sel88990"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    print(f"Connecting to {host}:{port} as {user}...")
    client.connect(host, port=port, username=user, password=password, timeout=15)
    print("SSH Connection successful!")
    
    commands = [
        "netstat -tuln | grep LISTEN",
        "which php",
        "which python3",
        "which docker",
        "which nginx",
        "which httpd",
        "ufw status || iptables -L -n | head -n 20"
    ]
    for cmd in commands:
        stdin, stdout, stderr = client.exec_command(cmd)
        out = stdout.read().decode('utf-8', errors='ignore').strip()
        err = stderr.read().decode('utf-8', errors='ignore').strip()
        print(f"=== {cmd} ===")
        if out:
            print(out)
        if err:
            print("ERR:", err)
finally:
    client.close()
