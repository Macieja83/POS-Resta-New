# 🔧 Rozwiązywanie problemów z Git w Cursor

## Problem: "Git: Initialize Repository" nie działa

### Sprawdź 1: Czy Git jest zainstalowany

1. **Otwórz terminal w Cursor:**
   - `Terminal` → `New Terminal`
   - Lub naciśnij `Ctrl + Shift + `` (backtick)

2. **Sprawdź czy Git działa:**
   ```bash
   git --version
   ```

3. **Jeśli błąd "git is not recognized":**
   - Pobierz Git z [git-scm.com](https://git-scm.com/download/win)
   - Zainstaluj z domyślnymi ustawieniami
   - Restart Cursor

### Sprawdź 2: Czy masz rozszerzenie Git

1. **Otwórz Extensions:**
   - Kliknij ikonę `Extensions` w lewym panelu
   - Lub naciśnij `Ctrl + Shift + X`

2. **Wyszukaj:**
   - Wpisz: `Git`
   - Zainstaluj `Git` (oficjalne rozszerzenie Microsoft)

3. **Restart Cursor:**
   - Zamknij i otwórz ponownie Cursor

### Sprawdź 3: Alternatywne sposoby

#### Opcja A: Przez terminal w Cursor

1. **Otwórz terminal:**
   - `Terminal` → `New Terminal`

2. **Wpisz komendy:**
   ```bash
   cd C:\Users\mmaci\Desktop\pos-system
   git init
   git add .
   git commit -m "Initial commit - POS System"
   ```

3. **Sprawdź status:**
   ```bash
   git status
   ```

#### Opcja B: Przez Command Palette inaczej

1. **Naciśnij `Ctrl + Shift + P`**
2. **Wpisz:** `Git: Initialize Repository`
3. **Jeśli nie działa, spróbuj:**
   - `Git: Initialize Repository in Workspace`
   - `Git: Initialize Repository in Empty Workspace`

#### Opcja C: Przez Source Control panel

1. **Kliknij ikonę Source Control** (rozgałęzione drzewo)
2. **Jeśli widzisz "Initialize Repository":**
   - Kliknij `Initialize Repository`
3. **Jeśli nie widzisz:**
   - Sprawdź czy folder jest otwarty w Cursor

### Sprawdź 4: Czy folder jest poprawnie otwarty

1. **Sprawdź czy w lewym panelu widzisz pliki:**
   - `apps/`
   - `packages/`
   - `package.json`
   - itd.

2. **Jeśli nie widzisz:**
   - `File` → `Open Folder`
   - Wybierz: `C:\Users\mmaci\Desktop\pos-system`

### Sprawdź 5: Zainstaluj Git przez Chocolatey (jeśli masz)

1. **Otwórz PowerShell jako Administrator**
2. **Wpisz:**
   ```powershell
   choco install git
   ```

### Sprawdź 6: Ręczna instalacja Git

1. **Pobierz Git:**
   - Przejdź na [git-scm.com](https://git-scm.com/download/win)
   - Pobierz "64-bit Git for Windows Setup"

2. **Zainstaluj:**
   - Uruchom installer
   - Kliknij "Next" przez wszystkie kroki
   - Zostaw domyślne ustawienia

3. **Restart Cursor:**
   - Zamknij Cursor
   - Otwórz ponownie
   - Spróbuj ponownie `Git: Initialize Repository`

## Alternatywa: Użyj GitHub Desktop

### 1. Pobierz GitHub Desktop
- Przejdź na [desktop.github.com](https://desktop.github.com)
- Pobierz i zainstaluj

### 2. Zaloguj się
- Otwórz GitHub Desktop
- Zaloguj się do swojego konta GitHub

### 3. Utwórz repozytorium
- Kliknij `Create a new repository on your hard drive`
- **Name:** `pos-system`
- **Local path:** `C:\Users\mmaci\Desktop\pos-system`
- Kliknij `Create repository`

### 4. Opublikuj
- Dodaj opis: `Initial commit - POS System`
- Kliknij `Commit to main`
- Kliknij `Publish repository`

## Sprawdź czy działa

Po wykonaniu którejkolwiek z opcji:

1. **Sprawdź w terminalu:**
   ```bash
   git status
   ```

2. **Powinieneś zobaczyć:**
   ```
   On branch main
   nothing to commit, working tree clean
   ```

3. **Sprawdź na GitHub:**
   - Przejdź na [github.com](https://github.com)
   - Sprawdź czy masz repozytorium `pos-system`

## 🎯 Rekomendacja

**Zacznij od Sprawdź 1** - sprawdź czy Git jest zainstalowany. To najczęstszy problem.

Jeśli nadal nie działa, użyj **GitHub Desktop** - to najłatwiejsze rozwiązanie.

