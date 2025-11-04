# 🔗 Połączenie z GitHub - Krok po kroku

## Opcja 1: Przez Cursor (VS Code) - NAJŁATWIEJSZE

### 1. Otwórz Cursor
- Otwórz folder `C:\Users\mmaci\Desktop\pos-system` w Cursor

### 2. Zainicjalizuj Git
- W Cursor: `Ctrl + Shift + P`
- Wpisz: `Git: Initialize Repository`
- Wybierz folder projektu

### 3. Dodaj pliki do Git
- W Cursor: `Ctrl + Shift + P`
- Wpisz: `Git: Add All`
- Lub kliknij ikonę `+` przy plikach w Source Control

### 4. Zrób pierwszy commit
- W Cursor: `Ctrl + Shift + P`
- Wpisz: `Git: Commit`
- Wpisz wiadomość: `Initial commit - POS System`
- Kliknij `Ctrl + Enter`

### 5. Połącz z GitHub
- W Cursor: `Ctrl + Shift + P`
- Wpisz: `Git: Publish to GitHub`
- Wybierz:
  - **Repository name:** `pos-system`
  - **Visibility:** Private (lub Public)
  - **Description:** `Modern POS System with React and Node.js`

### 6. Opublikuj
- Kliknij **"Publish to GitHub"**
- Cursor automatycznie utworzy repozytorium i opublikuje kod

---

## Opcja 2: Zainstaluj Git i użyj terminala

### 1. Zainstaluj Git
- Pobierz z [git-scm.com](https://git-scm.com/download/win)
- Zainstaluj z domyślnymi ustawieniami

### 2. Skonfiguruj Git
```bash
git config --global user.name "Twoje Imię"
git config --global user.email "twoj@email.com"
```

### 3. Zainicjalizuj repozytorium
```bash
cd C:\Users\mmaci\Desktop\pos-system
git init
git add .
git commit -m "Initial commit - POS System"
```

### 4. Połącz z GitHub
- Przejdź na [github.com](https://github.com)
- Kliknij **"New repository"**
- Nazwa: `pos-system`
- Opis: `Modern POS System with React and Node.js`
- Kliknij **"Create repository"**

### 5. Opublikuj kod
```bash
git remote add origin https://github.com/TWOJ_USERNAME/pos-system.git
git branch -M main
git push -u origin main
```

---

## Opcja 3: Przez GitHub Desktop

### 1. Pobierz GitHub Desktop
- Pobierz z [desktop.github.com](https://desktop.github.com)

### 2. Zaloguj się
- Zaloguj się do swojego konta GitHub

### 3. Utwórz repozytorium
- Kliknij **"Create a new repository"**
- Nazwa: `pos-system`
- Lokalna ścieżka: `C:\Users\mmaci\Desktop\pos-system`
- Kliknij **"Create repository"**

### 4. Opublikuj
- Dodaj opis: `Initial commit - POS System`
- Kliknij **"Commit to main"**
- Kliknij **"Publish repository"**

---

## Po opublikowaniu na GitHub

### 1. Przejdź na Vercel
- Otwórz [vercel.com](https://vercel.com)
- Kliknij **"New Project"**

### 2. Importuj z GitHub
- Znajdź repozytorium `pos-system`
- Kliknij **"Import"**

### 3. Skonfiguruj projekt
- **Project Name:** `pos-system-backend`
- **Root Directory:** `apps/backend`
- **Framework Preset:** Other
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`

### 4. Wdróż
- Kliknij **"Deploy"**

---

## 🎯 Rekomendacja

**Użyj Opcji 1 (Cursor)** - to najłatwiejsze i najbardziej zintegrowane rozwiązanie. Cursor ma wbudowane wsparcie dla Git i GitHub.

Po opublikowaniu na GitHub, Vercel będzie mógł automatycznie importować i wdrażać Twój projekt!

