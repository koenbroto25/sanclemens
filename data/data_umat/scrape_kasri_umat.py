import asyncio
import re
from playwright.async_api import Page, expect, async_playwright
import os

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False) # Keep headless=False for debugging
        page = await browser.new_page()

        print("Navigating to login page...")
        await page.goto("https://umat.kasri.id/auth", wait_until="load", timeout=60000)
        await page.screenshot(path="data umat/login_page_screenshot.png")
        print("Screenshot of login page saved to data umat/login_page_screenshot.png")

        # await page.wait_for_timeout(2000) # Added a small delay to allow elements to fully render
        await page.pause() # Uncomment this line to manually debug Playwright

        print("Logging in...")
        try:
            # Use page.locator and wait_for for more robust element interaction
            email_input = page.locator('input[name="email"]')
            await email_input.wait_for(state="editable", timeout=60000)
            await email_input.fill('yasinta.elvi@gmail.com')
            
            password_input = page.locator('input[name="password"]')
            await password_input.wait_for(state="editable", timeout=60000)
            await password_input.fill('yasintaelvi27')
            
            login_button = page.locator('button[type="submit"]')
            await login_button.wait_for(state="visible", timeout=60000)
            await login_button.click(force=True) # Use force=True for debugging

            # Wait for navigation after login (e.g., to dashboard or main page)
            await page.wait_for_url("https://umat.kasri.id/*", timeout=60000)
            await page.wait_for_load_state('domcontentloaded') # Ensure DOM is loaded
            print("Logged in successfully.")
            
        except Exception as e:
            print(f"Error during login process: {e}")
            await page.screenshot(path="data umat/login_page_screenshot_on_failure.png")
            print("Screenshot on login failure saved to data umat/login_page_screenshot_on_failure.png")
            with open("data umat/login_page_content_on_failure.html", "w", encoding="utf-8") as f:
                f.write(await page.content())
            print("HTML content on login failure saved to data umat/login_page_content_on_failure.html")
            await browser.close()
            return # Exit if login fails

        input_file_path = 'data umat/umat_detail.txt'
        output_dir = 'data umat/scraped_data/'

        os.makedirs(output_dir, exist_ok=True)

        with open(input_file_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()

        for line in lines:
            line = line.strip()
            if not line:
                continue

            parts = line.split(' ', 1)
            if len(parts) < 2:
                print(f"Skipping malformed line: {line}")
                continue

            url = parts[0]
            name = parts[1]
            
            # Extract ID from URL for filename
            match = re.search(r'/umat/detail/(\d+)', url)
            if not match:
                print(f"Skipping URL with no ID: {url}")
                continue
            detail_id = match.group(1)

            output_file_path = os.path.join(output_dir, f'{detail_id}.txt')

            print(f"Navigating to {url} for {name}...")
            try:
                await page.goto(url, wait_until="domcontentloaded", timeout=60000)
                
                # Check for "Data Not Found" or similar messages
                if await page.locator('text="Data Tidak Ditemukan"').is_visible():
                    print(f"Data Not Found for ID {detail_id}, skipping.")
                    with open(output_file_path, 'w', encoding='utf-8') as outfile:
                        outfile.write(f"Data Not Found for ID {detail_id}\n")
                    continue
                
                # Scrape text content from the body, or a more specific selector if available
                # For now, let's try to get content from a common content area or the body
                content_element = await page.query_selector('div.content-page div.content') 
                if content_element:
                    text_content = await content_element.inner_text()
                else:
                    text_content = await page.body_content()
                    print(f"Could not find specific content element for {url}, falling back to full body content.")

                with open(output_file_path, 'w', encoding='utf-8') as outfile:
                    outfile.write(f"--- Data for {name} (ID: {detail_id}) ---\n")
                    outfile.write(f"URL: {url}\n\n")
                    outfile.write(text_content.strip())
                    outfile.write("\n\n")
                print(f"Successfully scraped and saved data for {name} to {output_file_path}")

            except Exception as e:
                print(f"Error scraping {url}: {e}")
                with open(output_file_path, 'w', encoding='utf-8') as outfile:
                    outfile.write(f"Error scraping {url}: {e}\n")

        await browser.close()
        print("Scraping complete.")

if __name__ == '__main__':
    asyncio.run(run())