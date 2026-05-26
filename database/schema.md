# Schemat bazy danych

Główne tabele:

- `users` - konta użytkowników, role `admin`, `worker`, `readonly`, hash hasła.
- `counties` - słownik powiatów pobrany z publicznego GeoJSON i zapisany lokalnie w bazie.
- `participants` - dane osobowe, status, kompletność danych, czerwona lampka, `version` do optimistic locking.
- `trainings` - szkolenia, prowadzący, harmonogram, liczba godzin, status.
- `participant_trainings` - relacja wiele-do-wielu uczestnik-szkolenie z wynikiem, obecnością i statusem.
- `program_assignments` - przypisania do programów wsparcia.
- `attendance` - obecności i nieobecności.
- `documents` - dokumenty wymagane i dostarczone.
- `audit_logs` - historia zmian: użytkownik, akcja, encja, pola.

Produkcyjnie system używa PostgreSQL. SQLite jest tylko trybem development/test.
