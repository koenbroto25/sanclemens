import requests
from bs4 import BeautifulSoup
import os
import re

def run_sync(): # Changed to a synchronous function
    # 1. Inisialisasi session agar cookie tetap tersimpan setelah login
    session = requests.Session()

    # 2. Tentukan URL login dan payload (data login)
    login_url = "https://umat.kasri.id/auth"
    login_post_url = "https://umat.kasri.id/auth/login" # Form action URL

    # Get the CSRF token first by making a GET request to the login page
    print("Fetching login page to get CSRF token...")
    response = session.get(login_url)
    soup = BeautifulSoup(response.text, 'html.parser')
    
    csrf_token_element = soup.find('input', {'name': '_csrf'})
    if not csrf_token_element:
        print("Error: CSRF token not found on the login page. Cannot proceed with login.")
        return
    csrf_token = csrf_token_element['value']
    print(f"CSRF Token obtained: {csrf_token}")

    payload = {
        '_csrf': csrf_token,
        'username': 'yasinta.elvi@gmail.com',
        'password': 'yasintaelvi27'
    }

    # 3. Kirim permintaan POST untuk login
    print("Attempting to log in...")
    response = session.post(login_post_url, data=payload, allow_redirects=True)
    
    # Check if login was successful by checking the redirected URL or content
    if "Login" not in response.url and "dashboard" in response.url: # Assuming successful login redirects to a dashboard or non-login page
        print("Logged in successfully.")
    else:
        print(f"Login failed. Status code: {response.status_code}")
        print("Response URL after login attempt:", response.url)
        # Optionally save the failed login page content for debugging
        with open("data umat/failed_login_response.html", "w", encoding="utf-8") as f:
            f.write(response.text)
        print("Failed login response saved to data umat/failed_login_response.html for inspection.")
        return

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

        print(f"Fetching data for {name} from {url}...")
        try:
            data_response = session.get(url)
            
            if data_response.status_code == 200:
                soup = BeautifulSoup(data_response.text, 'html.parser')
                
                # Extract main content. This is a generic attempt; might need adjustment
                # Looking for div.content-page div.content as identified in Playwright script
                content_element = soup.find('div', class_='content-page')
                if content_element:
                    text_content = content_element.get_text(separator='\n', strip=True)
                else:
                    text_content = soup.get_text(separator='\n', strip=True)
                    print(f"Could not find specific content element for {url}, falling back to full page text.")

                with open(output_file_path, 'w', encoding='utf-8') as outfile:
                    outfile.write(f"--- Data for {name} (ID: {detail_id}) ---\n")
                    outfile.write(f"URL: {url}\n\n")
                    outfile.write(text_content)
                    outfile.write("\n\n")
                print(f"Successfully scraped and saved data for {name} to {output_file_path}")
            else:
                print(f"Failed to fetch data for {name} from {url}. Status code: {data_response.status_code}")
                with open(output_file_path, 'w', encoding='utf-8') as outfile:
                    outfile.write(f"Failed to fetch data for {name} from {url}. Status code: {data_response.status_code}\n")

        except Exception as e:
            print(f"Error scraping {url}: {e}")
            with open(output_file_path, 'w', encoding='utf-8') as outfile:
                outfile.write(f"Error scraping {url}: {e}\n")

    print("Scraping complete.")

if __name__ == '__main__':
    run_sync() # Call the synchronous function directly
