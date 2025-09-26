# 🎬 Hypermedia Nostr Experience

A complete hypermedia application for Nostr with AI content filtering, smooth media playback, and professional timeline controls.

## ✨ Features

### 🎥 **Complete Media Experience**
- **Playable videos**: Integrated YouTube, HTML5, and Spotify players
- **Audio playback**: Click-to-play audio with embedded controls
- **Document preview**: PDF and document viewers with thumbnails
- **Link expansion**: Smart link previews with metadata
- **Smooth loading**: Fade-in animations prevent flickering and layout jumps

### 🛡️ **AI Content Filtering**
- **NSFWJS integration**: Real-time image classification for content safety
- **Age rating system**: FSK/USK ratings (0/6/12/16/18+) with color-coded overlays
- **Category detection**: Neutral, Drawing, Sexy, Porn, Hentai classification
- **General topics**: Food, Animals, Sports, Vehicles, Nature, Technology, Fashion, Architecture
- **Smart filtering**: URL-based instant classification with background AI processing
- **Click-to-reveal**: Blur/overlay censoring with user confirmation

### 🏷️ **Smart Classification Tags**
- **Safety tags**: Color-coded content safety indicators on every image
- **Topic tags**: Emoji-coded general topic classification
- **Confidence indicators**: AI confidence scores and detection methods
- **Real-time display**: Instant tag updates as images load
- **Persistent settings**: Filter preferences saved across sessions

### 🕰️ **Professional Timeline**
- **Video editor UI**: Professional gradients, shadows, and smooth animations
- **Time machine**: Store and navigate through 10,000+ media items with timestamps
- **User galleries**: Dedicated pages showing all media from specific users
- **Infinite scroll**: Load more content from Nostr network with pagination
- **Persistent windows**: Custom time windows remembered across sessions

### 🎮 **User Interaction**
- **HEART buttons**: Like posts with persistent tracking
- **SHOW MORE**: Navigate to user-specific media galleries
- **Click navigation**: Jump to any time period on the timeline
- **Handle dragging**: Adjust timespan start/end times precisely
- **Infinite scroll**: Load more content seamlessly as you scroll
- **Filter controls**: Toggle content filters with visual feedback

### 🌊 **Smooth Performance**
- **Fade-in animations**: Elegant image loading without flickering
- **Layout stability**: Pre-calculated dimensions prevent layout jumps
- **Debounced reflow**: Smooth masonry layout recalculation
- **Hardware acceleration**: GPU-optimized transitions and animations
- **Background processing**: AI classification doesn't block the UI

## 🚀 Quick Start

```bash
# Install dependencies
bun install

# Start development server
bun run dev

# Open: http://localhost:4420
```

## 🎮 How to Use

### **Basic Navigation**
1. **Default view**: Shows latest 1-hour of images with "🟢 LIVE" indicator
2. **Click timeline**: Jump to any time period instantly
3. **Drag timeline**: Smooth scrubbing through time periods
4. **Click NOW**: Return to latest images (green button)

### **Advanced Timeline Controls**
- **Left handle**: Drag to adjust start time of viewing window
- **Right handle**: Drag to adjust end time of viewing window  
- **Center area**: Drag to move entire window left/right through time
- **Window sizing**: Create custom windows (30min, 2h, 4h, etc.)

### **Keyboard Shortcuts**
- `←` `→` **Move window**: Navigate left/right through time
- `Shift + ←` `→` **Extend window**: Adjust window size
- `Space` **Jump to NOW**: Return to latest images
- `Click image` **View post**: Open full Nostr post in new tab

### **Professional Workflow**
1. **Set custom window**: Drag handles to create your preferred timespan (e.g., 3 hours)
2. **Navigate history**: Click timeline or use keyboard to explore different periods
3. **Stable viewing**: Images stay fixed in your 3-hour window
4. **Timeline growth**: New images extend timeline to the right
5. **Return to present**: Click NOW to jump to latest (keeping your 3-hour window)

## 🏗️ Architecture

### **Modern Tech Stack**
- **Runtime**: Bun (high-performance JavaScript runtime)
- **Backend**: Server-side JSX with KitaJS for hypermedia responses
- **Frontend**: Minimal JavaScript with professional timeline controls
- **Storage**: JSON file-based persistence for images and window settings
- **Protocol**: Nostr for decentralized social media feeds

### **Time Machine System**
- **Image storage**: All images stored with precise timestamps
- **Window persistence**: Custom time windows saved across sessions
- **Real-time updates**: Timeline extends automatically with new content
- **Smart caching**: Circular cache system for optimal performance

## 📁 Project Structure

```
├── index.tsx                    # Main server + API routes
├── src/
│   ├── views.tsx               # UI components with smooth loading & AI tags
│   ├── nostr-service.ts        # Nostr protocol + multi-media processing
│   ├── time-machine.ts         # Multi-media time machine storage
│   ├── time-travel-ui.tsx      # Professional timeline UI components
│   ├── image-classifier.ts     # AI image categorization
│   └── config.ts              # Configuration settings
├── public/
│   ├── favicon.ico            # Site icon
│   └── static/
│       ├── content-filter.js  # NSFWJS content safety filtering
│       ├── general-filter.js  # General topic classification
│       └── fixi/             # Hypermedia enhancement library
├── time-machine-*.json        # Persistent multi-media storage
├── nostr-likes.json           # User likes tracking
└── README.md                  # This documentation
```

## 🔧 Configuration

Edit `src/config.ts` to adjust:
- **Performance settings**: Image loading speeds, batch sizes
- **Timeline behavior**: Window sizes, navigation sensitivity
- **Cache limits**: Maximum stored images, rotation intervals
- **Animation timings**: Transition speeds, fade durations

## 🎯 API Endpoints

### **Media & Posts**
- `GET /` - Main application with timeline and media feed
- `GET /nostr/post/:eventId` - View full post with playable media
- `GET /user/:pubkey` - User media gallery with infinite scroll
- `POST /api/like-post` - Like/unlike posts with persistent tracking
- `POST /api/user-media` - Search for more user media from Nostr network

### **Time Travel API**
- `POST /api/time-travel` - Navigate through time
  - `action: 'backwards'` - Move window back by specified minutes
  - `action: 'forwards'` - Move window forward by specified minutes
  - `action: 'now'` - Jump to latest images
  - `action: 'goto'` - Jump to specific timestamp
  - `action: 'set-window'` - Set custom time window

### **Time Machine Status**
- `GET /api/time-machine-status` - Get current timeline state
- `POST /api/time-machine-images` - Get images for specific time range

### **Content Filtering**
- Client-side JavaScript filtering with NSFWJS
- Real-time classification and tagging
- Persistent filter settings via localStorage

## 🎨 Visual Design

### **Professional Timeline**
- **Video editor styling**: Dark gradients with purple accents
- **3D depth effects**: Inset shadows and layered visual elements
- **Smooth animations**: Cubic-bezier transitions for professional feel
- **Interactive feedback**: Hover effects and visual state changes

### **Image Display**
- **Masonry layout**: Pinterest-style grid with optimal spacing
- **Category indicators**: Color-coded tags for image types
- **Smooth loading**: Staggered animations for new images
- **Responsive design**: Adapts to different screen sizes

## 🔄 How It Works

### **Timeline Behavior**
1. **Initial state**: Shows latest 1-hour window with "LIVE" indicator
2. **User interaction**: Drag handles to create custom window (e.g., 3 hours)
3. **Fixed window**: Your 3-hour window stays at the exact time range you set
4. **Timeline growth**: As new images arrive, timeline extends to the right
5. **Natural progression**: Your window appears to "move left" as time progresses
6. **Manual navigation**: Drag window right to see newer images

### **Image Storage**
- **Persistent storage**: All images saved with timestamps in JSON format
- **Smart caching**: Circular cache system maintains optimal performance
- **Event data**: Complete Nostr event information stored with each image
- **Category classification**: AI-powered image categorization and tagging

## 🚀 Advanced Features

### **Professional Controls**
- **Drag handles**: Precise timespan adjustment like video editing software
- **Visual timeline**: Waveform-style density visualization
- **Status indicators**: Clear feedback for current state and time position
- **Keyboard navigation**: Professional shortcuts for power users

### **Real-time Experience**
- **Immediate updates**: Images change instantly as you navigate
- **No page reloads**: Everything updates smoothly in real-time
- **Timeline extension**: Visual feedback when new content becomes available
- **Stable viewing**: Images don't change until you actively navigate

## 📊 Performance

- **Optimized storage**: Circular cache prevents memory bloat
- **Efficient updates**: Only loads images for current time window
- **Smart persistence**: Window settings and image data survive restarts
- **Responsive UI**: Professional animations without performance impact

## 🛠️ Development

### **Development Mode**
```bash
bun run dev    # Hot reload development server
```

### **Production Build**
```bash
bun run build # Build for production
```

### **Configuration**
```bash
bun run config # View configuration options
```

## 🎯 Use Cases

- **Content Discovery**: Explore Nostr images across different time periods
- **Historical Analysis**: See how image content changes over time
- **Timeline Browsing**: Navigate through your visual feed history
- **Post Exploration**: Click any image to view its full Nostr context
- **Time-based Filtering**: Focus on specific time periods of interest

## 🌟 Why This Project?

This image time machine demonstrates:
- **Professional UX**: Video editor-level timeline controls
- **Hypermedia architecture**: Server-side rendering with minimal JavaScript
- **Real-time capabilities**: Live updates without complex client-side state
- **Nostr integration**: Decentralized social media protocol support
- **Performance optimization**: Efficient caching and storage systems

Perfect for developers interested in:
- Modern web architecture patterns
- Professional timeline UI/UX design
- Nostr protocol integration
- Real-time web applications
- Hypermedia-driven development

---

**Built with Bun + KitaJS + Nostr Protocol** 🚀