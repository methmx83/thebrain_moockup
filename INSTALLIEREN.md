# ENGRAMM lokal installieren

Du hast eine Datei namens **`Workspace.tar`** heruntergeladen? Perfekt — das **ist** das
komplette ENGRAMM-Projekt. Diese Umgebung packt Downloads als Tar-Archiv; es fehlen nur noch
zwei Schritte.

---

## 1 · Entpacken

**Windows (PowerShell oder Eingabeaufforderung):**
```powershell
tar -xf Workspace.tar
```
(`tar` ist seit Windows 10 eingebaut. Alternativ: Rechtsklick → Öffnen mit → 7-Zip/WinRAR.)

**macOS:**
```bash
tar -xf Workspace.tar
```
(Oder einfach Doppelklick auf die Datei — die Archivverwaltung entpackt .tar von selbst.)

**Linux / WSL:**
```bash
tar -xf Workspace.tar
```

Danach liegt das Projekt in einem Ordner (z. B. `app/` oder direkt im aktuellen Verzeichnis).
Unsicher, was drin steckt? Ein Blick vorher:
```bash
tar -tf Workspace.tar | head -20
```

## 2 · Einrichten & Starten

```bash
cd <entpackter-ordner>     # z. B. cd app
npm install                # einmalig: lädt React, Vite, Tailwind
npm run dev                # startet den Dev-Server
```

→ Browser öffnen: **http://localhost:3000**

ENGRAMM läuft jetzt komplett lokal auf deinem Rechner. Keine Daten verlassen den Browser
(localStorage, Schlüssel `engramm:v1`).

---

## Voraussetzungen

- **Node.js ≥ 18** (empfohlen 20 LTS) — prüfen mit `node -v`, sonst von <https://nodejs.org> installieren.
- npm kommt mit Node automatisch mit.

## Gut zu wissen

- **`dist/index.html` nicht per Doppelklick öffnen** — die App braucht einen Server
  (`npm run dev` oder `npm run preview` nach `npm run build`).
- **Als Desktop-App:** In Chrome/Edge öffnen → Menü → „Als App installieren".
- **Gedächtnis sichern:** In der App unten → „Gehirn sichern" exportiert alle Spuren als
  JSON — praktisch für Backups oder den Umzug auf einen anderen Rechner/Browser.
- **In-App-Anleitung:** Taste `?` öffnet die komplette Funktions- & Betriebsanleitung.

## Windows: Nach dem Entpacken liegt nur eine Datei „workspace" ohne Endung da

Kein Fehler — der Download ist **doppelt gepackt**: In der `Workspace.tar` steckt ein zweites,
komprimiertes Archiv, das Windows ohne Endung ablegt. So löst du es (PowerShell, im Ordner der
Datei `workspace`):

```powershell
# 1. Endung wiederherstellen und erneut entpacken:
Rename-Item workspace workspace.tar.gz
tar -xf workspace.tar.gz
```

Danach enthält der entpackte Ordner die Projektdateien (`package.json`, `src/`, `README.md` …) —
weiter mit `npm install` und `npm run dev`.

**Falls das nicht klappt**, kurz prüfen, was die Datei wirklich ist:

```powershell
Format-Hex workspace | Select-Object -First 1
```

| Erste Bytes | Bedeutung | Befehl |
|-------------|-----------|--------|
| `1F 8B` | gzip-komprimiertes Tar | wie oben: `Rename-Item workspace workspace.tar.gz` → `tar -xf workspace.tar.gz` |
| `50 4B` | ZIP-Archiv | `Rename-Item workspace workspace.zip` → `Expand-Archive workspace.zip -DestinationPath .` |
| sonst (Text/`ustar`) | normales Tar | `tar -xf workspace` — funktioniert auch ganz ohne Endung |

Und ganz wichtig: Steht `workspace` im Explorer als **Ordner** (gelbes Symbol) da, ist alles
schon gut — einfach hineingehen; liegen dort `package.json` und `src/`, direkt mit
`npm install` weitermachen.

## Wenn etwas klemmt

| Problem | Lösung |
|---------|--------|
| Nach Entpacken nur `workspace` ohne Endung | Doppelt gepackt — siehe Abschnitt darüber |
| `EADDRINUSE: port 3000` | Der Port ist belegt — anderen Prozess beenden oder Port 3000 in `vite.config.js` ändern |
| `tar` unbekannt (Windows) | PowerShell statt cmd verwenden oder 7-Zip nehmen |
| `npm install` bricht ab | `node -v` prüfen (≥ 18), Ordner `node_modules` löschen, erneut `npm install` |

Mehr Details stehen in der `README.md` im Projekt.

*ENGRAMM · Hippocampus → Neocortex · lokal, serverlos, dein Gehirn*
