#!/bin/bash

# Clean Git Setup Script for Visual Nostr Feed
echo "🧹 Setting up clean Git repository..."

# Remove any existing git repository
rm -rf .git

# Initialize fresh repository
git init

# Add all files
git add .

# Create initial commit
git commit -m "🎨 Initial commit: Visual Nostr Discovery Feed

✨ Features:
- Dual-layout system (Fullscreen + Slider mode)
- AI-powered image categorization game
- Real-time Nostr feed integration
- Drag & drop functionality
- 3D layering and smart positioning
- Server-sent events for live updates

🏗️ Tech Stack:
- Bun runtime + Server-side JSX (KitaJS)
- Hypermedia-first architecture
- Vanilla CSS with 3D transforms
- Nostr protocol integration

🎯 Ready for production deployment!"

# Set main branch
git branch -M main

echo "✅ Git repository initialized successfully!"
echo "📝 Next steps:"
echo "   1. Create repository on GitHub: visual-nostr-feed"
echo "   2. git remote add origin git@github.com:bencoin21/visual-nostr-feed.git"
echo "   3. git push -u origin main"
