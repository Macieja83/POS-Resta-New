# 🔍 Sprawdź połączenie Cursor z GitHub

## Metoda 1: Sprawdź przez Command Palette

1. **Otwórz Command Palette:**
   - Naciśnij `Ctrl + Shift + P`

2. **Wpisz i sprawdź:**
   - Wpisz: `GitHub: Sign in`
   - Jeśli widzisz opcję `GitHub: Sign in` - nie jesteś zalogowany
   - Jeśli widzisz `GitHub: Sign out` - jesteś zalogowany

3. **Sprawdź status:**
   - Wpisz: `GitHub: Show`
   - Powinieneś zobaczyć informacje o koncie

## Metoda 2: Sprawdź przez Source Control

1. **Otwórz Source Control:**
   - Kliknij ikonę `Source Control` (rozgałęzione drzewo) w lewym panelu
   - Lub naciśnij `Ctrl + Shift + G`

2. **Sprawdź czy widzisz:**
   - `Publish to GitHub` - jeśli nie jesteś zalogowany
   - `Sync Changes` - jeśli jesteś zalogowany

## Metoda 3: Sprawdź przez Settings

1. **Otwórz Settings:**
   - `File` → `Preferences` → `Settings`
   - Lub naciśnij `Ctrl + ,`

2. **Wyszukaj:**
   - Wpisz: `github`
   - Sprawdź ustawienia GitHub

## Metoda 4: Sprawdź przez Account

1. **Otwórz Command Palette:**
   - `Ctrl + Shift + P`

2. **Wpisz:**
   - `GitHub: Show`
   - Lub `GitHub: Sign in`

## Jeśli NIE jesteś zalogowany:

### Zaloguj się do GitHub:

1. **Otwórz Command Palette:**
   - `Ctrl + Shift + P`

2. **Wpisz:**
   - `GitHub: Sign in`

3. **Postępuj zgodnie z instrukcjami:**
   - Otworzy się przeglądarka
   - Zaloguj się do swojego konta GitHub
   - Autoryzuj Cursor
   - Wróć do Cursor

## Jeśli JESTEŚ zalogowany:

### Sprawdź czy możesz używać Git:

1. **Otwórz terminal:**
   - `Terminal` → `New Terminal`

2. **Sprawdź Git:**
   ```bash
   git --version
   ```

3. **Sprawdź status:**
   ```bash
   git status
   ```

## Alternatywa: Sprawdź przez GitHub Desktop

1. **Otwórz GitHub Desktop**
2. **Sprawdź czy jesteś zalogowany:**
   - W prawym górnym rogu powinien być Twój avatar
   - Jeśli nie, kliknij `Sign in`

## Sprawdź czy masz rozszerzenie Git

1. **Otwórz Extensions:**
   - Kliknij ikonę `Extensions` w lewym panelu
   - Lub naciśnij `Ctrl + Shift + X`

2. **Wyszukaj:**
   - `Git`
   - Sprawdź czy masz zainstalowane rozszerzenie Git

3. **Jeśli nie masz:**
   - Kliknij `Install` na rozszerzeniu Git

## Sprawdź czy masz rozszerzenie GitHub

1. **W Extensions wyszukaj:**
   - `GitHub`
   - Sprawdź czy masz zainstalowane rozszerzenie GitHub

2. **Jeśli nie masz:**
   - Kliknij `Install` na rozszerzeniu GitHub

## 🔧 Rozwiązywanie problemów

### Problem: "GitHub: Sign in" nie działa
**Rozwiązanie:**
- Sprawdź połączenie internetowe
- Restart Cursor
- Sprawdź czy masz rozszerzenie GitHub

### Problem: "git is not recognized"
**Rozwiązanie:**
- Zainstaluj Git z [git-scm.com](https://git-scm.com/download/win)
- Restart Cursor

### Problem: Nie widzę opcji GitHub
**Rozwiązanie:**
- Zainstaluj rozszerzenie GitHub
- Restart Cursor

## 🎯 Następne kroki

Po sprawdzeniu połączenia z GitHub:

1. **Jeśli jesteś zalogowany:** Przejdź do inicjalizacji Git
2. **Jeśli nie jesteś zalogowany:** Zaloguj się do GitHub
3. **Jeśli Git nie działa:** Zainstaluj Git

**Sprawdź teraz i daj mi znać co widzisz!**

