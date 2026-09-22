import urllib.request, json, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

url = "https://iqosai.com/"
req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})

try:
    with urllib.request.urlopen(req, timeout=12) as resp:
        html = resp.read().decode('utf-8', errors='replace')
        status = resp.status
        print(f"Production Status: HTTP {status}")
        
        idx = html.find('flash-strip')
        if idx != -1:
            snippet = html[idx:idx+350]
            print("\n=== Live Production Flash Strip ===")
            print(snippet)
            
            if "FLASH DEAL" in snippet and "Free TEREA pack" in snippet:
                print("\n>>> AUDIT PASSED: Full Flash Deal Text is 100% visible on production domain! <<<")
            else:
                print("\n>>> AUDIT WARNING: Text might still be corrupted or not yet updated! <<<")
        else:
            print("Flash strip not found on page.")
except Exception as e:
    print("Error fetching production:", e)
