from sentence_transformers import SentenceTransformer
import faiss
import numpy as np

model = SentenceTransformer("all-MiniLM-L6-v2")

doc_texts = []
query_texts = []

doc_index = faiss.IndexFlatL2(384)
query_index = faiss.IndexFlatL2(384)


def add_document_text(text):
    if not text:
        return

    vec = model.encode([text])
    doc_index.add(np.array(vec))
    doc_texts.append(text)


def search_documents(query, limit=3):
    if not doc_texts:
        return []

    vec = model.encode([query])
    _, indices = doc_index.search(np.array(vec), k=min(limit, len(doc_texts)))
    return [doc_texts[i] for i in indices[0] if i < len(doc_texts)]


def add_text(text):
    if not text:
        return

    vec = model.encode([text])
    query_index.add(np.array(vec))
    query_texts.append(text)


def search(query, limit=5):
    if not query_texts:
        return []

    vec = model.encode([query])
    _, indices = query_index.search(np.array(vec), k=min(limit, len(query_texts)))
    return [query_texts[i] for i in indices[0] if i < len(query_texts)]
