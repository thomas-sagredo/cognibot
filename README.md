# 🤖 Cognibot — Chatbot Flow Builder

A visual chatbot flow builder with WhatsApp integration, user authentication, and a real-time canvas editor. Built to let teams design, test and deploy conversation flows without writing code.

![Stack](https://img.shields.io/badge/Frontend-React%20%2B%20Vite%20%2B%20TypeScript-blue)
![Stack](https://img.shields.io/badge/Backend-FastAPI%20%2B%20Python-green)
![Stack](https://img.shields.io/badge/Database-MySQL%208-orange)
![Stack](https://img.shields.io/badge/Deploy-Docker%20%2B%20Nginx-lightgrey)

---

## ✨ Features

- **Visual Flow Builder** — drag-and-drop canvas to design chatbot conversation flows
- **Node types** — Message, Options, Condition, Delay, Input, Action, End
- **WhatsApp Integration** — connect to Meta Cloud API to deploy flows to WhatsApp
- **User Authentication** — JWT-based login/register system
- **Real-time Chat Simulator** — test your flows before going live
- **Dashboard & Analytics** — track conversations and bot performance
- **Multi-project** — manage multiple chatbot projects from one account

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, TypeScript, Tailwind CSS, shadcn/ui |
| Flow Canvas | @xyflow/react (React Flow) |
| Backend | FastAPI, SQLAlchemy, Uvicorn |
| Database | MySQL 8.0 |
| Auth | JWT (python-jose + passlib) |
| Containerization | Docker, Docker Compose, Nginx |

---

## 🚀 Quick Start (Local)

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed

### 1. Clone the repo
```bash
git clone https://github.com/thomas-sagredo/cognibot.git
cd cognibot
```

### 2. Configure environment variables
```bash
cp .env.example .env
# Edit .env with your values (see .env.example for guidance)
```

### 3. Start all services
```bash
docker compose up -d --build
```

### 4. Open the app
| Service | URL |
|---------|-----|
| **Frontend** | http://localhost:8080 |
| **API Docs** | http://localhost:8000/docs |
| **Backend** | http://localhost:8000 |

---

## ⚙️ Environment Variables

Copy `.env.example` to `.env` and fill in the values:

```env
# Database
MYSQL_DATABASE=cognibot_db
MYSQL_USER=cognibot
MYSQL_PASSWORD=your_secure_password
MYSQL_ROOT_PASSWORD=your_secure_root_password

# Backend — JWT Security
SECRET_KEY=generate-with: python -c "import secrets; print(secrets.token_hex(32))"
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

# CORS (comma-separated origins)
ALLOWED_ORIGINS=http://localhost:8080

# Frontend → Backend URL
VITE_API_BASE_URL=http://localhost:8000
```

> ⚠️ Never commit your `.env` file. It is already in `.gitignore`.

---

## 📁 Project Structure

```
cognibot/
├── src/                    # React frontend source
│   ├── components/         # UI components & flow nodes
│   ├── hooks/              # Custom React hooks
│   ├── pages/              # App pages (Dashboard, Builder, etc.)
│   ├── services/           # API client
│   └── types/              # TypeScript types
├── proyects/               # FastAPI backend
│   ├── main.py             # API routes & app setup
│   ├── models.py           # Database models
│   ├── auth.py             # Authentication logic
│   ├── whatsapp_service.py # WhatsApp Meta API integration
│   ├── init_db.py          # DB initialization
│   └── requirements.txt    # Python dependencies
├── public/                 # Static assets (login.html, etc.)
├── Dockerfile              # Frontend container (Nginx)
├── docker-compose.yml      # Orchestrates all 3 services
├── nginx.conf              # Nginx SPA config
└── .env.example            # Environment variables template
```

---

## 🛠️ Development (without Docker)

**Frontend:**
```bash
npm install
npm run dev        # http://localhost:5173
```

**Backend:**
```bash
cd proyects
python -m venv .venv
.venv\Scripts\activate   # Windows
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

---

## 📄 License

MIT
