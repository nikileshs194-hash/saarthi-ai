from agents.search_agent import search_links
from agents.classifier import is_official
from agents.scraper import scrape
from agents.validator import validate
from agents.ranker import rank
from agents.response_generator import generate_response
from cache import r
from vector_store import search_documents, add_document_text


def process_query(req_messages: list):
    # Get the latest query from the user to pass into search_links
    query = req_messages[-1]["content"] if req_messages else ""

    # 🔥 Check cache first
    try:
        cached = r.get(query)
        if cached:
            return {"response": cached, "source": "cache"}
    except Exception:
        pass

    links = search_links(query)

    official_links = [link for link in links if is_official(link)]

    results = []

    for link in official_links[:5]:
        data = scrape(link)
        if data and validate(data):
            results.append(data)
            # Add to RAG knowledge base safely
            clean_text = data.get("content", "")[:500]
            if clean_text:
                add_document_text(clean_text)

    ranked_results = rank(results)

    best = ranked_results[0] if ranked_results else None

    # Process FAISS RAG context
    try:
        context = search_documents(query)
    except Exception:
        context = []

    if not context and not best:
        return {
            "query": query,
            "best_result": None,
            "response": "I couldn't find official information. Please try a more specific query.",
        }

    prompt = f"""
You are a helpful government assistant.

User Query: {query}

Relevant Information:
{context}

Best Online Search Context:
{best}

Instructions:
- Answer clearly
- Give step-by-step process
- Mention required documents if applicable
- Include official link

Answer:
"""

    # Prepare messages for generation
    messages = req_messages + [{"role": "system", "content": prompt}]

    response_text = generate_response(messages)

    # ✅ Clean response also
    response_text = response_text.encode("utf-8", "ignore").decode("utf-8")

    # 🔥 Save to cache
    try:
        r.set(query, response_text, ex=3600)  # 1 hour expiration
    except Exception:
        pass

    return {"query": query, "best_result": best, "response": response_text}
