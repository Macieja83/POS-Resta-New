# 📤 Instrukcje dodania folderu `apps/` do GitHub

## ✅ Folder `apps/` istnieje lokalnie!

Sprawdziłem - folder `apps/` z całym kodem **jest na Twoim komputerze**.

Problem: **nie został przesłany do GitHub**.

---

## 🔧 ROZWIĄZANIE: Użyj GitHub Desktop

### **KROK 1: Otwórz GitHub Desktop**

1. **Otwórz GitHub Desktop**
2. **Sprawdź czy jesteś w repozytorium:** `pos-system`
3. **Kliknij "Changes"** (lewa strona)

### **KROK 2: Sprawdź czy widzisz folder `apps/`**

**W sekcji "Changes" powinieneś zobaczyć:**
- ✅ Folder `apps/` z plikami
- ✅ Setki plików do dodania

**Jeśli NIE widzisz żadnych zmian:**
- Kliknij **Repository → Show in Explorer**
- Sprawdź czy folder `apps/` tam jest
- Jeśli NIE MA - znaczy że repozytorium jest w innym miejscu!

### **KROK 3: Zacommituj wszystko**

1. **Zaznacz wszystkie pliki** (powinny być zaznaczone domyślnie)
2. **Wpisz commit message:** `Add apps folder with backend and frontend`
3. **Kliknij "Commit to main"**

### **KROK 4: Push do GitHub**

1. **Kliknij "Push origin"** (u góry)
2. **Czekaj na zakończenie** (może potrwać 1-2 minuty)
3. **Sprawdź GitHub** → folder `apps/` powinien być widoczny

---

## ❓ JEŚLI NADAL NIE DZIAŁA:

**Możliwe że repozytorium GitHub Desktop jest w INNYM miejscu niż Twój projekt!**

### **Sprawdź gdzie jest repozytorium:**
1. **GitHub Desktop → Repository → Show in Explorer**
2. **Porównaj ścieżkę** z `C:\Users\mmaci\Desktop\pos-system`

**Jeśli to inne miejsce:**
1. **Zamknij GitHub Desktop**
2. **Usuń folder `.git`** z `C:\Users\mmaci\Desktop\pos-system`
3. **GitHub Desktop → File → Add Local Repository**
4. **Wybierz:** `C:\Users\mmaci\Desktop\pos-system`
5. **Utwórz nowe repozytorium** w tym miejscu
6. **Zacommituj i opublikuj ponownie**

---

## 📋 CHECKLIST:

- [ ] Otwórz GitHub Desktop
- [ ] Sprawdź lokalizację repozytorium
- [ ] Zobacz czy folder `apps/` jest w Changes
- [ ] Zacommituj wszystkie pliki
- [ ] Push do GitHub
- [ ] Sprawdź GitHub.com czy folder `apps/` jest widoczny



