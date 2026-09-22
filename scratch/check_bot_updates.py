import urllib.request
import json

token = '8772277899:AAEbGGNrRLW57qqOuDi6VXT9YVPbYDwZqaM'
url = f'https://api.telegram.org/bot{token}/getUpdates'
try:
    resp = urllib.request.urlopen(url)
    data = json.loads(resp.read().decode())
    results = data.get('result', [])
    print(f"Total updates received: {len(results)}")
    for r in results:
        msg = r.get('message') or r.get('channel_post') or {}
        chat = msg.get('chat', {})
        frm = msg.get('from', {})
        print(f"Found Chat ID: {chat.get('id')} | Type: {chat.get('type')} | Title/Name: {chat.get('title') or frm.get('first_name')} | Text: {msg.get('text')}")
except Exception as e:
    print("Error querying getUpdates:", e)
