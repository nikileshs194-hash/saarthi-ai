def is_official(url: str):
    official_domains = [".gov.in", ".nic.in", ".ac.in"]

    return any(domain in url for domain in official_domains)
