import asyncio
from playwright.async_api import async_playwright

async def inspect_mobile():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        # Mobile viewport 390x844
        context = await browser.new_context(
            viewport={'width': 390, 'height': 844},
            user_agent='Mozilla/5.0 (Linux; Android 13; SM-G981B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36'
        )
        page = await context.new_page()
        
        # Navigate to home first to set localStorage
        await page.goto('http://localhost:8010/', wait_until='domcontentloaded')
        await page.evaluate('''() => {
            localStorage.setItem('vape_age_verified', 'true');
            localStorage.setItem('vcd_age_verified', 'true');
        }''')
        
        url = 'http://localhost:8010/product.php?slug=iluma-prime-remix'
        print(f"Loading {url}...")
        await page.goto(url, wait_until='load', timeout=10000)
        await page.wait_for_timeout(1000)

        print(f"Current URL: {page.url}")
        await page.screenshot(path='scratch/mobile_pdp_actual.png', full_page=False)
        print("Saved scratch/mobile_pdp_actual.png")

        doc_info = await page.evaluate('''() => {
            const winW = window.innerWidth;
            const docW = document.documentElement.scrollWidth;
            const bodyW = document.body.scrollWidth;
            
            // Find what elements exceed winW
            const overflowing = [];
            const allElements = document.querySelectorAll('*');
            for (const el of allElements) {
                const rect = el.getBoundingClientRect();
                if (rect.right > winW + 1) {
                    overflowing.push({
                        tag: el.tagName,
                        id: el.id || '',
                        className: (typeof el.className === 'string') ? el.className : '',
                        width: Math.round(rect.width),
                        right: Math.round(rect.right),
                        scrollWidth: el.scrollWidth
                    });
                }
            }
            return { winW, docW, bodyW, overflowingCount: overflowing.length, overflowing };
        }''')
        
        print(f"Viewport width: {doc_info['winW']}, Doc scrollWidth: {doc_info['docW']}, Body scrollWidth: {doc_info['bodyW']}")
        print(f"Overflowing elements count: {doc_info['overflowingCount']}")
        for item in doc_info['overflowing'][:25]:
            print(f" - [{item['tag']} #{item['id']} .{item['className']}] w={item['width']}, r={item['right']}, scrollW={item['scrollWidth']}")

        await browser.close()

if __name__ == '__main__':
    asyncio.run(inspect_mobile())
