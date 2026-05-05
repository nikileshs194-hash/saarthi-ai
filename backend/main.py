import json
import secrets

from fastapi import FastAPI, Header, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import func

# ✅ FIX: correct function name
from agents.query_agent import process_query
from agents.search_agent import search_links
from agents.classifier import is_official
from agents.scraper import scrape
from agents.validator import validate
from agents.ranker import rank
from auth import (
    create_token,
    decode_token,
    hash_password,
    is_jwt_error,
    verify_password,
    verify_google_token,
)
from cache import r
from db import engine, Base, SessionLocal
from models.chat import Chat
from models.user import User
from vector_store import add_text, search as search_queries

Base.metadata.create_all(bind=engine)

app = FastAPI()

# ✅ CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    messages: list


class GoogleAuthRequest(BaseModel):
    credential: str


class ClickRequest(BaseModel):
    query: str


def _build_search_response_text(best_result: dict | None) -> str:
    if not best_result or not isinstance(best_result, dict):
        return ""

    title = (best_result.get("title") or "").strip()
    url = (best_result.get("url") or "").strip()
    content = (best_result.get("content") or "").strip()

    if title and url:
        return f"{title} - {url}"
    if title:
        return title
    if url:
        return url
    return content


def _get_user_from_token(db, token: str | None) -> User:
    if not token:
        raise HTTPException(status_code=401, detail="No token")

    try:
        payload = decode_token(token)
    except Exception as exc:
        if is_jwt_error(exc):
            raise HTTPException(status_code=401, detail="Invalid token") from exc
        raise

    email = payload.get("email") if isinstance(payload, dict) else None
    if not email:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return user


def _save_chat_record(db, user_id: int, query: str, response: str, source: str) -> None:
    db.add(Chat(user_id=user_id, query=query, response=response, source=source))


@app.get("/")
def home():
    return {"message": "Backend is working 🚀"}


@app.post("/signup")
async def signup(req: Request):
    data = await req.json()
    email = (data.get("email") or "").strip()
    password = data.get("password") or ""

    if not email or not password:
        return {"error": "Email and password are required"}

    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == email).first()
        if existing:
            return {"error": "User already exists"}

        user = User(email=email, password=hash_password(password))
        db.add(user)
        db.commit()
        return {"message": "User created"}
    finally:
        db.close()


@app.post("/login")
async def login(req: Request):
    data = await req.json()
    email = (data.get("email") or "").strip()
    password = data.get("password") or ""

    if not email or not password:
        return {"error": "Email and password are required"}

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            return {"error": "User not found"}

        if not verify_password(password, user.password):
            return {"error": "Invalid password"}

        token = create_token({"email": user.email})
        return {"token": token}
    finally:
        db.close()


@app.post("/login/google")
def login_google(payload: GoogleAuthRequest):
    db = SessionLocal()
    try:
        try:
            google_payload = verify_google_token(payload.credential)
        except ValueError as exc:
            detail = str(exc)
            status_code = 500 if "GOOGLE_CLIENT_ID" in detail else 401
            raise HTTPException(status_code=status_code, detail=detail) from exc

        email = (google_payload.get("email") or "").strip()
        email_verified = google_payload.get("email_verified", True)
        if not email or not email_verified:
            raise HTTPException(status_code=401, detail="Google email not verified")

        user = db.query(User).filter(User.email == email).first()
        if not user:
            random_password = secrets.token_urlsafe(32)
            user = User(email=email, password=hash_password(random_password))
            db.add(user)
            db.commit()
            db.refresh(user)

        token = create_token({"email": user.email})
        return {"token": token}
    finally:
        db.close()


@app.get("/search")
def search_api(q: str, token: str = Header(None)):
    db = SessionLocal()
    try:
        user = _get_user_from_token(db, token)
        links = search_links(q)
        official_links = [link for link in links if is_official(link)]

        results = []
        for link in official_links[:5]:
            data = scrape(link)
            if data and validate(data):
                results.append(data)

        ranked_results = rank(results)
        best_result = ranked_results[0] if ranked_results else None
        response_text = _build_search_response_text(best_result)

        _save_chat_record(db, user.id, q, response_text, "search")
        db.commit()

        try:
            add_text(q)
        except Exception:
            pass

        try:
            r.delete("popular_queries")
        except Exception:
            pass

        return {"best_result": best_result, "all_results": ranked_results}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        return {"error": str(e), "best_result": None, "all_results": []}
    finally:
        db.close()


@app.get("/search-history")
def search_history(token: str = Header(None)):
    db = SessionLocal()
    try:
        user = _get_user_from_token(db, token)
        query = db.query(Chat).filter(Chat.source == "search", Chat.user_id == user.id)

        searches = query.order_by(Chat.id.desc()).limit(10).all()
        return [
            {"query": search.query or "", "response": search.response or ""}
            for search in searches
        ]
    finally:
        db.close()


@app.get("/recent-searches")
def recent_searches(token: str = Header(None)):
    db = SessionLocal()
    try:
        user = _get_user_from_token(db, token)
        query = db.query(Chat).filter(Chat.source == "search", Chat.user_id == user.id)

        searches = query.order_by(Chat.id.desc()).limit(5).all()
        return [search.query for search in searches if search.query]
    finally:
        db.close()


@app.get("/popular-searches")
def popular_searches(token: str = Header(None)):
    db = SessionLocal()
    try:
        _get_user_from_token(db, token)
        try:
            cached = r.get("popular_queries")
            if cached:
                return json.loads(cached)
        except Exception:
            pass

        results = (
            db.query(Chat.query, func.count(Chat.query).label("count"))
            .filter(
                Chat.source == "search",
                Chat.query.isnot(None),
                Chat.query != "",
            )
            .group_by(Chat.query)
            .order_by(func.count(Chat.query).desc())
            .limit(5)
            .all()
        )
        data = [result.query for result in results if result.query]
        try:
            r.set("popular_queries", json.dumps(data), ex=600)
        except Exception:
            pass
        return data
    finally:
        db.close()


@app.get("/autocomplete")
def autocomplete(q: str, token: str = Header(None)):
    if not q or len(q.strip()) < 2:
        return []

    db = SessionLocal()
    try:
        user = _get_user_from_token(db, token)
        results = (
            db.query(Chat.query, func.max(Chat.id).label("latest_id"))
            .filter(
                Chat.source == "search",
                Chat.query.isnot(None),
                Chat.user_id == user.id,
                Chat.query.ilike(f"%{q}%"),
            )
            .group_by(Chat.query)
            .order_by(func.max(Chat.id).desc())
            .limit(5)
            .all()
        )
        return [result.query for result in results if result.query]
    finally:
        db.close()


@app.get("/ai-recommend")
def ai_recommend(q: str, token: str = Header(None)):
    if not q or len(q.strip()) < 2:
        return []

    db = SessionLocal()
    try:
        _get_user_from_token(db, token)
        return search_queries(q)
    except Exception:
        return []
    finally:
        db.close()


@app.get("/recommendations")
def recommendations(token: str = Header(None)):
    db = SessionLocal()
    try:
        user = _get_user_from_token(db, token)
        recent_query = db.query(Chat).filter(
            Chat.source == "search", Chat.user_id == user.id
        )

        recent = recent_query.order_by(Chat.id.desc()).limit(3).all()
        keywords = [item.query for item in recent if item.query]

        rec_query = db.query(Chat.query).filter(
            Chat.source == "search", Chat.user_id == user.id, Chat.query.isnot(None)
        )
        if keywords:
            rec_query = rec_query.filter(~Chat.query.in_(keywords))

        recs = rec_query.order_by(Chat.id.desc()).limit(5).all()
        return [rec[0] for rec in recs if rec[0]]
    finally:
        db.close()


@app.post("/track-click")
def track_click(req: ClickRequest, token: str = Header(None)):
    if not req.query:
        return {"status": "skipped"}

    db = SessionLocal()
    try:
        user = _get_user_from_token(db, token)
        chat = (
            db.query(Chat)
            .filter(Chat.source == "search", Chat.query == req.query)
            .filter(Chat.user_id == user.id)
            .order_by(Chat.id.desc())
            .first()
        )
        if chat:
            chat.clicks = (chat.clicks or 0) + 1
            db.commit()
        return {"status": "tracked"}
    finally:
        db.close()


@app.post("/chat")
def chat(req: ChatRequest, token: str = Header(None)):
    db = SessionLocal()
    try:
        user = _get_user_from_token(db, token)
        result = process_query(req.messages)

        latest_query = req.messages[-1]["content"] if req.messages else ""
        response_text = result.get("response", "")
        _save_chat_record(db, user.id, latest_query, response_text, "chat")
        db.commit()

        return result
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        return {"error": str(e)}
    finally:
        db.close()


@app.get("/history")
def get_history(token: str = Header(None)):
    db = SessionLocal()
    try:
        user = _get_user_from_token(db, token)
        query = db.query(Chat).filter(Chat.user_id == user.id)

        chats = query.order_by(Chat.id).all()
        history = []
        for chat in chats:
            if chat.source not in (None, "chat"):
                continue

            if chat.query or chat.response:
                if chat.query:
                    history.append({"role": "user", "content": chat.query})
                if chat.response:
                    history.append({"role": "assistant", "content": chat.response})
                continue

            if chat.role and chat.content:
                history.append({"role": chat.role, "content": chat.content})

        return history
    finally:
        db.close()
