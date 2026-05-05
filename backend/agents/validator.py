def validate(result):
    url = result["url"]

    # Only allow HTTPS
    if not url.startswith("https://"):
        return False

    # Remove very short content
    if len(result["content"]) < 100:
        return False

    return True
