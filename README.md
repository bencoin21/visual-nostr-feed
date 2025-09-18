# 🎨 Visual Nostr Discovery Feed

Ein interaktiver, visueller Nostr-Client mit innovativem Dual-Layout und KI-gestützter Bildkategorisierung.

## ✨ Features

### 🖼️ **Dual-Layout System**
- **Fullscreen Mode**: Kategorisierungs-Spiel mit Drag & Drop
- **Slider Mode**: Horizontaler Bildstream mit Hover-Preview

### 🤖 **KI-Bildkategorisierung**
- Automatische Kategorisierung: Früchte/Natur, News, Memes, NSFW
- Gamification: Nutzer ziehen Bilder in die richtige Kategorie
- Farbkodierte Rahmen je nach Kategorie

### 🎮 **Interaktive Features**
- **Drag & Drop**: Bilder zwischen Kategorien verschieben
- **3D-Layering**: Tiefeneffekte mit Z-Index-Management
- **Smart Positioning**: Intelligente Platzierung mit minimaler Überlappung
- **Hover Effects**: Preview-Modus im Slider

### 🔄 **Real-time Updates**
- **Server-Sent Events (SSE)**: Live-Updates ohne Polling
- **Circular Cache**: 400-Bild-Rotation auf Server-Seite
- **Browser Cache**: Persistente Bilder zwischen Layout-Wechseln

## 🚀 Schnellstart

```bash
# Dependencies installieren
bun install

# Development Server starten
bun run dev

# Öffnen: http://localhost:4420
```

## 🏗️ Architektur

### **Hypermedia-First Ansatz**
- **Backend**: Bun.serve + Server-Side JSX (KitaJS)
- **Frontend**: Minimales JavaScript für Interaktivität
- **Real-time**: Server-Sent Events für Live-Updates
- **Progressive Enhancement**: Funktioniert mit und ohne JavaScript

### **Tech Stack**
- **Runtime**: Bun (statt Node.js)
- **Rendering**: Server-Side JSX mit `@kitajs/html`
- **Styling**: Vanilla CSS mit 3D-Transforms
- **Real-time**: Native SSE (Server-Sent Events)
- **Protocol**: Nostr für dezentrale Social Media Feeds

## 📁 Projektstruktur

```
├── index.tsx              # Bun Server + Routing
├── src/
│   ├── views.tsx          # JSX Components + Client-Side Logic
│   ├── nostr-service.ts   # Nostr Protocol Integration
│   └── image-classifier.ts # KI-Bildkategorisierung
├── public/                # Static Assets
├── package.json           # Bun Dependencies
└── tsconfig.json         # TypeScript Config
```

## 🎯 Layout Modi

### **Fullscreen Mode** (Standard)
- Bilder erscheinen in zufälligen Kategorien
- Nutzer zieht sie in die richtige Kategorie (Spiel)
- Farbkodierte Rahmen zeigen Kategorie-Zugehörigkeit
- 3D-Stacking mit Hover-Effekten

### **Slider Mode**
- 80% oberer Bereich: Hover-Preview (Vollbild)
- 20% unterer Bereich: Horizontaler Bildstream
- Automatisches Scrollen (pausiert bei Hover)
- Manuelle Scroll-Kontrolle mit Maus

## ⚙️ Konfiguration

### **Nostr Relays**
Standardmäßig konfigurierte Relays in `src/nostr-service.ts`:
- `wss://relay.damus.io`
- `wss://nos.lol`
- `wss://relay.nostr.band`

### **Kategorien**
Bildkategorien in `src/image-classifier.ts`:
- 🍎 **Fruits/Nature**: Natürliche Inhalte
- 📰 **News**: Nachrichten und aktuelle Ereignisse  
- 😂 **Memes**: Humoristische Inhalte
- 🔞 **NSFW**: Erwachsenen-Inhalte

### **Performance Settings**
- **Cache-Größe**: 400 Bilder (Server), 150 Bilder (Browser)
- **Loading-Speed**: 2-4 Bilder/Sekunde im Slider-Modus
- **Auto-Scroll**: 4 Sekunden Intervall

## 🛠️ Development

### **Hot Reload**
```bash
bun run dev --watch
```

### **Production Build**
```bash
bun run build
bun start
```

### **Debugging**
- Browser DevTools: Client-Side Logs
- Terminal: Server-Side Logs + SSE Events
- Network Tab: SSE Stream Monitoring

## 🌐 Deployment

Optimiert für Linux-Server mit:
- **Systemd Service** für Prozess-Management
- **Nginx Reverse Proxy** für SSL + Performance
- **Firewall-Konfiguration** für Sicherheit

Siehe Deployment-Guide für detaillierte Anweisungen.

## 🎨 Design Prinzipien

### **Hypermedia-Driven**
- Server rendert HTML, Client bleibt "dumm"
- State und Logik leben server-seitig
- Progressive Enhancement

### **Performance-First**
- Minimales JavaScript Bundle
- Effiziente 3D CSS-Transforms
- Smart Caching-Strategien

### **User Experience**
- Intuitive Drag & Drop Interaktionen
- Flüssige Animationen und Übergänge
- Responsive Design für alle Bildschirmgrößen

---

**Ein moderner Nostr-Client mit klassischen Hypermedia-Prinzipien** 🚀

Gebaut mit ❤️ und Bun