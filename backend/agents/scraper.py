import requests
from bs4 import BeautifulSoup

def scrape(url: str):
    try:
        # ❌ Skip PDF files
        if url.endswith(".pdf"):
            return None

        headers = {
            "User-Agent": "Mozilla/5.0"
        }

        response = requests.get(url, headers=headers, timeout=5)

        # ❌ Skip non-HTML content
        if "text/html" not in response.headers.get("Content-Type", ""):
            return None

        soup = BeautifulSoup(response.text, "html.parser")

        title = soup.title.string if soup.title else "No title"

        # ✅ Remove unwanted tags
        for tag in soup(["script", "style", "nav", "footer"]):
            tag.decompose()

        text = soup.get_text(separator=" ")

        # Clean text
        text = " ".join(text.split())

        # \ud83d\udd25 FIX Unicode errors
        text = text.encode("utf-8", "ignore").decode("utf-8")

        return {
            "url": url,
            "title": title,
            "content": text[:500]
        }

    except Exception as e:
        return None
