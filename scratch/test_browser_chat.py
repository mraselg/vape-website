import asyncio
import json
import urllib.request
from playwright.async_api import async_playwright

async def test_browser_chat():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={'width': 1280, 'height': 850})
        page = await context.new_page()

        # Pre-set age verification so modal does not block
        await page.add_init_script("localStorage.setItem('vcd_age_verified', '1');")

        await page.goto('http://localhost:8010/', wait_until='load')
        await page.wait_for_timeout(800)

        # Ensure age modal is closed
        age_btn = await page.query_selector('#btnAgeYes, #ageYes')
        if age_btn and await age_btn.is_visible():
            await age_btn.click()
            await page.wait_for_timeout(400)

        # Click floating WhatsApp button
        wa_fab = await page.query_selector('.bnav-fab-wa, .js-open-wa-chat')
        if wa_fab:
            await wa_fab.click()
            await page.wait_for_timeout(800)

        # Fill phone form if present
        phone_inp = await page.query_selector('#waPhoneInput')
        if phone_inp and await phone_inp.is_visible():
            await phone_inp.fill('501234567')
            await page.wait_for_timeout(500)
            await page.click('#waBtnStartChat')
            await page.wait_for_timeout(800)

        # Get session ID from localStorage
        sid = await page.evaluate("() => localStorage.getItem('vcd_chat_sid')")
        print("Browser Chat Session ID:", sid)

        # Send a message from the browser
        inp = await page.query_selector('#waInputMessage')
        if inp:
            await inp.fill('Hello! Do you deliver to Business Bay in 1 hour?')
            await page.click('#waBtnSend')
            await page.wait_for_timeout(1000)

        # Now simulate Admin replying from Telegram via webhook
        short_code = sid.replace('CHAT-', '')
        webhook_payload = json.dumps({
            'update_id': 999991,
            'message': {
                'message_id': 555,
                'from': {'id': 1827362508, 'first_name': 'Rasel'},
                'chat': {'id': 1827362508, 'type': 'private'},
                'date': 1789151500,
                'text': f'/reply {short_code} Yes sir! 1-hour express delivery is available in Business Bay.'
            }
        }).encode('utf-8')

        req = urllib.request.Request(
            'http://localhost:8010/api/tg-webhook.php',
            data=webhook_payload,
            headers={'Content-Type': 'application/json'}
        )
        with urllib.request.urlopen(req) as resp:
            print("Webhook injection response:", resp.read().decode())

        # Wait for the browser to poll and display the agent reply
        await page.wait_for_timeout(3500)

        # Take screenshot of the chat modal
        await page.screenshot(path='scratch/chat_2way_verified.png', full_page=False)
        print("Captured scratch/chat_2way_verified.png")

        # Check if "Telegram" appears anywhere in the chat modal
        modal_text = await page.inner_text('#waChatModal')
        has_telegram = 'telegram' in modal_text.lower()
        print("Does chat modal contain the word 'Telegram'?", has_telegram)
        print("Modal text sample:\n", modal_text[:300])

        await browser.close()

if __name__ == '__main__':
    asyncio.run(test_browser_chat())
