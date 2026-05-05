from serpapi import GoogleSearch
import os

def search_links(query: str):
    params = {
        "q": query + " site:gov.in OR site:nic.in OR site:ac.in",
        "api_key": "ec64cd75a3e253b278f253eaf8888d368db97d40acb0cc6ccd4f3941c47b6c8c"
    }

    search = GoogleSearch(params)
    results = search.get_dict()

    links = []

    for result in results.get("organic_results", []):
        if "link" in result:
            links.append(result["link"])

    return links