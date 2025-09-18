# 🎨 Visual Nostr Discovery Feed

An interactive, visual Nostr client with innovative dual-layout and AI-powered image categorization.

## ✨ Features

### 🖼️ **Dual-Layout System**
- **Fullscreen Mode**: Categorization game with drag & drop
- **Slider Mode**: Horizontal image stream with hover preview

### 🤖 **AI Image Categorization**
- Automatic categorization: Fruits/Nature, News, Memes, NSFW
- Gamification: Users drag images to the correct category
- Color-coded frames based on category

### 🎮 **Interactive Features**
- **Drag & Drop**: Move images between categories
- **3D Layering**: Depth effects with Z-index management
- **Smart Positioning**: Intelligent placement with minimal overlap
- **Hover Effects**: Preview mode in slider

### 🔄 **Real-time Updates**
- **Server-Sent Events (SSE)**: Live updates without polling
- **Circular Cache**: 400-image rotation on server side
- **Browser Cache**: Persistent images between layout switches

## 🚀 Quick Start

```bash
# Install dependencies
bun install

# Start development server
bun run dev

# Open: http://localhost:4420
```

## 🏗️ Architecture

### **Hypermedia-First Approach**
- **Backend**: Bun.serve + Server-Side JSX (KitaJS)
- **Frontend**: Minimal JavaScript for interactivity
- **Real-time**: Server-Sent Events for live updates
- **Progressive Enhancement**: Works with and without JavaScript

### **Tech Stack**
- **Runtime**: Bun (instead of Node.js)
- **Rendering**: Server-Side JSX with `@kitajs/html`
- **Styling**: Vanilla CSS with 3D transforms
- **Real-time**: Native SSE (Server-Sent Events)
- **Protocol**: Nostr for decentralized social media feeds

## 📁 Project Structure

```
├── index.tsx              # Bun Server + Routing
├── src/
│   ├── views.tsx          # JSX Components + Client-Side Logic
│   ├── nostr-service.ts   # Nostr Protocol Integration
│   └── image-classifier.ts # AI Image Categorization
├── public/                # Static Assets
├── package.json           # Bun Dependencies
└── tsconfig.json         # TypeScript Config
```

## 🎯 Layout Modes

### **Fullscreen Mode** (Default)
- Images appear in random categories
- Users drag them to the correct category (game)
- Color-coded frames show category membership
- 3D stacking with hover effects

### **Slider Mode**
- 80% upper area: Hover preview (fullscreen)
- 20% lower area: Horizontal image stream
- Auto-scrolling (pauses on hover)
- Manual scroll control with mouse

## ⚙️ Configuration

### **Nostr Relays**
Default configured relays in `src/nostr-service.ts`:
- `wss://relay.damus.io`
- `wss://nos.lol`
- `wss://relay.nostr.band`

### **Categories**
Image categories in `src/image-classifier.ts`:
- 🍎 **Fruits/Nature**: Natural content
- 📰 **News**: News and current events  
- 😂 **Memes**: Humorous content
- 🔞 **NSFW**: Adult content

### **Performance Settings**
- **Cache Size**: 400 images (server), 150 images (browser)
- **Loading Speed**: 2-4 images/second in slider mode
- **Auto-Scroll**: 4 second interval

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
- Browser DevTools: Client-side logs
- Terminal: Server-side logs + SSE events
- Network Tab: SSE stream monitoring

## 🌐 Deployment

Optimized for Linux servers with:
- **Systemd Service** for process management
- **Nginx Reverse Proxy** for SSL + performance
- **Firewall Configuration** for security

See deployment guide for detailed instructions.

## 🎨 Design Principles

### **Hypermedia-Driven**
- Server renders HTML, client stays "dumb"
- State and logic live server-side
- Progressive enhancement

### **Performance-First**
- Minimal JavaScript bundle
- Efficient 3D CSS transforms
- Smart caching strategies

### **User Experience**
- Intuitive drag & drop interactions
- Smooth animations and transitions
- Responsive design for all screen sizes

---

**A modern Nostr client with classic hypermedia principles** 🚀

Built with ❤️ and Bun