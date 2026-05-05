def rank(results):
    # Rank based on content length (simple logic for now)
    return sorted(results, key=lambda x: len(x["content"]), reverse=True)
