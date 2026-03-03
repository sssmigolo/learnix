import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        # We'll use the Render URL since we can't easily run a local server here
        url = "https://learnix-v2-final.onrender.com"
        print(f"Navigating to {url}...")

        try:
            await page.goto(url, wait_until="networkidle", timeout=60000)

            # Wait for splash screen to disappear (it has a 3.3s timeout in code)
            print("Waiting for splash screen to disappear...")
            await asyncio.sleep(5)

            # Take a screenshot to verify
            await page.screenshot(path="screenshot.png")
            print("Screenshot saved to screenshot.png")

            # Check for login form elements
            content = await page.content()
            if "Welcome to Learnix" in content or "Login" in content:
                print("Verification SUCCESS: Login screen is visible.")
            else:
                print("Verification FAILURE: Expected content not found.")
                print(f"Page Title: {await page.title()}")

        except Exception as e:
            print(f"Error during verification: {e}")
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
