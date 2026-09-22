import paramiko

host = "104.207.64.113"
port = 22022
user = "root"
password = "R@sel88990"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    print(f"Connecting to VPS {host}:{port}...")
    client.connect(host, port=port, username=user, password=password, timeout=15)
    print("Connected!")
    
    cmds = [
        "systemctl status vape-website --no-pager",
        "cat /etc/apache2/conf.d/includes/post_virtualhost_global.conf",
        "curl -s -o /dev/null -w 'Direct 8010 code: %{http_code}\\n' http://127.0.0.1:8010/",
        "httpd -v"
    ]
    for c in cmds:
        print(f"\n--- RUNNING: {c} ---")
        stdin, stdout, stderr = client.exec_command(c)
        out = stdout.read().decode('utf-8', errors='replace').strip()
        err = stderr.read().decode('utf-8', errors='replace').strip()
        if out:
            print("STDOUT:\n" + out)
        if err:
            print("STDERR:\n" + err)
finally:
    client.close()
