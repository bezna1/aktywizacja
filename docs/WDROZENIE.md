# Wdrożenie VPS/chmura

Minimalny wariant:

1. Serwer Linux z Docker i Docker Compose.
2. Domenowy reverse proxy, np. Nginx/Caddy/Traefik.
3. Certyfikat TLS Let's Encrypt.
4. Zmienione sekrety w zmiennych środowiskowych.
5. Backup wolumenu PostgreSQL.

Zalecenia:

- Ogranicz dostęp do panelu administracyjnego po IP lub przez VPN.
- Ustaw automatyczny backup PostgreSQL i test odtwarzania.
- Nie używaj domyślnego konta admina po wdrożeniu.
- Przechowuj logi i backupy poza kontenerem.

Desktop Windows:

- Electron albo Tauri buduje aplikację kliencką z katalogu `frontend`.
- Backend zostaje bez zmian i działa lokalnie w LAN albo w chmurze.
- Aplikacja desktop ustawia `VITE_API_URL` na adres API.
