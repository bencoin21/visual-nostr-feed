# 🏗️ Hypermedia Nostr Experience Architecture

## 📁 Project Structure

```
hypermedia-starter/
├── index.tsx                        # Main server + API routes
├── package.json                     # Dependencies and scripts  
├── tsconfig.json                   # TypeScript configuration
├── README.md                       # User documentation
├── ARCHITECTURE.md                 # This file - technical documentation
├── FEATURES.md                     # Complete feature documentation
├── SUMMARY.md                      # Project summary
├── bun.lock                        # Dependency lock file
├── nostr-likes.json                # User likes tracking
├── time-machine-*.json             # Multi-media storage files
├── src/
│   ├── views.tsx                  # UI components with AI tags & smooth loading
│   ├── nostr-service.ts           # Nostr protocol + multi-media processing
│   ├── time-machine.ts            # Multi-media time machine storage
│   ├── time-travel-ui.tsx         # Professional timeline UI components
│   ├── image-classifier.ts        # AI image categorization
│   └── config.ts                  # Configuration settings
└── public/
    ├── favicon.ico                # Site icon
    └── static/
        ├── content-filter.js      # NSFWJS content safety filtering
        ├── general-filter.js      # General topic classification
        └── fixi/                  # Hypermedia enhancement library
            ├── fixi.js           # Core hypermedia functionality
            └── extensions.js     # SSE and other extensions
```

## 🎯 Core Components

### **Multi-Media Time Machine** (`src/time-machine.ts`)
- **Purpose**: Store and manage all media types with timestamps
- **Storage**: Manages 10,000+ items (images, videos, audio, documents, links)
- **Window management**: Tracks user-defined time windows
- **Persistence**: Multi-file JSON storage for different media types

### **Enhanced Views** (`src/views.tsx`)
- **Purpose**: Complete UI with AI classification and smooth loading
- **Components**: ModernDiscoveryFeed, NostrPostDetail, UserMediaGallery
- **Features**: Playable media, AI tags, smooth animations, filter controls
- **Performance**: Fade-in loading, layout stability, hardware acceleration

### **Advanced Nostr Service** (`src/nostr-service.ts`)
- **Purpose**: Complete Nostr protocol integration with multi-media support
- **Features**: Real-time events, media classification, user search
- **Multi-media**: Processes images, videos, audio, documents, links
- **User galleries**: Search and pagination for user-specific content

### **Content Filtering** (`public/static/content-filter.js`)
- **Purpose**: AI-powered content safety filtering with NSFWJS
- **Features**: Age ratings (FSK 0/6/12/16/18), category detection
- **Performance**: Background processing, non-blocking UI
- **Persistence**: localStorage settings, cross-page functionality

### **General Classification** (`public/static/general-filter.js`)
- **Purpose**: General topic classification for content organization
- **Categories**: Food, Animals, Sports, Vehicles, Nature, Technology, Fashion, Architecture
- **Features**: URL-based instant classification, filter presets
- **UI Integration**: Color-coded tags, filter panels, persistent settings

## 🔄 Data Flow

### **Image Collection**
1. **Nostr events** received via WebSocket subscriptions
2. **Image extraction** from event content using regex
3. **AI classification** into categories (nature, food, tech, memes, art)
4. **Time machine storage** with precise timestamps
5. **Cache management** with circular buffer system

### **Timeline Navigation**
1. **User interaction** with professional timeline controls
2. **Time range calculation** based on drag position
3. **API request** to `/api/time-machine-images` or `/api/time-travel`
4. **Image filtering** by timestamp range
5. **Real-time UI update** without page reload

### **Post Access**
1. **Image click** triggers post URL navigation
2. **Event lookup** in current events or time machine storage
3. **Author info fetching** from Nostr profile metadata
4. **Post rendering** with full content and images

## 🚀 API Architecture

### **Main Routes**
- `GET /` - Main application with timeline and images
- `GET /nostr/post/:eventId` - Individual post detail pages
- `GET /api/time-machine-status` - Current timeline state
- `POST /api/time-travel` - Navigate through time
- `POST /api/time-machine-images` - Get images for time range

### **Real-time Updates**
- `GET /nostr/stream` - Server-Sent Events for live updates
- **SSE events**: New images automatically added to timeline
- **Timeline extension**: Grows to show new content available

## 🎨 UI/UX Architecture

### **Professional Timeline**
- **Video editor styling**: Dark gradients, professional shadows
- **Interactive elements**: Drag handles, hover effects, visual feedback
- **Waveform visualization**: Shows image density over time periods
- **Status indicators**: LIVE vs historical viewing states

### **Responsive Design**
- **Masonry layout**: Pinterest-style grid for optimal image display
- **Smooth animations**: Professional transitions and loading states
- **Keyboard navigation**: Professional shortcuts for power users
- **Mobile support**: Touch-friendly timeline interactions

## 🔧 Configuration System

### **Config Files**
- `src/config.ts` - Central configuration for timing and behavior
- **Performance profiles**: Relaxed, fast, and demo modes
- **Configurable settings**: Cache sizes, animation speeds, timeouts

### **Storage System**
- **JSON persistence**: File-based storage for reliability
- **Circular caching**: Prevents memory bloat with automatic rotation
- **Window persistence**: User preferences saved across sessions

## 🌟 Technical Highlights

### **Hypermedia-First Architecture**
- **Server-side rendering**: KitaJS for fast, SEO-friendly pages
- **Progressive enhancement**: Works with and without JavaScript
- **Minimal client-side state**: Server manages most application logic

### **Performance Optimizations**
- **Bun runtime**: High-performance JavaScript execution
- **Efficient caching**: Smart image storage and retrieval
- **Real-time updates**: SSE instead of polling for live data
- **Lazy loading**: Images load on demand for better performance

### **Professional UX**
- **Video editor paradigm**: Familiar timeline interaction model
- **Immediate feedback**: Real-time updates without page reloads
- **Persistent preferences**: User settings remembered across sessions
- **Keyboard workflow**: Professional shortcuts for power users

## 🔮 Future Enhancements

### **Potential Features**
- **Export functionality**: Save time periods as collections
- **Advanced filtering**: Filter by image category or content
- **Collaboration**: Share specific time periods with others
- **Analytics**: Image activity patterns and trends
- **Mobile app**: Native mobile version with timeline controls

### **Technical Improvements**
- **Database storage**: Scale beyond JSON files
- **CDN integration**: Faster image loading and caching
- **Advanced AI**: Better image classification and tagging
- **Real-time collaboration**: Multiple users on same timeline

---

**Built with modern web technologies for professional image time travel** 🚀
