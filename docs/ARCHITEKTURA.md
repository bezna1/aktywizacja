# Architektura

System jest podzielony na trzy warstwy:

```text
Frontend React / przyszły Electron lub Tauri
        ↓ REST API + JWT
Backend FastAPI
        ↓ SQLAlchemy / Alembic
PostgreSQL
```

Klient nie łączy się bezpośrednio z bazą danych. Wszystkie reguły bezpieczeństwa, walidacja, role, audyt i blokady edycji są po stronie API.

Tryby pracy:

- Lokalny LAN: backend i PostgreSQL na serwerze biurowym, użytkownicy wchodzą przez przeglądarkę.
- Chmura/VPS: Docker Compose za reverse proxy z HTTPS.
- Desktop Windows: Electron/Tauri opakowuje frontend i komunikuje się z tym samym REST API.

Bezpieczeństwo:

- JWT auth.
- Hash haseł bcrypt.
- Role: administrator, pracownik, odczyt.
- Backendowa walidacja PESEL/telefonu i kompletności danych.
- Audit log dla zmian.
- Przygotowanie do HTTPS, VPN, ograniczenia IP i backupów po stronie wdrożenia.
