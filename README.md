# System zarządzania uczestnikami aktywizacji

Struktura:

- `backend` - FastAPI, SQLAlchemy, Alembic, JWT, import XLSX.
- `frontend` - React, TypeScript, Material UI.
- `database` - opis schematu.
- `docs` - architektura i wdrożenie.
- `docker` - Dockerfile i Nginx.

Zakres pierwszego etapu:

- logowanie JWT,
- role użytkowników,
- dashboard administratora,
- lista uczestników,
- formularz rejestracji z walidacją,
- czerwona lampka braków danych,
- szkolenia i relacja uczestnik-szkolenie,
- import XLSX z pliku w układzie `BAZA UP.xlsx`,
- audyt zmian,
- optimistic locking przez pole `version`,
- Docker Compose z PostgreSQL.
