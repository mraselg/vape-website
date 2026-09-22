import asyncio
from playwright.async_api import async_playwright

async def capture_buy():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            viewport={'width': 390, 'height': 844},
            user_agent='Mozilla/5.0 (Linux; Android 13; SM-G981B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36',
            device_scale_factor=2
        )
        page = await context.new_page()
        
        await page.goto('http://localhost:8010/', wait_until='domcontentloaded')
        await page.evaluate('''() => {
            localStorage.setItem('vape_age_verified', 'true');
            localStorage.setItem('vcd_age_verified', 'true');
        }''')
        
        url = 'http://localhost:8010/product.php?slug=iluma-prime-remix'
        await page.goto(url, wait_until='load')
        await page.wait_for_timeout(600)

        # Scroll to pd-single-action-box
        await page.evaluate('document.querySelector(".pd-single-action-box").scrollIntoView({block: "center"})')
        await page.wait_for_timeout(400)
        await page.screenshot(path='scratch/mobile_pdp_fixed_buy.png', full_page=False)
        print("Captured scratch/mobile_pdp_fixed_buy.png")

        await browser.close()

if __name__ == '__main__':
    asyncio.run(capture_buy())
