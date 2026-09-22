import asyncio
from playwright.async_api import async_playwright

async def debug_layout():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        # Test 360 width (standard Android) and 390 width
        for test_w in [360, 390, 412]:
            print(f"\n================ TESTING VIEWPORT WIDTH: {test_w} ================")
            context = await browser.new_context(
                viewport={'width': test_w, 'height': 800},
                user_agent='Mozilla/5.0 (Linux; Android 13; SM-G981B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36'
            )
            page = await context.new_page()
            
            await page.goto('http://localhost:8010/', wait_until='domcontentloaded')
            await page.evaluate('''() => {
                localStorage.setItem('vape_age_verified', 'true');
                localStorage.setItem('vcd_age_verified', 'true');
            }''')
            
            url = 'http://localhost:8010/product.php?slug=iluma-prime-remix'
            await page.goto(url, wait_until='load')
            await page.wait_for_timeout(500)

            res = await page.evaluate('''() => {
                const winW = window.innerWidth;
                const htmlW = document.documentElement.offsetWidth;
                const htmlScrollW = document.documentElement.scrollWidth;
                const bodyW = document.body.offsetWidth;
                const bodyScrollW = document.body.scrollWidth;
                
                const getInfo = (sel) => {
                    const el = document.querySelector(sel);
                    if (!el) return null;
                    const r = el.getBoundingClientRect();
                    const cs = window.getComputedStyle(el);
                    return {
                        sel,
                        width: r.width,
                        left: r.left,
                        right: r.right,
                        boxSizing: cs.boxSizing,
                        display: cs.display,
                        padding: `${cs.paddingLeft} ${cs.paddingRight}`,
                        margin: `${cs.marginLeft} ${cs.marginRight}`,
                        maxWidth: cs.maxWidth,
                        minWidth: cs.minWidth
                    };
                };

                // Find ANY element on the entire page whose getBoundingClientRect().right > winW
                const violators = [];
                document.querySelectorAll('*').forEach(el => {
                    const r = el.getBoundingClientRect();
                    if (r.right > winW + 0.5) {
                        violators.push({
                            tag: el.tagName,
                            id: el.id,
                            cls: el.className,
                            right: Math.round(r.right),
                            width: Math.round(r.width),
                            left: Math.round(r.left),
                            scrollWidth: el.scrollWidth,
                            clientWidth: el.clientWidth
                        });
                    }
                });

                return {
                    winW, htmlW, htmlScrollW, bodyW, bodyScrollW,
                    main: getInfo('main.pd-wrap'),
                    pdHero: getInfo('.pd-hero'),
                    pdMedia: getInfo('.pd-media'),
                    pdInfo: getInfo('.pd-info'),
                    tabsCard: getInfo('.pd-tabs-card'),
                    tabsNav: getInfo('.pd-tabs-nav'),
                    tabsPanels: getInfo('.pd-tab-panels'),
                    violators: violators.slice(0, 25)
                };
            }''')
            
            print(f"winW={res['winW']}, htmlScrollW={res['htmlScrollW']}, bodyScrollW={res['bodyScrollW']}")
            print("Main:", res['main'])
            print("pdHero:", res['pdHero'])
            print("pdMedia:", res['pdMedia'])
            print("pdInfo:", res['pdInfo'])
            print("tabsCard:", res['tabsCard'])
            print(f"Total Violators count: {len(res['violators'])}")
            for v in res['violators']:
                print(f"  -> [{v['tag']} #{v['id']} .{v['cls']}] l={v['left']} w={v['width']} r={v['right']} scrollW={v['scrollWidth']} clientW={v['clientWidth']}")

        await browser.close()

if __name__ == '__main__':
    asyncio.run(debug_layout())
