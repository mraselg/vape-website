import asyncio
from playwright.async_api import async_playwright

async def test_extra_small():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        for w in [320, 360, 375, 390, 412, 480, 768, 1024]:
            ctx = await browser.new_context(viewport={'width': w, 'height': 800})
            page = await ctx.new_page()
            await page.goto('http://localhost:8010/', wait_until='domcontentloaded')
            await page.evaluate('''() => {
                localStorage.setItem('vape_age_verified', 'true');
                localStorage.setItem('vcd_age_verified', 'true');
            }''')
            await page.goto('http://localhost:8010/product.php?slug=iluma-prime-remix', wait_until='load')
            
            overflow = await page.evaluate('''() => {
                return {
                    winW: window.innerWidth,
                    docScrollW: document.documentElement.scrollWidth,
                    bodyScrollW: document.body.scrollWidth,
                    hasHScroll: document.documentElement.scrollWidth > window.innerWidth
                };
            }''')
            doc_w = overflow['docScrollW']
            body_w = overflow['bodyScrollW']
            has_h = overflow['hasHScroll']
            print(f"Viewport {w}px -> docScrollW: {doc_w}, bodyScrollW: {body_w}, hasHorizontalScroll: {has_h}")
        await browser.close()

if __name__ == '__main__':
    asyncio.run(test_extra_small())
