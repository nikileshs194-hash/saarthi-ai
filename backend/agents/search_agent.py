from serpapi import GoogleSearch
import os

def search_links(query: str):
    params = {
        "q": query + " site:gov.in OR site:nic.in OR site:ac.in",
        "api_key": os.getenv("SERPAPI_KEY", "")
    }

    search = GoogleSearch(params)
    results = search.get_dict()

    links = []

    for result in results.get("organic_results", []):
        if "link" in result:
            links.append(result["link"])

    return links