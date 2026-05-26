# Uruchomienie

## Development

Backend:

```bash
cd backend
cp .env.example .env
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Frontend:

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Domyślne konto development:

- login: `admin@local.test`
- hasło: `Admin123!`

## Docker Compose

```bash
docker compose up --build
```

Adresy:

- frontend: `http://localhost:8080`
- backend: `http://localhost:8000/health`

Przed wdrożeniem zmień `JWT_SECRET_KEY`, `POSTGRES_PASSWORD`, `ADMIN_PASSWORD` i ustaw HTTPS przez reverse proxy.
