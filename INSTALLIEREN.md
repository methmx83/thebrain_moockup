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

## Wenn etwas klemmt

| Problem | Lösung |
|---------|--------|
| `EADDRINUSE: port 3000` | Der Port ist belegt — anderen Prozess beenden oder Port 3000 in `vite.config.js` ändern |
| `tar` unbekannt (Windows) | PowerShell statt cmd verwenden oder 7-Zip nehmen |
| `npm install` bricht ab | `node -v` prüfen (≥ 18), Ordner `node_modules` löschen, erneut `npm install` |

Mehr Details stehen in der `README.md` im Projekt.

*ENGRAMM · Hippocampus → Neocortex · lokal, serverlos, dein Gehirn*
