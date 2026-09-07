# ENGRAMM — Langzeitgedächtnis für Claude Code

Ein gehirnbasiertes Gedächtnis-System: Hippocampus zum Erfassen, Ebbinghaus-Vergessenskurve,
Abruf-Potentierung (Spaced Repetition), nächtliche Schlaf-Konsolidierung und ein assoziatives
Netzwerk — mit Export der stärksten Erinnerungen als `CLAUDE.md` für deine Projekte.

Läuft komplett lokal im Browser. Kein Server, kein Konto, kein Upload.

> **Projekt als `Workspace.tar` heruntergeladen?** Das Archiv **ist** das komplette Projekt —
> zuerst entpacken, dann hier weitermachen. Die Kurzanleitung dafür steht in
> [`INSTALLIEREN.md`](./INSTALLIEREN.md) (`tar -xf Workspace.tar` → `npm install` → `npm run dev`).

---

## 1 · Voraussetzungen

| Werkzeug | Version | Prüfung |
|----------|---------|---------|
| Node.js  | ≥ 18 (empfohlen 20 LTS) | `node -v` |
| npm      | kommt mit Node | `npm -v` |

Falls `node -v` fehlschlägt: Node von <https://nodejs.org> (LTS) installieren —
unter Windows/macOS alternativ via Homebrew (`brew install node`) oder `winget install OpenJS.NodeJS.LTS`.

## 2 · Installation (einmalig)

```bash
# 1. In den Projektordner wechseln
cd pfad/zum/projekt

# 2. Abhängigkeiten installieren
npm install
```

Das war's — `npm install` lädt React, Vite und Tailwind in `node_modules/`.

## 3 · Starten

### Entwicklungsmodus (empfohlen für den Alltag)

```bash
npm run dev
```

→ App öffnen unter **http://localhost:3000**
(der Port ist in `vite.config.js` fest auf 3000 konfiguriert; Hot-Reload bei Code-Änderungen inklusive)

### Produktionsmodus (optimierter Build)

```bash
npm run build     # erzeugt den Ordner dist/
npm run preview   # serviert dist/ lokal
```

→ App öffnen unter **http://localhost:4173**

> **Wichtig:** `dist/index.html` **nicht** per Doppelklick öffnen — die Asset-Pfade sind
> absolut und brauchen einen Server. `npm run preview` (oder jeder andere statische Server,
> z. B. `npx serve dist`) ist der richtige Weg.

### ENGRAMM dauerhaft griffbereit haben

ENGRAMM ist eine lokale Web-App. Zwei bequeme Wege:

- **Lesezeichen + laufender Server:** `npm run dev` in einem Terminal offen lassen, Lesezeichen auf `http://localhost:3000`.
- **Als „Desktop-App":** In Chrome/Edge die Seite öffnen → Menü → *„Als App installieren"* /
  *„Installieren"*. Danach startet ENGRAMM aus dem Dock/Startmenü wie ein eigenes Programm
  (setzt den laufenden Dev-Server oder Preview-Server voraus).

## 4 · Wo deine Daten leben

- **Speicher:** `localStorage` deines Browsers, Schlüssel `engramm:v1`
  (Spuren, Synapsen, Zeitraffer-Offset, Schlafzyklen — alles, automatisch bei jeder Änderung).
- **Bindung:** Daten gehören zu *Browser + Adresse*. `http://localhost:3000` im Chrome hat ein
  anderes Gedächtnis als `http://localhost:4173` oder ein anderer Browser. Das ist Absicht —
  so kannst du z. B. getrennte Gehirne pro Rechner pflegen.
- **Sichern & Umziehen:** Unten in der App gibt es **„Gehirn sichern"** (lädt eine
  `engramm-gehirn-YYYY-MM-DD.json`) und **„Wiederherstellen"** (liest sie wieder ein).
  Damit ziehst du dein Gedächtnis auf einen anderen Rechner, Browser oder ein Backup um.
- **Privatmodus:** Dort gilt die Erinnerung nur für die Sitzung — danach: Amnesie.

## 5 · Anbindung an Claude Code

Der Tab **„CLAUDE.md"** kuratiert die stärksten Spuren (Gewichtung × Retention) und erzeugt:

```markdown
- [Semantisch · R 0,84 · ★★★★★] Deploy erwartet Node 20 #build #deploy
```

- **`CLAUDE.md`** → ins **Projekt-Root** legen: Claude Code liest sie bei jedem Start automatisch.
- **`memory.md`** → für `~/.claude/memory.md` oder eigene Loader-Skripte.
- Die Token-Schätzung im Export-Panel hilft, das Context-Budget zu planen.

Empfohlener Rhythmus: laufend erfassen · täglich kritische Spuren abrufen · abends ein
Schlafzyklus · wöchentlich frisch exportieren.

## 6 · Tastaturbefehle

| Taste | Funktion |
|-------|----------|
| `/`   | Suche in den Gedächtnisspuren |
| `?`   | Funktions- & Betriebsanleitung öffnen |
| `Esc` | Anleitung schließen |

## 7 · Projektstruktur

```
src/
  lib/
    engine.ts    Speicher-Engine: Ebbinghaus, Potenzierung, Konsolidierung, Export
    seed.ts      12 vorcodierte Beispiel-Erinnerungen
    store.ts     State + localStorage-Persistenz + Aktionen
  components/
    App-Panel-Komponenten (Hippocampus, Cortex-Netzwerk, Kurven, Export, Anleitung …)
```

## 8 · Fehlerbehebung

| Problem | Lösung |
|---------|--------|
| `EADDRINUSE: port 3000` | Port belegt: anderen Prozess beenden (der Port ist per `strictPort` festgelegt) |
| `npm install` bricht ab | `node -v` prüfen (≥ 18), dann `node_modules` löschen und neu installieren |
| Daten nach Neustart weg | War der Browser im Privatmodus? Sonst prüfen, ob localStorage für die Seite erlaubt ist |
| Altes Gedächtnis stört | Fußbereich → „Cortex leeren" (zweistufige Sicherheitsabfrage) oder „Beispiele laden" |
| Export zu lang | Regler „Max. Einträge" reduzieren (10–15), Haken „Verblasste Spuren" raus |

---

*ENGRAMM · Hippocampus → Neocortex · lokal, serverlos, dein Gehirn*
