# 🔗 DOKŁADNA INSTRUKCJA - Połączenie z GitHub

## KROK 1: Otwórz Cursor i folder projektu

1. **Otwórz Cursor**
2. **Otwórz folder:**
   - `File` → `Open Folder`
   - Wybierz: `C:\Users\mmaci\Desktop\pos-system`
   - Kliknij `Select Folder`

## KROK 2: Zainicjalizuj Git w Cursor

1. **Otwórz Command Palette:**
   - Naciśnij `Ctrl + Shift + P`

2. **Wpisz i wybierz:**
   - Wpisz: `Git: Initialize Repository`
   - Kliknij na `Git: Initialize Repository` (pierwsza opcja)

3. **Wybierz folder:**
   - Wybierz: `C:\Users\mmaci\Desktop\pos-system`
   - Kliknij `Select Repository Location`

## KROK 3: Dodaj pliki do Git

1. **Otwórz Source Control:**
   - Kliknij ikonę `Source Control` w lewym panelu (wygląda jak rozgałęzione drzewo)
   - Lub naciśnij `Ctrl + Shift + G`

2. **Dodaj wszystkie pliki:**
   - Kliknij `+` przy `Changes` (obok napisu "Changes")
   - Lub naciśnij `Ctrl + Shift + P` → wpisz `Git: Add All` → Enter

3. **Sprawdź czy pliki są dodane:**
   - W sekcji "Staged Changes" powinny być wszystkie pliki projektu

## KROK 4: Zrób pierwszy commit

1. **Wpisz wiadomość commit:**
   - W polu tekstowym nad przyciskiem "Commit" wpisz:
   ```
   Initial commit - POS System
   ```

2. **Zrób commit:**
   - Kliknij przycisk `Commit` (✓)
   - Lub naciśnij `Ctrl + Enter`

## KROK 5: Opublikuj na GitHub

1. **Otwórz Command Palette:**
   - Naciśnij `Ctrl + Shift + P`

2. **Wpisz i wybierz:**
   - Wpisz: `Git: Publish to GitHub`
   - Kliknij na `Git: Publish to GitHub` (pierwsza opcja)

3. **Zaloguj się do GitHub:**
   - Jeśli nie jesteś zalogowany, otworzy się przeglądarka
   - Zaloguj się do swojego konta GitHub
   - Wróć do Cursor

4. **Skonfiguruj repozytorium:**
   - **Repository name:** `pos-system`
   - **Description:** `Modern POS System with React and Node.js`
   - **Visibility:** Wybierz `Private` (lub `Public` jeśli chcesz)
   - **Add a README file:** Zostaw odznaczone
   - **Add .gitignore:** Zostaw odznaczone

5. **Opublikuj:**
   - Kliknij `Publish to GitHub`

## KROK 6: Sprawdź czy się udało

1. **Otwórz przeglądarkę:**
   - Przejdź na [github.com](https://github.com)
   - Zaloguj się do swojego konta

2. **Znajdź repozytorium:**
   - Kliknij na swój avatar (prawy górny róg)
   - Kliknij `Your repositories`
   - Znajdź `pos-system`

3. **Sprawdź zawartość:**
   - Kliknij na `pos-system`
   - Powinny być widoczne wszystkie pliki projektu

## KROK 7: Połącz z Vercel

1. **Przejdź na Vercel:**
   - Otwórz [vercel.com](https://vercel.com)
   - Zaloguj się do swojego konta

2. **Utwórz nowy projekt:**
   - Kliknij `New Project`
   - Kliknij `Import Git Repository`

3. **Znajdź repozytorium:**
   - W sekcji `GitHub` znajdź `pos-system`
   - Kliknij `Import` obok `pos-system`

4. **Skonfiguruj projekt:**
   - **Project Name:** `pos-system-backend`
   - **Root Directory:** Kliknij `Edit` i wpisz `apps/backend`
   - **Framework Preset:** `Other`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`

5. **Wdróż:**
   - Kliknij `Deploy`

## 🔧 ROZWIĄZYWANIE PROBLEMÓW

### Problem: "Git: Initialize Repository" nie działa
**Rozwiązanie:**
- Sprawdź czy folder jest otwarty w Cursor
- Spróbuj ponownie `Ctrl + Shift + P` → `Git: Initialize Repository`

### Problem: Nie widzę ikony Source Control
**Rozwiązanie:**
- Naciśnij `Ctrl + Shift + G`
- Lub kliknij `View` → `Source Control`

### Problem: "Git: Publish to GitHub" nie działa
**Rozwiązanie:**
- Upewnij się, że jesteś zalogowany do GitHub
- Sprawdź połączenie internetowe
- Spróbuj ponownie

### Problem: Nie mogę znaleźć repozytorium w Vercel
**Rozwiązanie:**
- Odśwież stronę Vercel
- Sprawdź czy repozytorium jest publiczne (jeśli wybrałeś Private, może być problem)
- Spróbuj wyszukać `pos-system` w polu wyszukiwania

## ✅ SPRAWDŹ CZY WSZYSTKO DZIAŁA

Po wykonaniu wszystkich kroków:
1. **GitHub:** Powinieneś mieć repozytorium `pos-system` z kodem
2. **Vercel:** Powinieneś mieć projekt `pos-system-backend` w trakcie wdrażania
3. **URL:** Po wdrożeniu otrzymasz URL typu `https://pos-system-backend-xxx.vercel.app`

## 📱 NASTĘPNE KROKI

Po udanym wdrożeniu:
1. Połącz bazę danych PostgreSQL z projektem
2. Uruchom migracje Prisma
3. Przetestuj API
4. Wdróż frontend

**Gotowy do rozpoczęcia? Zacznij od Kroku 1!**

