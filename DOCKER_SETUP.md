# Docker Setup

## Requisitos
- Docker Desktop (o Docker + docker-compose)

## Estructura
- Backend: `proyects/Dockerfile`
- Frontend: `Dockerfile` en la raíz
- Compose: `docker-compose.yml`
- Env frontend: `.env` (VITE_API_BASE_URL)

## Variables
- Backend: `DATABASE_URL` (por ejemplo `mysql+pymysql://user:pass@host:3306/dbname`)
- Frontend: `VITE_API_BASE_URL` (por defecto `http://localhost:8000`)

## Comandos
```bash
# En convers-diagram-main
docker compose build
docker compose up -d

# Logs
docker compose logs -f backend
```

## Llevar a otra PC
1. Copia la carpeta `convers-diagram-main`
2. Ajusta `.env` y `docker-compose.yml` si cambia la base
3. Ejecuta `docker compose build && docker compose up -d`
