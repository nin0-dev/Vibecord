from playwright.sync_api import sync_playwright

def test_portals_plugin(page):
    page.goto("https://www.google.com")
    page.screenshot(path="verification/verification.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            test_portals_plugin(page)
        finally:
            browser.close()
