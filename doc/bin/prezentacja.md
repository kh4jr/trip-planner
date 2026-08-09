---
marp: true
theme: gaia
_class: lead
paginate: true
backgroundColor: #f5f7fb
color: #1e293b
style: |
  section {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    padding: 40px;
  }
  h1 {
    color: #2563eb;
    font-size: 2.2em;
  }
  h2 {
    color: #1e3a8a;
  }
  h3 {
    color: #3b82f6;
  }
  footer {
    font-size: 0.5em;
    color: #64748b;
  }
  li {
    font-size: 0.95em;
    margin-bottom: 8px;
  }
---

# Trip Planner 🌍
### Planowanie podróży grupowych

---

## 1. Cel Projektu 🛫

Rozwiązanie problemu chaosu informacyjnego podczas wyjazdów grupowych poprzez agregację danych w jednym miejscu.

*   **Centralizacja danych:** Harmonogram, budżet, zadania i notatki w spójnym panelu.
*   **Kolaboracja:** Wspólne edytowanie planu podróży przez uczestników w czasie rzeczywistym.
*   **Kontrola kosztów:** Łatwe rozliczanie wspólnych wydatków i podział kosztów.

---

## 2. Kluczowe Funkcjonalności 🛠️

Aplikacja składa się z modułów ułatwiających każdy etap podróży:

*   **📅 Plan Podróży:** Harmonogram z czasem aktywności i przejściem dzień po dniu.
*   **💰 Budżet i Wydatki:** Rejestrowanie kosztów z podziałem na kategorie (Jedzenie, Transport, Noclegi itp.) i informacją o płatniku.
*   **📋 Lista Zadań (To-do):** Wspólne pakowanie oraz lista zadań przed wyjazdem z przypisaniem osób.
*   **📝 Notatki:** Dowolne notatki organizacyjne (rezerwacje, bilety, adresy).

---

## 3. Stos Technologiczny 💻

*   **Framework:** `Next.js 15` (App Router) z Turbopack
*   **Język:** `TypeScript`
*   **Baza Danych & ORM:** `PostgreSQL` + `Prisma ORM`
*   **Autentykacja:** `NextAuth.js` (bezpieczne sesje użytkowników)
*   **Stylizacja UI:** `Tailwind CSS v4`
*   **Wizualizacja:** `react-simple-maps` (rysowanie mapy SVG)

---

## 4. Model Bazy Danych (ERD) 📊

Struktura bazy danych zoptymalizowana pod kątem kolaboracji grupowej:

*   **User:** Profil, bezpieczeństwo (bcrypt), powiązania z podróżami i znajomymi.
*   **Trip:** Główna encja grupująca uczestników, aktywności, wydatki, notatki, obrazy i zadania.
*   **Participant:** Łącznik określający rolę użytkownika w podróży (np. właściciel, członek).
*   **Friendships & Invites:** System zaproszeń do podróży oraz dodawania znajomych.

---

## 5. Profil Użytkownika i Wizualizacja 🗺️

*   **Interaktywna Mapa Świata (`WorldMap`):**
    *   Dynamiczne pinezki oznaczające cel podróży (np. Warszawa, Kraków).
*   **Karty Statystyk (KPI):**
    *   Liczba podróży.
    *   Suma wydatków użytkownika.
    *   Unikalne destynacje.
*   **Archiwum Podróży:** Podział na wyjazdy ukończone i przyszłe.

---

## 6. Dalszy Rozwój Projektu 🚀

*   **📄 Generowanie Word (DOCX):** Eksport planu podróży i kosztów jednym kliknięciem (szablon zintegrowany z `docx`).
*   **💬 Komunikator:** Dodanie czatu grupowego w czasie rzeczywistym wewnątrz podróży.
*   **📸 Wspólna Galeria:** Wdrażanie pełnego modułu `TripImage` do budowania wspólnych albumów ze zdjęciami.
*   **🔔 Powiadomienia:** System powiadomień w czasie rzeczywistym (web-push) o zmianach w planach.
