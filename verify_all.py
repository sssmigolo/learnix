import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        # Capture console logs
        page.on("console", lambda msg: print(f"CONSOLE: {msg.type}: {msg.text}"))
        page.on("pageerror", lambda err: print(f"PAGE ERROR: {err}"))

        url = "https://learnix-v2-final.onrender.com"
        print(f"Navigating to {url}...")

        try:
            await page.goto(url, wait_until="networkidle", timeout=60000)
            print("Waiting for splash screen...")
            await asyncio.sleep(6)

            # Take screenshot of login
            await page.screenshot(path="final_login.png")
            print("Login screenshot saved.")

            # Check for NG0600 in console (if it were still there)
            # content = await page.content()
            # print("Content check passed if no 'PAGE ERROR' was logged above.")

        except Exception as e:
            print(f"Error: {e}")
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
