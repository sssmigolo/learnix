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
            print("Waiting for splash screen to disappear...")
            await asyncio.sleep(6) # Give it plenty of time

            # Check if login is needed
            if await page.query_selector("input[name='username']"):
                print("Logging in as admin...")
                await page.fill("input[name='username']", "admin")
                await page.fill("input[name='password']", "admin")
                await page.click("button[type='submit']")
                print("Login clicked, waiting...")
                await asyncio.sleep(3)

            await page.screenshot(path="dashboard_verification.png")
            print("Screenshot saved to dashboard_verification.png")

            content = await page.content()
            if "Ready to learn?" in content:
                print("Verification SUCCESS: Dashboard is visible.")
            elif "Welcome to Learnix" in content:
                print("Verification FAILURE: Still on login screen.")
            else:
                print("Verification FAILURE: Unknown state.")
                print(f"Body text snippet: {content[:500]}")

        except Exception as e:
            print(f"Error during verification: {e}")
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
