<![CDATA[<div align="center">

# 🤖 AxionX — AI-Powered Government Services Assistant

**An intelligent search & chat platform that helps citizens navigate Indian government services using AI agents, RAG, and real-time web search.**

[![Python](https://img.shields.io/badge/Python-3.11-3776AB?logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=next.js&logoColor=white)](https://nextjs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?logo=postgresql&logoColor=white)](https://postgresql.org)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D?logo=redis&logoColor=white)](https://redis.io)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)](https://docker.com)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

</div>

---

## 📌 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [API Reference](#-api-reference)
- [Environment Variables](#-environment-variables)
- [Screenshots](#-screenshots)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🧠 Overview

**AxionX** is a full-stack AI assistant designed to help Indian citizens quickly find accurate, official information about government services, schemes, and procedures. Instead of manually searching through dozens of `.gov.in` portals, users can simply ask a question in natural language and receive a curated, AI-generated answer backed by verified government sources.

The platform uses a **multi-agent pipeline** that searches the web, scrapes official sites, validates and ranks results, and generates human-friendly responses using the **Groq LLM (LLaMA 3.3 70B)**. A **FAISS-based RAG** (Retrieval-Augmented Generation) layer continuously builds a knowledge base for faster, context-aware future responses.

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 🔍 **Smart Search** | Searches `.gov.in`, `.nic.in`, and `.ac.in` domains via SerpAPI for official results |
| 🤖 **AI Chat Assistant** | Conversational interface powered by Groq's LLaMA 3.3 70B model |
| 🧩 **Multi-Agent Pipeline** | Search → Classify → Scrape → Validate → Rank → Generate |
| 📚 **RAG Knowledge Base** | FAISS vector store with sentence-transformers for contextual retrieval |
| ⚡ **Redis Caching** | Caches responses and popular queries for sub-second repeated lookups |
| 🔐 **Authentication** | Email/password (bcrypt) + Google OAuth 2.0 sign-in with JWT tokens |
| 📊 **Search Analytics** | Tracks search history, popular queries, click tracking, and recommendations |
| 🔮 **Autocomplete** | Suggests queries based on user's search history |
| 🐳 **Dockerized** | Full-stack deployment with Docker Compose (backend, frontend, Postgres, Redis, n8n) |

---

## 🏗 Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                         │
│                     Next.js 16 + TailwindCSS                     │
└──────────────┬──────────────────────────────────┬────────────────┘
               │  REST API (JSON)                 │
               ▼                                  ▼
┌──────────────────────────┐    ┌─────────────────────────────────┐
│     AUTH MODULE           │    │        FASTAPI SERVER           │
│  • JWT Token Auth         │    │     (uvicorn :8000)             │
│  • Google OAuth 2.0       │    │                                 │
│  • bcrypt Hashing         │    │  /chat  /search  /history       │
└──────────────────────────┘    │  /signup  /login  /login/google  │
                                └───────────┬─────────────────────┘
                                            │
               ┌────────────────────────────┼────────────────────────┐
               ▼                            ▼                        ▼
┌──────────────────────┐  ┌──────────────────────┐  ┌───────────────────────┐
│   AGENT PIPELINE     │  │    DATA STORES       │  │   VECTOR STORE (RAG)  │
│                      │  │                      │  │                       │
│  1. Search Agent     │  │  PostgreSQL 15       │  │  FAISS IndexFlatL2    │
│     (SerpAPI)        │  │   • Users table      │  │  sentence-transformers│
│  2. Classifier       │  │   • Chats table      │  │  (all-MiniLM-L6-v2)  │
│     (gov domain)     │  │                      │  │                       │
│  3. Scraper          │  │  Redis 7             │  │  In-memory knowledge  │
│     (BeautifulSoup)  │  │   • Query cache      │  │  base with semantic   │
│  4. Validator        │  │   • Popular queries   │  │  similarity search    │
│  5. Ranker           │  │                      │  │                       │
│  6. Response Gen     │  └──────────────────────┘  └───────────────────────┘
│     (Groq LLaMA 3.3)│
└──────────────────────┘
```

### Agent Pipeline Flow

```
User Query
    │
    ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ Search Agent │───▶│ Classifier  │───▶│  Scraper    │
│  (SerpAPI)   │    │ (gov check) │    │  (BS4)      │
└─────────────┘    └─────────────┘    └──────┬──────┘
                                             │
    ┌────────────────────────────────────────┘
    ▼
┌─────────────┐    ┌─────────────┐    ┌──────────────────┐
│ Validator   │───▶│   Ranker    │───▶│ Response Generator│
│ (quality)   │    │ (relevance) │    │ (Groq LLaMA 3.3) │
└─────────────┘    └─────────────┘    └──────────────────┘
                                             │
                                             ▼
                                      AI-Generated Answer
                                      + Source Citations
```

---

## 🛠 Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| **FastAPI** | High-performance async REST API framework |
| **Groq (LLaMA 3.3 70B)** | LLM for generating natural language responses |
| **SerpAPI** | Google search API for finding government sources |
| **BeautifulSoup4** | Web scraping official government pages |
| **FAISS** | Vector similarity search for RAG knowledge base |
| **sentence-transformers** | Text embeddings (all-MiniLM-L6-v2) |
| **SQLAlchemy** | ORM for PostgreSQL database operations |
| **bcrypt** | Secure password hashing |
| **python-jose** | JWT token creation and validation |
| **Redis** | In-memory caching layer |

### Frontend
| Technology | Purpose |
|---|---|
| **Next.js 16** | React framework with server-side rendering |
| **React 19** | UI component library |
| **TailwindCSS 4** | Utility-first CSS framework |
| **react-markdown** | Render AI responses with markdown formatting |

### Infrastructure
| Technology | Purpose |
|---|---|
| **Docker Compose** | Multi-container orchestration |
| **PostgreSQL 15** | Primary relational database |
| **Redis 7** | Caching and session store |
| **n8n** | Workflow automation (port 5678) |

---

## 📁 Project Structure

```
AI_project/
├── backend/                    # FastAPI Python backend
│   ├── agents/                 # Multi-agent pipeline modules
│   │   ├── search_agent.py     # SerpAPI web search
│   │   ├── classifier.py       # Official domain classifier
│   │   ├── scraper.py          # BeautifulSoup web scraper
│   │   ├── validator.py        # Content quality validator
│   │   ├── ranker.py           # Result relevance ranker
│   │   ├── query_agent.py      # Orchestrates the full pipeline
│   │   └── response_generator.py # Groq LLM response generation
│   ├── models/                 # SQLAlchemy ORM models
│   │   ├── user.py             # User model (email, password)
│   │   └── chat.py             # Chat model (queries, responses, clicks)
│   ├── auth.py                 # JWT + bcrypt + Google OAuth
│   ├── cache.py                # Redis client configuration
│   ├── db.py                   # PostgreSQL connection & session
│   ├── vector_store.py         # FAISS vector store for RAG
│   ├── main.py                 # FastAPI app with all endpoints
│   └── requirements.txt        # Python dependencies
│
├── frontend/                   # Next.js React frontend
│   ├── pages/
│   │   ├── index.js            # Landing / dashboard page
│   │   ├── login.js            # Login & signup page
│   │   └── chat.js             # AI chat interface
│   ├── public/                 # Static assets
│   ├── package.json            # Node.js dependencies
│   └── next.config.mjs         # Next.js configuration
│
├── docker/                     # Docker configuration
│   ├── docker-compose.yml      # Multi-service orchestration
│   ├── backend.Dockerfile      # Python 3.11 backend image
│   ├── frontend.Dockerfile     # Node 20 frontend image
│   └── .env                    # Environment variables
│
├── .dockerignore               # Docker build exclusions
└── README.md                   # ← You are here
```

---

## 🚀 Getting Started

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (v20+)
- [Git](https://git-scm.com/)

### 1. Clone the Repository

```bash
git clone https://github.com/<your-username>/AI_project.git
cd AI_project
```

### 2. Configure Environment Variables

Edit `docker/.env` with your API keys:

```env
GROQ_API_KEY=your_groq_api_key_here
JWT_SECRET_KEY=your_jwt_secret_here
GOOGLE_CLIENT_ID=your_google_client_id_here   # Optional, for Google OAuth
```

> **📝 Note:** Get your Groq API key from [console.groq.com](https://console.groq.com). The SerpAPI key is currently hardcoded in `backend/agents/search_agent.py` — move it to `.env` for production.

### 3. Launch with Docker Compose

```bash
cd docker
docker compose up --build
```

This will spin up **5 containers**:

| Service | URL | Description |
|---|---|---|
| **Backend** | [http://localhost:8000](http://localhost:8000) | FastAPI REST API |
| **Frontend** | [http://localhost:3000](http://localhost:3000) | Next.js web app |
| **PostgreSQL** | `localhost:5432` | Database (user: `axionx`, db: `axionx_db`) |
| **Redis** | `localhost:6379` | Cache layer |
| **n8n** | [http://localhost:5678](http://localhost:5678) | Workflow automation |

### 4. Verify the Setup

```bash
# Backend health check
curl http://localhost:8000/
# Expected: {"message":"Backend is working 🚀"}
```

Then open [http://localhost:3000](http://localhost:3000) in your browser to access the frontend.

---

## 📡 API Reference

### Authentication

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/signup` | Register a new user | ❌ |
| `POST` | `/login` | Login with email/password | ❌ |
| `POST` | `/login/google` | Login with Google OAuth | ❌ |

### Search & Chat

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/chat` | Send messages to AI assistant | ✅ JWT |
| `GET` | `/search?q=` | Search government sources | ✅ JWT |

### History & Analytics

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/history` | Get full chat history | ✅ JWT |
| `GET` | `/search-history` | Get search history (last 10) | ✅ JWT |
| `GET` | `/recent-searches` | Get recent searches (last 5) | ✅ JWT |
| `GET` | `/popular-searches` | Get most popular queries | ✅ JWT |
| `GET` | `/autocomplete?q=` | Get autocomplete suggestions | ✅ JWT |
| `GET` | `/ai-recommend?q=` | Get AI-powered recommendations | ✅ JWT |
| `GET` | `/recommendations` | Get personalized recommendations | ✅ JWT |
| `POST` | `/track-click` | Track result clicks | ✅ JWT |

### Authentication Header

All protected endpoints require a JWT token passed in the header:

```
token: <your_jwt_token>
```

### Example: Chat Request

```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -H "token: YOUR_JWT_TOKEN" \
  -d '{"messages": [{"role": "user", "content": "How to apply for a passport in India?"}]}'
```

---

## 🔐 Environment Variables

| Variable | Description | Default |
|---|---|---|
| `GROQ_API_KEY` | Groq API key for LLaMA 3.3 access | — (required) |
| `JWT_SECRET_KEY` | Secret key for JWT token signing | `supersecretkey` |
| `TOKEN_EXPIRE_HOURS` | JWT token expiration time in hours | `2` |
| `GOOGLE_CLIENT_ID` | Google OAuth 2.0 client ID | — (optional) |

---

## 🗺 Roadmap

- [ ] Move all API keys to environment variables
- [ ] Add persistent FAISS vector store (save/load to disk)
- [ ] Implement conversation memory with context window
- [ ] Add rate limiting and request throttling
- [ ] Integrate n8n workflows for automated alerts
- [ ] Add multilingual support (Hindi, regional languages)
- [ ] Implement admin dashboard for analytics
- [ ] Add unit and integration tests
- [ ] Set up CI/CD pipeline with GitHub Actions
- [ ] Deploy to cloud (AWS/GCP/Azure)

---

## 🤝 Contributing

Contributions are welcome! Here's how to get started:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Setup (without Docker)

**Backend:**
```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

> **⚠️ Note:** When running without Docker, you'll need PostgreSQL and Redis running locally and update the connection strings in `db.py` and `cache.py`.

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built with ❤️ by [Nikilesh](https://github.com/Nikilesh)**

*Making government services accessible to every citizen through AI.*

</div>
]]>
