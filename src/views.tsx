// KitaJS HTML runtime is configured via tsconfig; no React on client
import { e } from "@kitajs/html";
import type { NostrFeedItem } from "./nostr-service.js";
import { IMAGE_CATEGORIES } from "./image-classifier.js";

export function Layout(props: { title?: string; children?: React.ReactNode }) {
  const { title = "Visual Nostr Feed", children } = props;
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{title}</title>
        <style>{`
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body { 
            background: #000000;
            min-height: 100vh;
            overflow: hidden;
            font-family: system-ui;
            margin: 0;
            padding: 0;
          }
          
          /* Layout Switcher - Enhanced visibility */
          .layout-switcher {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            display: flex;
            gap: 10px;
            background: rgba(0,0,0,0.7);
            padding: 8px;
            border-radius: 8px;
            border: 1px solid rgba(255,255,255,0.2);
          }
          
          .layout-btn {
            padding: 10px 20px;
            background: rgba(255,255,255,0.15);
            border: 1px solid rgba(255,255,255,0.4);
            color: white;
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.3s ease;
            font-size: 14px;
            font-weight: 600;
            text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
          }
          
          .layout-btn:hover {
            background: rgba(255,255,255,0.25);
            border-color: rgba(255,255,255,0.6);
            transform: scale(1.05);
          }
          
          .layout-btn.active {
            background: rgba(124, 58, 237, 0.9);
            border-color: rgba(124, 58, 237, 1);
            box-shadow: 0 4px 12px rgba(124, 58, 237, 0.4);
          }
          
          /* Main image display */
          .main-image {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            max-width: 90vw;
            max-height: 90vh;
            object-fit: contain;
            z-index: 100;
            border-radius: 8px;
            box-shadow: 0 20px 60px rgba(255,255,255,0.1);
            transition: all 3s cubic-bezier(0.4, 0, 0.2, 1);
          }
          
          /* Categorization game mode with drag & drop */
          .discovery-image {
            position: fixed;
            width: 90px;
            height: 90px;
            object-fit: cover;
            opacity: 0.8;
            pointer-events: all;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            border-radius: 8px;
            border: 3px solid rgba(255,255,255,0.6);
            cursor: grab;
            box-shadow: 0 3px 12px rgba(0,0,0,0.3);
            transform-style: preserve-3d;
            user-select: none;
          }
          
          /* Game feedback states */
          .discovery-image.correct {
            border: 3px solid #10b981 !important;
            box-shadow: 0 5px 15px #10b98140 !important;
            opacity: 1 !important;
          }
          
          .discovery-image.incorrect {
            border: 3px solid #ef4444 !important;
            box-shadow: 0 5px 15px #ef444440 !important;
            opacity: 0.6 !important;
          }
          
          .discovery-image.neutral {
            border: 3px solid #6b7280 !important;
            box-shadow: 0 3px 12px #6b728040 !important;
          }
          
          .discovery-image:hover {
            opacity: 1;
            transform: scale(1.8) translateZ(30px) rotateY(3deg);
            z-index: 1000 !important;
            box-shadow: 0 15px 35px rgba(0,0,0,0.4);
            border: 2px solid rgba(124, 58, 237, 0.9);
            filter: brightness(1.15) saturate(1.2);
            cursor: grab;
          }
          
          .discovery-image.dragging {
            cursor: grabbing;
            z-index: 2000 !important;
            transform: scale(1.2) translateZ(60px) rotateY(8deg);
            opacity: 0.9;
            filter: brightness(1.2) saturate(1.3);
            box-shadow: 0 25px 50px rgba(124, 58, 237, 0.3);
          }
          
          .discovery-image:active {
            cursor: grabbing;
          }
          
          /* 3D perspective container */
          body {
            perspective: 1200px;
            perspective-origin: 50% 50%;
          }
          
          /* Dense layered z-index system - more layers for denser stacking */
          .discovery-image.layer-1 { z-index: 10; }
          .discovery-image.layer-2 { z-index: 15; }
          .discovery-image.layer-3 { z-index: 20; }
          .discovery-image.layer-4 { z-index: 25; }
          .discovery-image.layer-5 { z-index: 30; }
          .discovery-image.layer-6 { z-index: 35; }
          .discovery-image.layer-7 { z-index: 40; }
          .discovery-image.layer-8 { z-index: 45; }
          
          /* Subtle rotation variants for organic stacking */
          .discovery-image.rotate-1 { transform: rotate(1deg); }
          .discovery-image.rotate-2 { transform: rotate(-1deg); }
          .discovery-image.rotate-3 { transform: rotate(0.5deg); }
          .discovery-image.rotate-4 { transform: rotate(-0.5deg); }
          .discovery-image.rotate-5 { transform: rotate(1.5deg); }
          .discovery-image.rotate-6 { transform: rotate(-1.5deg); }
          
          /* Dense size variants - allow more overlap */
          .discovery-image.size-small { 
            width: 70px; 
            height: 70px; 
            opacity: 0.6;
          }
          .discovery-image.size-medium { 
            width: 90px; 
            height: 90px; 
            opacity: 0.8;
          }
          .discovery-image.size-large { 
            width: 110px; 
            height: 110px; 
            opacity: 0.9;
          }
          
          /* Stack indicators */
          .discovery-image.in-stack::after {
            content: '';
            position: absolute;
            top: -2px;
            right: -2px;
            width: 12px;
            height: 12px;
            background: rgba(124, 58, 237, 0.8);
            border-radius: 50%;
            border: 1px solid white;
          }
          
          /* Slider Mode Styles */
          .slider-mode {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            z-index: 5;
          }
          
          .slider-mode.active {
            display: block;
          }
          
          .preview-area {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 80%;
            background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            border-bottom: 3px solid rgba(124, 58, 237, 0.3);
          }
          
          .preview-placeholder {
            color: rgba(255,255,255,0.3);
            font-size: 2rem;
            text-align: center;
            font-weight: 300;
            letter-spacing: 2px;
          }
          
          .preview-image {
            max-width: 95%;
            max-height: 95%;
            object-fit: contain;
            border-radius: 12px;
            box-shadow: 0 20px 60px rgba(124, 58, 237, 0.2);
            opacity: 0;
            transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
            transform: scale(0.95);
          }
          
          .preview-image.visible {
            opacity: 1;
            transform: scale(1);
          }
          
          .slider-container {
            position: absolute;
            bottom: 0;
            left: 0;
            width: 100%;
            height: 20%;
            background: linear-gradient(to top, #000 0%, #111 50%, #222 100%);
            overflow: hidden;
            border-top: 1px solid rgba(255,255,255,0.1);
          }
          
          .slider-strip {
            position: absolute;
            bottom: 15px;
            left: 0;
            height: calc(20vh - 30px);
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 0 20px;
            transition: transform 1.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            transform: translateX(0);
          }
          
          .slider-image {
            width: 100px;
            height: 100px;
            object-fit: cover;
            border-radius: 8px;
            border: 2px solid rgba(255,255,255,0.4);
            cursor: pointer;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            flex-shrink: 0;
            opacity: 0.8;
            box-shadow: 0 4px 12px rgba(0,0,0,0.4);
          }
          
          .slider-image:hover {
            border: 3px solid rgba(124, 58, 237, 1);
            transform: scale(1.15) translateY(-5px);
            opacity: 1;
            box-shadow: 0 8px 25px rgba(124, 58, 237, 0.3);
          }
          
          .slider-image.correct {
            border: 3px solid #10b981;
            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
          }
          
          .slider-image.incorrect {
            border: 3px solid #ef4444;
            box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
          }
          
          /* Fullscreen Mode (existing) */
          .fullscreen-mode {
            display: block;
          }
          
          .fullscreen-mode.hidden {
            display: none;
          }
          
          /* Hidden elements */
          .hidden {
            display: none !important;
          }
          
          /* Loading indicator */
          .loading {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: #333;
            font-size: 14px;
            z-index: 50;
          }
        `}</style>
        {/* Local fixi & extensions (vendored) */}
        <script src="/static/fixi/fixi.js"></script>
        <script src="/static/fixi/extensions.js"></script>
        
        {/* Visual Feed Script */}
        <script>{`
          let seenImages = new Set();
          let imageQueue = [];
          let cachedImageQueue = [];
          let currentImageIndex = 0;
          let isShowingImage = false;
          let currentTimeout = null;
          let failedImages = new Set();
          let lastActivityTime = Date.now();
          let isProcessingCached = false;
          let isDragClick = false;
          let imageHistory = []; // Track all images with timestamps for rotation
          
          // Layout management
          let currentLayout = 'fullscreen'; // 'fullscreen' or 'slider'
          let sliderImages = []; // Images in the slider
          let sliderPosition = 0; // Current scroll position
          let previewImage = null; // Currently previewed image
          
          // Browser image cache - persistent across layout switches
          let browserImageCache = new Map(); // url -> {element, eventId, correctCategory, category}
          let loadedImageUrls = new Set(); // Track which images are already loaded
          
          // Slider control state
          let sliderPaused = false;
          let autoScrollInterval = null;
          let mouseOverSlider = false;
          let lastMouseX = 0;
          let scrollDirection = 0; // -1 left, 0 stop, 1 right
          
          // Continuous rotation system with drag & drop
          const stackSize = 80; // Slightly larger for better spread
          const stacks = new Map(); // Track stacks of images per position
          const maxBackgroundImages = 150; // Optimal number for performance
          const maxStackHeight = 6; // Reduced stack height for better visibility
          let imageCounter = 0;
          let globalZIndex = 100; // Track highest z-index for new images
          let dragState = {
            isDragging: false,
            dragElement: null,
            startX: 0,
            startY: 0,
            offsetX: 0,
            offsetY: 0
          };
          
          // Enhanced layering system for dense stacking
          const layers = ['layer-1', 'layer-2', 'layer-3', 'layer-4', 'layer-5', 'layer-6', 'layer-7', 'layer-8'];
          const rotations = ['rotate-1', 'rotate-2', 'rotate-3', 'rotate-4', 'rotate-5', 'rotate-6'];
          const sizes = ['size-small', 'size-medium', 'size-large'];
          
          // Configuration
          const config = {
            imageDisplayTime: 4000,
            cachedImageDisplayTime: 1000, // Fast display for cached images
            imageLoadTimeout: 10000,
            maxRetries: 3,
            stuckDetectionTime: 15000, // 15 seconds without activity = stuck
            heartbeatInterval: 5000,
            rotationInterval: 30000, // Check for rotation every 30 seconds
            maxImageAge: 300000, // 5 minutes max age for images
            sliderSpeed: 8, // Much slower pixels per scroll step
            autoScrollSpeed: 4000, // Much slower auto-scroll: every 4 seconds
            scrollSensitivity: 0.4, // Less sensitive mouse control
            sliderLoadSpeed: 1000, // Much slower: 1 image per second
            manualScrollSpeed: 12 // Slower manual scrolling
          };
          
          function log(message, data = null) {
            console.log('[VisualFeed]', message, data || '');
          }
          
          function updateActivity() {
            lastActivityTime = Date.now();
          }
          
          function getCategoryPosition(category = 'art') {
            // Get category zone info from server-rendered data
            const categories = {
              nature: { zone: { x: 0, y: 0, width: 0.33, height: 0.5 }, color: '#10b981' },
              food: { zone: { x: 0.33, y: 0, width: 0.34, height: 0.5 }, color: '#f59e0b' },
              tech: { zone: { x: 0.67, y: 0, width: 0.33, height: 0.5 }, color: '#3b82f6' },
              memes: { zone: { x: 0, y: 0.5, width: 0.5, height: 0.5 }, color: '#8b5cf6' },
              art: { zone: { x: 0.5, y: 0.5, width: 0.5, height: 0.5 }, color: '#ec4899' }
            };
            
            const categoryData = categories[category] || categories.art;
            const zone = categoryData.zone;
            
            // Calculate zone boundaries in pixels
            const zoneLeft = zone.x * window.innerWidth;
            const zoneTop = zone.y * window.innerHeight;
            const zoneWidth = zone.width * window.innerWidth;
            const zoneHeight = zone.height * window.innerHeight;
            
            // More random positioning within zone (less clustering)
            const margin = 20;
            const x = zoneLeft + margin + Math.random() * (zoneWidth - margin * 2 - 100);
            const y = zoneTop + margin + Math.random() * (zoneHeight - margin * 2 - 100);
            
            return {
              x: x,
              y: y,
              category: category,
              color: categoryData.color
            };
          }

          function getDenseStackPosition() {
            const maxCols = Math.floor(window.innerWidth / stackSize);
            const maxRows = Math.floor(window.innerHeight / stackSize);
            
            // Force distribution: only use existing stacks 30% of the time
            const useExistingStack = Math.random() < 0.3 && stacks.size > 0;
            
            if (useExistingStack) {
              // Try to find existing stacks that aren't too full
              const availableStacks = Array.from(stacks.entries()).filter(([key, stack]) => 
                stack.images.length < maxStackHeight - 2 // Leave room for growth
              );
              
              if (availableStacks.length > 0) {
                const [stackKey, stack] = availableStacks[Math.floor(Math.random() * availableStacks.length)];
                const stackHeight = stack.images.length;
                
                return {
                  x: stack.x + Math.random() * 25 - 12.5, // More variation within stack
                  y: stack.y + Math.random() * 25 - 12.5,
                  stackKey: stackKey,
                  stackHeight: stackHeight,
                  isNewStack: false
                };
              }
            }
            
            // Create new stack (70% of the time, or if no suitable existing stacks)
            let attempts = 0;
            let col, row, stackKey;
            let minDistance = 120; // Minimum distance from existing stacks
            let bestPosition = null;
            let maxDistance = 0;
            
            // Try to find a position that's far from existing stacks
            for (let attempt = 0; attempt < 50; attempt++) {
              col = Math.floor(Math.random() * maxCols);
              row = Math.floor(Math.random() * maxRows);
              stackKey = col + ',' + row;
              
              const x = col * stackSize + Math.random() * 40 - 20;
              const y = row * stackSize + Math.random() * 40 - 20;
              
              // Calculate minimum distance to existing stacks
              let minDistanceToStack = Infinity;
              for (let [existingKey, existingStack] of stacks.entries()) {
                const distance = Math.sqrt(
                  Math.pow(x - existingStack.x, 2) + 
                  Math.pow(y - existingStack.y, 2)
                );
                minDistanceToStack = Math.min(minDistanceToStack, distance);
              }
              
              // Prefer positions that are farther from existing stacks
              if (minDistanceToStack > maxDistance || stacks.size === 0) {
                maxDistance = minDistanceToStack;
                bestPosition = { col, row, stackKey, x, y };
              }
              
              // If we found a good spot far from others, use it
              if (minDistanceToStack > minDistance || stacks.size === 0) {
                break;
              }
            }
            
            // Use best position found, or fallback to random
            if (!bestPosition) {
              col = Math.floor(Math.random() * maxCols);
              row = Math.floor(Math.random() * maxRows);
              stackKey = col + ',' + row;
              bestPosition = {
                col, row, stackKey,
                x: col * stackSize + Math.random() * 40 - 20,
                y: row * stackSize + Math.random() * 40 - 20
              };
            }
            
            // Create new stack
            stacks.set(bestPosition.stackKey, {
              x: bestPosition.x,
              y: bestPosition.y,
              images: [],
              timestamp: Date.now()
            });
            
            // Clean up old stacks if we have too many
            if (stacks.size > 60) { // Increased limit for better distribution
              const entries = Array.from(stacks.entries());
              entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
              const toRemove = entries.slice(0, 15);
              toRemove.forEach(([key]) => stacks.delete(key));
            }
            
            return {
              x: bestPosition.x,
              y: bestPosition.y,
              stackKey: bestPosition.stackKey,
              stackHeight: 0,
              isNewStack: true
            };
          }
          
          function addImageToBackground(imageUrl, eventId = null, eventData = null, placementCategory = 'art', correctCategory = null) {
            try {
              // For continuous feed, manage duplicates more intelligently
              const isFailed = failedImages.has(imageUrl);
              
              if (isFailed) {
                log('Skipping failed image:', imageUrl.slice(0, 50) + '...');
                return;
              }
              
              // Check if this image is currently visible on screen
              const currentlyVisible = document.querySelector('[src="' + imageUrl + '"]');
              if (currentlyVisible) {
                log('Image already visible on screen:', imageUrl.slice(0, 50) + '...');
                return;
              }
              
              // IMPORTANT: Check current layout before adding
              if (currentLayout !== 'fullscreen') {
                log('Layout changed to', currentLayout, '- redirecting image to correct mode');
                if (currentLayout === 'slider') {
                  addToSlider(imageUrl, eventId, correctCategory, placementCategory);
                }
                return;
              }
              
              // For continuous flow, allow images to reappear after they've rotated out
              log('Adding fresh image to fullscreen:', imageUrl.slice(0, 50) + '...');
              
              updateActivity();
              
              // CONTINUOUS ROTATION: Always remove oldest image when adding new one
              const existingImages = document.querySelectorAll('.discovery-image');
              if (existingImages.length >= maxBackgroundImages) {
                // Remove the single oldest image
                const sortedImages = Array.from(existingImages).sort((a, b) => {
                  const aTime = parseInt(a.getAttribute('data-timestamp')) || 0;
                  const bTime = parseInt(b.getAttribute('data-timestamp')) || 0;
                  return aTime - bTime;
                });
                
                if (sortedImages[0]) {
                  log('Rotating out oldest image for fresh content');
                  sortedImages[0].style.opacity = '0';
                  sortedImages[0].style.transform = 'scale(0.8)';
                  setTimeout(() => {
                    if (sortedImages[0].parentNode) {
                      sortedImages[0].parentNode.removeChild(sortedImages[0]);
                    }
                  }, 200);
                }
              }
              
              // GAME MODE: Place randomly, not in correct category
              const randomCategory = ['nature', 'food', 'tech', 'memes', 'art'][Math.floor(Math.random() * 5)];
              const position = getCategoryPosition(randomCategory);
              const bgImg = document.createElement('img');
              bgImg.src = imageUrl;
              
              // Base class with category styling
              bgImg.className = 'discovery-image';
              
              // Add category-specific styling
              bgImg.style.border = '2px solid ' + position.color;
              bgImg.style.boxShadow = '0 3px 12px ' + position.color + '40';
              
              // NEW IMAGES ALWAYS ON TOP - increment global z-index
              globalZIndex += 1;
              bgImg.style.zIndex = globalZIndex.toString();
              
              // Add random rotation for organic feel
              const rotationClass = rotations[Math.floor(Math.random() * rotations.length)];
              bgImg.classList.add(rotationClass);
              
              // Random size variation
              const sizeClass = sizes[Math.floor(Math.random() * sizes.length)];
              bgImg.classList.add(sizeClass);
              
              // Position the image in category zone
              bgImg.style.left = position.x + 'px';
              bgImg.style.top = position.y + 'px';
              bgImg.style.opacity = '0';
              
              // Store game info
              bgImg.setAttribute('data-category', randomCategory); // Current placement
              bgImg.setAttribute('data-correct-category', correctCategory || placementCategory); // Correct answer
              bgImg.setAttribute('data-category-color', position.color);
              bgImg.setAttribute('data-z-index', globalZIndex.toString());
              bgImg.setAttribute('data-timestamp', Date.now().toString()); // For rotation tracking
              
              // Initial state is neutral (not correct or incorrect yet)
              bgImg.classList.add('neutral');
              
              // Cache in browser for layout switching
              browserImageCache.set(imageUrl, {
                element: bgImg,
                eventId: eventId,
                correctCategory: correctCategory || placementCategory,
                category: randomCategory,
                timestamp: Date.now()
              });
              loadedImageUrls.add(imageUrl);
              
              // Track in image history for rotation
              imageHistory.push({
                element: bgImg,
                imageUrl: imageUrl,
                timestamp: Date.now(),
                eventId: eventId
              });
              
              // Keep history manageable
              if (imageHistory.length > maxBackgroundImages * 2) {
                imageHistory = imageHistory.slice(-maxBackgroundImages);
              }
              
              // Store event data for click handling
              if (eventId) {
                bgImg.setAttribute('data-event-id', eventId);
              }
              if (eventData) {
                bgImg.setAttribute('data-event-data', JSON.stringify(eventData));
              }
              
              // Drag & Drop implementation
              let dragStartTime = 0;
              
              bgImg.addEventListener('mousedown', function(e) {
                e.preventDefault();
                dragStartTime = Date.now();
                isDragClick = false;
                
                dragState.isDragging = true;
                dragState.dragElement = bgImg;
                dragState.startX = e.clientX;
                dragState.startY = e.clientY;
                dragState.offsetX = e.clientX - bgImg.offsetLeft;
                dragState.offsetY = e.clientY - bgImg.offsetTop;
                
                bgImg.classList.add('dragging');
                
                // Bring to top and mark as being dragged
                bgImg.style.zIndex = '2000';
                
                log('Started dragging image');
              });
              
              // Click handler (only if not dragged)
              bgImg.addEventListener('click', function(e) {
                e.stopPropagation();
                
                const dragDuration = Date.now() - dragStartTime;
                
                // Only open post if it was a quick click (not a drag)
                if (!isDragClick && dragDuration < 200 && eventId) {
                  // Bring to very top when clicked
                  globalZIndex += 1;
                  bgImg.style.zIndex = globalZIndex.toString();
                  bgImg.style.opacity = '1';
                  
                  log('Opening Nostr post:', eventId.slice(0, 8));
                  setTimeout(() => {
                    window.open('/nostr/post/' + eventId, '_blank');
                  }, 100);
                } else if (!eventId) {
                  log('No event ID for image:', imageUrl.slice(0, 50));
                }
              });
              
              // Enhanced hover interaction
              bgImg.addEventListener('mouseenter', function() {
                if (!dragState.isDragging) {
                  // Bring to front on hover (but not higher than newest images)
                  const currentZ = parseInt(bgImg.style.zIndex) || 100;
                  bgImg.style.zIndex = Math.max(currentZ, globalZIndex - 50).toString();
                  bgImg.style.opacity = '1';
                  
                  // Find other images in the same category for subtle highlighting
                  const category = bgImg.getAttribute('data-category');
                  if (category) {
                    const categoryImages = document.querySelectorAll('[data-category="' + category + '"]');
                    
                    // Subtle highlight for category
                    categoryImages.forEach((img) => {
                      if (img !== bgImg) {
                        img.style.filter = 'brightness(1.1)';
                      }
                    });
                  }
                }
              });
              
              bgImg.addEventListener('mouseleave', function() {
                if (!dragState.isDragging) {
                  // Reset category images
                  const category = bgImg.getAttribute('data-category');
                  if (category) {
                    const categoryImages = document.querySelectorAll('[data-category="' + category + '"]');
                    categoryImages.forEach(img => {
                      img.style.filter = '';
                    });
                  }
                  
                  // Reset opacity but keep z-index for layering
                  bgImg.style.opacity = '0.8';
                }
              });
              
              // Error handling
              bgImg.onerror = function() {
                log('Failed to load background image:', imageUrl.slice(0, 50));
                failedImages.add(imageUrl);
                if (bgImg.parentNode) {
                  bgImg.parentNode.removeChild(bgImg);
                }
              };
              
              bgImg.onload = function() {
                log('Background image loaded:', imageUrl.slice(0, 50));
              };
              
              document.body.appendChild(bgImg);
              
              // Fade in with highest opacity for newest images
              setTimeout(() => {
                if (bgImg.parentNode) {
                  bgImg.style.opacity = '1'; // Full opacity for brand new images
                  
                  // Slightly dim older images to emphasize new ones
                  const allImages = document.querySelectorAll('.discovery-image');
                  allImages.forEach(img => {
                    if (img !== bgImg) {
                      const currentOpacity = parseFloat(img.style.opacity) || 0.8;
                      img.style.opacity = Math.max(0.6, currentOpacity * 0.95).toString();
                    }
                  });
                }
              }, 100);
              
            } catch (error) {
              log('Error in addImageToBackground:', error);
            }
          }
          
          // Legacy function for compatibility
          function addNewImage(imageUrl, eventId = null, eventData = null, category = 'art', correctCategory = null) {
            addImageToBackground(imageUrl, eventId, eventData, category, correctCategory);
          }
          
          // Global drag & drop handlers
          document.addEventListener('mousemove', function(e) {
            if (dragState.isDragging && dragState.dragElement) {
              isDragClick = true;
              
              const newX = e.clientX - dragState.offsetX;
              const newY = e.clientY - dragState.offsetY;
              
              dragState.dragElement.style.left = newX + 'px';
              dragState.dragElement.style.top = newY + 'px';
              
              // Update stack position if needed
              const stackKey = dragState.dragElement.getAttribute('data-stack-key');
              if (stackKey && stacks.has(stackKey)) {
                const stack = stacks.get(stackKey);
                stack.x = newX;
                stack.y = newY;
                
                // Move other images in the stack too
                stack.images.forEach((imgData, index) => {
                  if (imgData.element !== dragState.dragElement) {
                    imgData.element.style.left = (newX + Math.random() * 15 - 7.5) + 'px';
                    imgData.element.style.top = (newY + Math.random() * 15 - 7.5) + 'px';
                  }
                });
              }
            }
          });
          
          document.addEventListener('mouseup', function(e) {
            if (dragState.isDragging && dragState.dragElement) {
              log('Finished dragging image');
              
              dragState.dragElement.classList.remove('dragging');
              
              // GAME LOGIC: Check which zone the image was dropped in
              const imgRect = dragState.dragElement.getBoundingClientRect();
              const imgCenterX = imgRect.left + imgRect.width / 2;
              const imgCenterY = imgRect.top + imgRect.height / 2;
              
              // Detect which category zone the image is in
              const categories = {
                nature: { zone: { x: 0, y: 0, width: 0.33, height: 0.5 }, color: '#10b981' },
                food: { zone: { x: 0.33, y: 0, width: 0.34, height: 0.5 }, color: '#f59e0b' },
                tech: { zone: { x: 0.67, y: 0, width: 0.33, height: 0.5 }, color: '#3b82f6' },
                memes: { zone: { x: 0, y: 0.5, width: 0.5, height: 0.5 }, color: '#8b5cf6' },
                art: { zone: { x: 0.5, y: 0.5, width: 0.5, height: 0.5 }, color: '#ec4899' }
              };
              
              let droppedInZone = 'art'; // Default
              
              for (const [categoryKey, categoryData] of Object.entries(categories)) {
                const zone = categoryData.zone;
                const zoneLeft = zone.x * window.innerWidth;
                const zoneTop = zone.y * window.innerHeight;
                const zoneRight = zoneLeft + zone.width * window.innerWidth;
                const zoneBottom = zoneTop + zone.height * window.innerHeight;
                
                if (imgCenterX >= zoneLeft && imgCenterX <= zoneRight && 
                    imgCenterY >= zoneTop && imgCenterY <= zoneBottom) {
                  droppedInZone = categoryKey;
                  break;
                }
              }
              
              // Update image's current category
              dragState.dragElement.setAttribute('data-category', droppedInZone);
              
              // Check if it's in the correct zone
              const correctCategory = dragState.dragElement.getAttribute('data-correct-category');
              const isCorrect = droppedInZone === correctCategory;
              
              // Update visual feedback
              dragState.dragElement.classList.remove('correct', 'incorrect', 'neutral');
              
              if (isCorrect) {
                dragState.dragElement.classList.add('correct');
                dragState.dragElement.style.border = '3px solid #10b981';
                dragState.dragElement.style.boxShadow = '0 5px 15px #10b98140';
                log('✅ Correct placement!', droppedInZone, 'for', correctCategory);
              } else {
                dragState.dragElement.classList.add('incorrect');
                dragState.dragElement.style.border = '3px solid #ef4444';
                dragState.dragElement.style.boxShadow = '0 5px 15px #ef444440';
                log('❌ Incorrect placement:', droppedInZone, 'should be', correctCategory);
              }
              
              // Bring to top after successful categorization
              globalZIndex += 1;
              dragState.dragElement.style.zIndex = globalZIndex.toString();
              
              // Reset drag state
              setTimeout(() => {
                dragState.isDragging = false;
                dragState.dragElement = null;
                isDragClick = false;
              }, 100);
            }
          });
          
          // Stuck detection and recovery
          function checkForStuckState() {
            const timeSinceActivity = Date.now() - lastActivityTime;
            
            if (timeSinceActivity > config.stuckDetectionTime) {
              log('Detected stuck state, attempting recovery');
              
              // Clear any timeouts
              if (currentTimeout) {
                clearTimeout(currentTimeout);
                currentTimeout = null;
              }
              
              // Remove any problematic main images
              const existingMain = document.querySelector('.main-image');
              if (existingMain) {
                existingMain.remove();
              }
              
              // Reset state
              isShowingImage = false;
              updateActivity();
              
              // Try to restart if we have images in queue
              if (imageQueue.length > 0) {
                log('Restarting slideshow after recovery');
                setTimeout(() => showNextImage(), 1000);
              } else {
                log('No images in queue after recovery, checking for hidden images');
                
                // Look for any hidden images that might not have been processed
                const hiddenImages = document.querySelectorAll('[data-image-url]');
                let foundNewImages = 0;
                
                hiddenImages.forEach(el => {
                  const url = el.getAttribute('data-image-url');
                  if (url && !seenImages.has(url) && !failedImages.has(url)) {
                    addNewImage(url);
                    foundNewImages++;
                  }
                });
                
                if (foundNewImages > 0) {
                  log('Found and queued', foundNewImages, 'hidden images');
                } else {
                  log('No new images found, waiting for more content');
                }
              }
            }
          }
          
          // Heartbeat to monitor health and manage rotation
          setInterval(() => {
            checkForStuckState();
            
            // Continuous freshness: gradually rotate content
            const now = Date.now();
            const allImages = document.querySelectorAll('.discovery-image');
            
            // Age-based opacity reduction for natural rotation feel
            allImages.forEach(img => {
              const timestamp = parseInt(img.getAttribute('data-timestamp')) || now;
              const age = now - timestamp;
              const ageMinutes = age / 60000;
              
              // Gradually reduce opacity based on age (fresher = more visible)
              if (ageMinutes > 2) {
                const ageFactor = Math.max(0.4, 1 - (ageMinutes / 10)); // Fade over 10 minutes
                const currentOpacity = parseFloat(img.style.opacity) || 0.8;
                const targetOpacity = Math.min(currentOpacity, ageFactor);
                img.style.opacity = targetOpacity.toString();
              }
              
              // Remove very old images (older than 8 minutes)
              if (ageMinutes > 8) {
                log('Removing very old image:', ageMinutes.toFixed(1), 'minutes old');
                img.style.opacity = '0';
                img.style.transform = 'scale(0.5)';
                setTimeout(() => {
                  if (img.parentNode) {
                    img.parentNode.removeChild(img);
                  }
                }, 300);
              }
            });
            
            // Log status occasionally
            if (Math.random() < 0.1) { // 10% chance
              const currentImages = document.querySelectorAll('.discovery-image').length;
              log('Status check - Current images:', currentImages, 'Queue:', imageQueue.length, 'Cached:', cachedImageQueue.length, 'History:', imageHistory.length);
            }
          }, config.heartbeatInterval);
          
          // Layout switching functions
          function switchToFullscreen() {
            currentLayout = 'fullscreen';
            log('Attempting to switch to fullscreen mode...');
            
            // Stop slider auto-scroll
            pauseSlider();
            
            // Show fullscreen elements
            const categoryZones = document.getElementById('category-zones');
            const sliderMode = document.getElementById('slider-mode');
            
            if (categoryZones) {
              categoryZones.style.display = 'block';
              log('Shown category zones');
            }
            
            if (sliderMode) {
              sliderMode.style.display = 'none';
              sliderMode.classList.remove('active');
              log('Hidden slider mode');
            }
            
            // Recreate discovery images from browser cache
            const cachedEntries = Array.from(browserImageCache.entries());
            cachedEntries.forEach(([imageUrl, cachedData]) => {
              // Only recreate if not already visible
              const existing = document.querySelector('.discovery-image[src="' + imageUrl + '"]');
              if (!existing) {
                // Recreate the discovery image
                recreateDiscoveryImage(imageUrl, cachedData);
              } else {
                existing.style.display = 'block';
              }
            });
            
            log('Recreated', cachedEntries.length, 'discovery images from cache');
            
            // Update button styles
            const fullscreenBtn = document.getElementById('fullscreen-btn');
            const sliderBtn = document.getElementById('slider-btn');
            
            if (fullscreenBtn) {
              fullscreenBtn.style.background = 'rgba(124, 58, 237, 0.9)';
            }
            if (sliderBtn) {
              sliderBtn.style.background = 'rgba(255,255,255,0.2)';
            }
            
            log('Switched to fullscreen mode');
          }
          
          function recreateDiscoveryImage(imageUrl, cachedData) {
            // Recreate discovery image from cached data
            const randomCategory = ['nature', 'food', 'tech', 'memes', 'art'][Math.floor(Math.random() * 5)];
            const position = getCategoryPosition(randomCategory);
            const bgImg = document.createElement('img');
            bgImg.src = imageUrl;
            bgImg.className = 'discovery-image';
            
            // Apply cached styling and positioning
            bgImg.style.border = '2px solid ' + position.color;
            bgImg.style.boxShadow = '0 3px 12px ' + position.color + '40';
            globalZIndex += 1;
            bgImg.style.zIndex = globalZIndex.toString();
            bgImg.style.left = position.x + 'px';
            bgImg.style.top = position.y + 'px';
            bgImg.style.opacity = '0.8';
            
            // Restore attributes
            bgImg.setAttribute('data-category', cachedData.category);
            bgImg.setAttribute('data-correct-category', cachedData.correctCategory);
            bgImg.setAttribute('data-event-id', cachedData.eventId || '');
            bgImg.setAttribute('data-timestamp', cachedData.timestamp.toString());
            
            // Add all the event handlers (copy from addImageToBackground)
            // ... (click handlers, drag handlers, etc.)
            
            document.body.appendChild(bgImg);
          }
          
          function switchToSlider() {
            currentLayout = 'slider';
            log('Attempting to switch to slider mode...');
            
            // Hide fullscreen elements
            const categoryZones = document.getElementById('category-zones');
            const allDiscoveryImages = document.querySelectorAll('.discovery-image');
            
            if (categoryZones) {
              categoryZones.style.display = 'none';
              log('Hidden category zones');
            }
            
            // Hide all discovery images
            allDiscoveryImages.forEach(img => {
              img.style.display = 'none';
            });
            log('Hidden', allDiscoveryImages.length, 'discovery images');
            
            // Show slider mode
            const sliderMode = document.getElementById('slider-mode');
            if (sliderMode) {
              sliderMode.style.display = 'block';
              sliderMode.classList.add('active');
              log('Slider mode shown');
            } else {
              log('ERROR: slider-mode element not found!');
            }
            
            // Update button styles
            const fullscreenBtn = document.getElementById('fullscreen-btn');
            const sliderBtn = document.getElementById('slider-btn');
            
            if (fullscreenBtn) {
              fullscreenBtn.style.background = 'rgba(255,255,255,0.2)';
            }
            if (sliderBtn) {
              sliderBtn.style.background = 'rgba(124, 58, 237, 0.9)';
            }
            
            // Convert existing images to slider
            convertToSliderMode();
            
            // Start auto-scrolling
            startAutoScroll();
            
            log('Switched to slider mode');
          }
          
          function convertToSliderMode() {
            const sliderStrip = document.getElementById('slider-strip');
            
            if (!sliderStrip) {
              log('ERROR: slider-strip not found during conversion!');
              return;
            }
            
            // Clear slider and reset position
            sliderStrip.innerHTML = '';
            sliderImages = [];
            sliderPosition = 0;
            
            log('Converting cached images to slider mode...');
            
            // Use browser cache to recreate slider images - start with fewer for better visibility
            const cachedEntries = Array.from(browserImageCache.entries());
            const imagesToConvert = cachedEntries.slice(0, 15); // Start with only 15 images for better control
            
            imagesToConvert.forEach(([imageUrl, cachedData], index) => {
              // Create new slider image from cache
              const sliderImg = document.createElement('img');
              sliderImg.src = imageUrl;
              sliderImg.className = 'slider-image';
              sliderImg.setAttribute('data-event-id', cachedData.eventId || '');
              sliderImg.setAttribute('data-correct-category', cachedData.correctCategory || 'art');
              sliderImg.setAttribute('data-category', cachedData.category || 'art');
              
              // Enhanced hover with pause control
              sliderImg.addEventListener('mouseenter', function(e) {
                showPreview(sliderImg.src);
                sliderImg.style.zIndex = '100';
                pauseSlider();
                mouseOverSlider = true;
                
                // Track mouse position for directional scrolling
                lastMouseX = e.clientX;
              });
              
              sliderImg.addEventListener('mouseleave', function() {
                sliderImg.style.zIndex = '';
                mouseOverSlider = false;
                resumeSlider();
              });
              
              sliderImg.addEventListener('mousemove', function(e) {
                if (mouseOverSlider) {
                  handleMouseScroll(e.clientX);
                }
              });
                
              // Add click handler
              sliderImg.addEventListener('click', function() {
                const eventId = sliderImg.getAttribute('data-event-id');
                if (eventId) {
                  // Visual feedback on click
                  sliderImg.style.transform = 'scale(1.2) translateY(-8px)';
                  setTimeout(() => {
                    window.open('/nostr/post/' + eventId, '_blank');
                    sliderImg.style.transform = '';
                  }, 150);
                }
              });
              
              // Add to slider with much slower staggered timing
              setTimeout(() => {
                sliderImg.style.opacity = '0.8';
                sliderStrip.appendChild(sliderImg);
                sliderImages.push(sliderImg);
                log('Added cached image', index + 1, 'of', imagesToConvert.length, 'to slider');
              }, index * 500); // Much slower: 0.5 second between each image
            });
            
            // Hide all existing discovery images (don't remove them)
            const existingImages = document.querySelectorAll('.discovery-image');
            existingImages.forEach(img => {
              img.style.display = 'none';
            });
            
            // Position the strip to show images from left
            sliderPosition = 0;
            sliderStrip.style.transform = 'translateX(0px)';
            
            log('Converted', imagesToConvert.length, 'images to slider mode from cache');
            
            // Show first image in preview if available
            setTimeout(() => {
              if (sliderImages.length > 0) {
                showPreview(sliderImages[0].src);
              }
            }, 500);
            
            // Set up slider container mouse events
            const sliderContainer = document.querySelector('.slider-container');
            if (sliderContainer) {
              sliderContainer.addEventListener('mouseenter', function() {
                pauseSlider();
              });
              
              sliderContainer.addEventListener('mouseleave', function() {
                resumeSlider();
              });
              
              sliderContainer.addEventListener('mousemove', function(e) {
                if (mouseOverSlider) {
                  handleMouseScroll(e.clientX);
                }
              });
            }
          }
          
          function showPreview(imageUrl) {
            const previewImg = document.getElementById('preview-image');
            const placeholder = document.querySelector('.preview-placeholder');
            
            // Hide placeholder
            if (placeholder) {
              placeholder.style.opacity = '0';
            }
            
            // Smooth image transition
            previewImg.style.opacity = '0';
            previewImg.style.transform = 'scale(0.95)';
            
            setTimeout(() => {
              previewImg.src = imageUrl;
              previewImg.style.opacity = '1';
              previewImg.style.transform = 'scale(1)';
              previewImg.classList.add('visible');
            }, 250);
          }
          
          function hidePreview() {
            const previewImg = document.getElementById('preview-image');
            const placeholder = document.querySelector('.preview-placeholder');
            
            previewImg.style.opacity = '0';
            previewImg.classList.remove('visible');
            
            // Show placeholder again
            setTimeout(() => {
              if (placeholder) {
                placeholder.style.opacity = '1';
              }
            }, 300);
          }
          
          function addToSlider(imageUrl, eventId, correctCategory, category) {
            const sliderStrip = document.getElementById('slider-strip');
            if (!sliderStrip) return;
            
            log('Adding image to slider with controlled timing');
            
            const sliderImg = document.createElement('img');
            sliderImg.src = imageUrl;
            sliderImg.className = 'slider-image';
            sliderImg.setAttribute('data-event-id', eventId);
            sliderImg.setAttribute('data-correct-category', correctCategory);
            sliderImg.setAttribute('data-category', category);
            
            // Cache in browser for layout switching
            browserImageCache.set(imageUrl, {
              element: sliderImg,
              eventId: eventId,
              correctCategory: correctCategory,
              category: category,
              timestamp: Date.now()
            });
            loadedImageUrls.add(imageUrl);
            
            // Enhanced hover with pause control
            sliderImg.addEventListener('mouseenter', function(e) {
              showPreview(imageUrl);
              sliderImg.style.zIndex = '100';
              pauseSlider();
              mouseOverSlider = true;
              
              // Track mouse position for directional scrolling
              lastMouseX = e.clientX;
            });
            
            sliderImg.addEventListener('mouseleave', function() {
              sliderImg.style.zIndex = '';
              mouseOverSlider = false;
              resumeSlider();
            });
            
            sliderImg.addEventListener('mousemove', function(e) {
              if (mouseOverSlider) {
                handleMouseScroll(e.clientX);
              }
            });
            
            // Add click handler
            sliderImg.addEventListener('click', function() {
              if (eventId) {
                // Visual feedback on click
                sliderImg.style.transform = 'scale(1.2) translateY(-8px)';
                setTimeout(() => {
                  window.open('/nostr/post/' + eventId, '_blank');
                  sliderImg.style.transform = '';
                }, 150);
              }
            });
            
            // Slower, more controlled entrance animation
            sliderImg.style.opacity = '0';
            sliderImg.style.transform = 'scale(0.9) translateX(30px)';
            sliderStrip.appendChild(sliderImg);
            sliderImages.push(sliderImg);
            
            // Gradual entrance animation (slower)
            setTimeout(() => {
              sliderImg.style.opacity = '0.8';
              sliderImg.style.transform = 'scale(1) translateX(0)';
            }, 200);
            
            // Much slower auto-sliding - only if not paused
            if (!sliderPaused) {
              setTimeout(() => {
                const imageWidth = 100 + 12; // width + gap
                sliderPosition -= imageWidth / 2; // Move only half the width for slower sliding
                sliderStrip.style.transform = 'translateX(' + sliderPosition + 'px)';
                log('Auto-sliding to position:', sliderPosition);
              }, 1000); // 1 second delay before sliding
            }
            
            // Keep more images in slider for better access (max 60 instead of 35)
            if (sliderImages.length > 60) {
              const oldImage = sliderImages.shift();
              if (oldImage && oldImage.parentNode) {
                oldImage.style.opacity = '0';
                oldImage.style.transform = 'scale(0.8)';
                setTimeout(() => {
                  if (oldImage.parentNode) {
                    oldImage.parentNode.removeChild(oldImage);
                  }
                }, 800); // Slower removal
              }
            }
            
            log('Added image to slider, total:', sliderImages.length);
          }
          
          // Slider control functions
          function pauseSlider() {
            sliderPaused = true;
            if (autoScrollInterval) {
              clearInterval(autoScrollInterval);
              autoScrollInterval = null;
            }
            log('Slider paused');
          }
          
          function resumeSlider() {
            sliderPaused = false;
            startAutoScroll();
            log('Slider resumed');
          }
          
          function startAutoScroll() {
            if (autoScrollInterval) clearInterval(autoScrollInterval);
            
            autoScrollInterval = setInterval(() => {
              if (!sliderPaused && currentLayout === 'slider') {
                // Much slower auto-scroll
                scrollSlider(-0.5); // Half-speed scrolling
              }
            }, config.autoScrollSpeed); // Every 4 seconds
          }
          
          function scrollSlider(direction) {
            if (currentLayout !== 'slider') return;
            
            const sliderStrip = document.getElementById('slider-strip');
            if (!sliderStrip) return;
            
            const scrollAmount = config.sliderSpeed * direction;
            sliderPosition += scrollAmount;
            
            // Smooth scrolling with bounds checking
            const maxScroll = -(sliderImages.length * 112 - window.innerWidth + 100);
            sliderPosition = Math.max(maxScroll, Math.min(0, sliderPosition));
            
            sliderStrip.style.transform = 'translateX(' + sliderPosition + 'px)';
          }
          
          function handleMouseScroll(mouseX) {
            const sliderContainer = document.querySelector('.slider-container');
            if (!sliderContainer) return;
            
            const containerRect = sliderContainer.getBoundingClientRect();
            const containerCenter = containerRect.left + containerRect.width / 2;
            const mouseRelativeX = (mouseX - containerCenter) / (containerRect.width / 2);
            
            // Dead zone in center (±30%)
            if (Math.abs(mouseRelativeX) < config.scrollSensitivity) {
              scrollDirection = 0;
              return;
            }
            
            // Determine scroll direction and speed - much slower manual control
            if (mouseRelativeX < -config.scrollSensitivity) {
              // Mouse on left side - scroll left (show newer images)
              scrollDirection = -1;
              scrollSlider(-config.manualScrollSpeed / 10); // Much slower manual scroll
            } else if (mouseRelativeX > config.scrollSensitivity) {
              // Mouse on right side - scroll right (show older images)
              scrollDirection = 1;
              scrollSlider(config.manualScrollSpeed / 10); // Much slower manual scroll
            }
          }
          
          // Function to be called when new images arrive
          function addNostrImageDynamic(imageUrl, eventId = null, eventData = null, category = 'art', correctCategory = null) {
            if (currentLayout === 'fullscreen') {
              addImageToBackground(imageUrl, eventId, eventData, category, correctCategory);
            } else if (currentLayout === 'slider') {
              // Only add if not paused
              if (!sliderPaused) {
                addToSlider(imageUrl, eventId, correctCategory, category);
              }
            }
          }
          
          window.addNostrImage = addNostrImageDynamic;
          
          // Global layout switching functions
          window.switchToFullscreen = switchToFullscreen;
          window.switchToSlider = switchToSlider;
          
          // Enhanced initialization for discovery mode
          document.addEventListener('DOMContentLoaded', () => {
            log('Initializing discovery feed');
            
            // Set up layout switcher click handlers with debugging
            const fullscreenBtn = document.getElementById('fullscreen-btn');
            const sliderBtn = document.getElementById('slider-btn');
            
            log('Looking for buttons...');
            log('Fullscreen button found:', !!fullscreenBtn);
            log('Slider button found:', !!sliderBtn);
            
            if (fullscreenBtn) {
              fullscreenBtn.addEventListener('click', function(e) {
                e.preventDefault();
                log('Fullscreen button clicked!');
                switchToFullscreen();
              });
              log('Fullscreen button handler attached');
            }
            
            if (sliderBtn) {
              sliderBtn.addEventListener('click', function(e) {
                e.preventDefault();
                log('Slider button clicked!');
                switchToSlider();
              });
              log('Slider button handler attached');
            }
            
            // Also check if slider mode elements exist
            const sliderMode = document.getElementById('slider-mode');
            const previewArea = document.querySelector('.preview-area');
            const sliderStrip = document.getElementById('slider-strip');
            
            log('Slider mode element found:', !!sliderMode);
            log('Preview area found:', !!previewArea);
            log('Slider strip found:', !!sliderStrip);
            
            // First, process cached images with event data
            const cachedImages = document.querySelectorAll('[data-cached-image-url]');
            log('Found cached images:', cachedImages.length);
            
            // Controlled loading based on current layout
            if (currentLayout === 'slider') {
              // SLIDER MODE: Much slower, controlled loading (2-4 images per second)
              log('Loading cached images for slider mode - controlled speed');
              
              cachedImages.forEach((el, index) => {
                const url = el.getAttribute('data-cached-image-url');
                const eventId = el.getAttribute('data-event-id');
                const eventDataStr = el.getAttribute('data-event-data');
                const category = el.getAttribute('data-category') || 'art';
                const correctCategory = el.getAttribute('data-correct-category') || 'art';
                
                if (url) {
                  let eventData = null;
                  try {
                    eventData = eventDataStr ? JSON.parse(eventDataStr) : null;
                  } catch (e) {
                    log('Failed to parse event data for cached image');
                  }
                  
                  // Skip if already loaded in browser cache
                  if (loadedImageUrls.has(url)) {
                    log('Skipping already loaded image:', url.slice(0, 50));
                    el.style.display = 'none';
                    return;
                  }
                  
                  // Much slower loading: 1 image per second (1000ms intervals)
                  setTimeout(() => {
                    addToSlider(url, eventId, correctCategory, category);
                    el.style.display = 'none';
                  }, index * 1000); // Much slower: 1 image per second
                }
              });
            } else {
              // FULLSCREEN MODE: Faster batch loading
              const batchSize = 20;
              const totalBatches = Math.ceil(cachedImages.length / batchSize);
              
              for (let batch = 0; batch < totalBatches; batch++) {
                const batchStart = batch * batchSize;
                const batchEnd = Math.min(batchStart + batchSize, cachedImages.length);
                
                setTimeout(() => {
                  for (let i = batchStart; i < batchEnd; i++) {
                    const el = cachedImages[i];
                    const url = el.getAttribute('data-cached-image-url');
                    const eventId = el.getAttribute('data-event-id');
                    const eventDataStr = el.getAttribute('data-event-data');
                    const category = el.getAttribute('data-category') || 'art';
                    const correctCategory = el.getAttribute('data-correct-category') || 'art';
                    
                    if (url) {
                      let eventData = null;
                      try {
                        eventData = eventDataStr ? JSON.parse(eventDataStr) : null;
                      } catch (e) {
                        log('Failed to parse event data for cached image');
                      }
                      
                      // Add with slight delay within batch
                      setTimeout(() => {
                        addImageToBackground(url, eventId, eventData, category, correctCategory);
                      }, (i - batchStart) * 50);
                      el.style.display = 'none';
                    }
                  }
                }, batch * 1000); // 1 second between batches
              }
            }
            
            // Then process new images with event data
            const initialImages = document.querySelectorAll('[data-image-url]');
            log('Found new images:', initialImages.length);
            
            initialImages.forEach((el, index) => {
              const url = el.getAttribute('data-image-url');
              const eventId = el.getAttribute('data-event-id');
              const eventDataStr = el.getAttribute('data-event-data');
              const category = el.getAttribute('data-category') || 'art';
              const correctCategory = el.getAttribute('data-correct-category') || category;
              
              if (url) {
                let eventData = null;
                try {
                  eventData = eventDataStr ? JSON.parse(eventDataStr) : null;
                } catch (e) {
                  log('Failed to parse event data for new image');
                }
                
                // Add after cached images - much slower for slider mode
                const delay = currentLayout === 'slider' ? 
                  (cachedImages.length * 1000) + (index * 1500) : // Much slower for slider: 1.5 seconds between each
                  (cachedImages.length * 100) + (index * 200);     // Normal for fullscreen
                
                setTimeout(() => {
                  if (currentLayout === 'fullscreen') {
                    addImageToBackground(url, eventId, eventData, category, correctCategory);
                  } else if (currentLayout === 'slider') {
                    addToSlider(url, eventId, correctCategory, category);
                  }
                }, delay);
                el.style.display = 'none';
              }
            });
            
            // Start monitoring
            updateActivity();
          });
          
          // Global error handler
          window.addEventListener('error', (event) => {
            log('Global error caught:', event.error);
          });
          
          // Visibility change handling (tab switching)
          document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
              log('Tab became visible, checking state');
              updateActivity();
              
              // Restart if stuck and we have images
              if (!isShowingImage && imageQueue.length > 0) {
                setTimeout(() => showNextImage(), 500);
              }
            }
          });
        `}</script>
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}

export function Counter(props: { count: number }) {
  const { count } = props;
  return (
    <div id="counter" className="counter">
      <form
        // Fixi-enhanced form: AJAX submit when JS is on
        fx-action="/counter"
        fx-method="post"
        fx-target="#counter"
        fx-swap="outerHTML"
        // No-JS fallback: normal form POST refreshes whole page
        action="/counter"
        method="post"
      >
        <span>{e`Count: ${count}`}</span>
        <button type="submit">Increment</button>
      </form>
    </div>
  );
}

export function EventLog({ events }: { events: Array<{ id: number; text: string }> }) {
  return (
    <section style={{ marginTop: '1rem' }}>
      {/* Declarative autostart for SSE; non-JS users will just see SSR-rendered log below */}
      <div ext-fx-sse-autostart="/events" data-target="#event-log" data-swap="beforeend" />
      <h2 style={{ margin: '0 0 .5rem 0' }}>Log</h2>
      <div id="event-log">
        {events.map((e) => (
          <div>{e.text}</div>
        ))}
      </div>
    </section>
  );
}

export function DiscoveryFeed({ items, cachedImagesWithData = [] }: { 
  items: NostrFeedItem[]; 
  cachedImagesWithData?: Array<{ imageUrl: string; eventId?: string; eventData?: any }> 
}) {
  return (
    <div>
      {/* Layout Switcher - Compact Top Right */}
      <div style={{ 
        position: 'fixed', 
        top: '15px', 
        right: '15px', 
        zIndex: 9999,
        display: 'flex',
        gap: '5px',
        background: 'rgba(0,0,0,0.8)',
        padding: '6px',
        borderRadius: '6px',
        border: '1px solid rgba(255,255,255,0.3)'
      }}>
        <button 
          id="fullscreen-btn" 
          style={{
            padding: '6px 12px',
            background: 'rgba(124, 58, 237, 0.9)',
            border: 'none',
            color: 'white',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '11px',
            fontWeight: '500'
          }}
        >
          🖼️
        </button>
        <button 
          id="slider-btn"
          style={{
            padding: '6px 12px',
            background: 'rgba(255,255,255,0.2)',
            border: 'none',
            color: 'white',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '11px',
            fontWeight: '500'
          }}
        >
          🎞️
        </button>
      </div>

      {/* Category Zone Indicators */}
      <div id="category-zones" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', pointerEvents: 'none', zIndex: -10 }}>
        {Object.entries(IMAGE_CATEGORIES).map(([key, category]) => (
          <div 
            key={key}
            style={{
              position: 'absolute',
              left: `${category.zone.x * 100}%`,
              top: `${category.zone.y * 100}%`,
              width: `${category.zone.width * 100}%`,
              height: `${category.zone.height * 100}%`,
              border: `2px dashed ${category.color}`,
              borderRadius: '1rem',
              backgroundColor: `${category.color}10`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: 0.3
            }}
          >
            <div style={{
              color: category.color,
              fontSize: '1.5rem',
              fontWeight: 'bold',
              textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
              pointerEvents: 'none'
            }}>
              {category.name}
            </div>
          </div>
        ))}
      </div>

      {/* SSE for real-time updates */}
      <div ext-fx-sse-autostart="/nostr/stream" data-target="#visual-feed" data-swap="afterbegin" />
      
      {/* Hidden container for cached images with event data */}
      {cachedImagesWithData.length > 0 && (
        <div id="cached-images" className="hidden">
          {cachedImagesWithData.map((imgData, index) => (
            <div 
              key={`cached-${index}`} 
              data-cached-image-url={imgData.imageUrl}
              data-event-id={imgData.eventId || ''}
              data-event-data={imgData.eventData ? JSON.stringify(imgData.eventData) : ''}
              data-category="art"
              data-correct-category={imgData.correctCategory || 'art'}
            ></div>
          ))}
        </div>
      )}
      
      {/* Hidden container for new images */}
      <div id="visual-feed" className="hidden">
        {items.map((item, index) => (
          <div key={item.id}>
            {item.images.map((img, imgIndex) => (
              <div 
                key={imgIndex} 
                data-image-url={img.url}
                data-category={img.category}
                data-correct-category={img.correctCategory}
                data-event-id={item.id}
                data-event-data={JSON.stringify({
                  id: item.id,
                  pubkey: item.pubkey,
                  content: item.content,
                  created_at: item.created_at
                })}
              ></div>
            ))}
          </div>
        ))}
      </div>
      
      {/* Slider Mode */}
      <div id="slider-mode" className="slider-mode">
        {/* Preview Area (80% of screen) */}
        <div className="preview-area">
          <div className="preview-placeholder">
            Hover over images below for preview
          </div>
          <img id="preview-image" className="preview-image" src="" alt="Preview" />
        </div>
        
        {/* Slider Container (20% of screen) */}
        <div className="slider-container">
          <div id="slider-strip" className="slider-strip">
            {/* Images will be dynamically added here */}
          </div>
        </div>
      </div>

      {/* Loading indicator */}
      {items.length === 0 && cachedImagesWithData.length === 0 && (
        <div className="loading">Loading visual discovery feed...</div>
      )}
    </div>
  );
}

export function NostrPostDetail({ event, author }: { event: any; author?: any }) {
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleString();
  };

  const truncatePubkey = (pubkey: string) => {
    return `${pubkey.slice(0, 8)}...${pubkey.slice(-4)}`;
  };

  // Extract images from content
  const imageRegex = /(https?:\/\/[^\s]+\.(?:jpg|jpeg|png|gif|webp|bmp|svg|tiff|ico)(?:\?[^\s]*)?)/gi;
  const images = event.content.match(imageRegex) || [];
  
  // Remove image URLs from text content
  let textContent = event.content;
  images.forEach(img => {
    textContent = textContent.replace(img, '').trim();
  });

  return (
    <div style={{
      maxWidth: '800px',
      margin: '2rem auto',
      padding: '2rem',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderRadius: '1rem',
      boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
    }}>
      {/* Back button */}
      <button 
        onClick="window.history.back()"
        style={{
          marginBottom: '1.5rem',
          padding: '0.5rem 1rem',
          backgroundColor: '#7c3aed',
          color: 'white',
          border: 'none',
          borderRadius: '0.5rem',
          cursor: 'pointer'
        }}
      >
        ← Back to Discovery
      </button>

      {/* Author Header */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        marginBottom: '1.5rem',
        paddingBottom: '1rem',
        borderBottom: '2px solid #e5e7eb'
      }}>
        {author?.picture ? (
          <img 
            src={author.picture} 
            alt="Profile"
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              objectFit: 'cover',
              border: '3px solid #7c3aed'
            }}
          />
        ) : (
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            backgroundColor: '#7c3aed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.5rem',
            color: 'white'
          }}>
            👤
          </div>
        )}
        
        <div>
          <h1 style={{ 
            margin: 0,
            fontSize: '1.5rem',
            color: '#111827'
          }}>
            {author?.name || truncatePubkey(event.pubkey)}
          </h1>
          <p style={{ 
            margin: '0.5rem 0 0 0',
            color: '#6b7280',
            fontSize: '0.9rem'
          }}>
            {formatTime(event.created_at)}
          </p>
        </div>
      </header>

      {/* Post Content */}
      {textContent && (
        <div style={{
          marginBottom: images.length > 0 ? '2rem' : '0',
          lineHeight: '1.7',
          color: '#374151',
          fontSize: '1.1rem',
          whiteSpace: 'pre-wrap',
          wordWrap: 'break-word'
        }}>
          {e`${textContent}`}
        </div>
      )}

      {/* Images */}
      {images.length > 0 && (
        <div style={{
          display: 'grid',
          gap: '1rem',
          gridTemplateColumns: images.length === 1 ? '1fr' : 
                              images.length === 2 ? '1fr 1fr' : 
                              'repeat(auto-fit, minmax(300px, 1fr))',
          marginBottom: '2rem'
        }}>
          {images.map((img, index) => (
            <img
              key={index}
              src={img}
              alt={`Image ${index + 1}`}
              style={{
                width: '100%',
                height: 'auto',
                maxHeight: '500px',
                objectFit: 'contain',
                borderRadius: '0.75rem',
                border: '2px solid #e5e7eb',
                boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
              }}
              loading="lazy"
            />
          ))}
        </div>
      )}

      {/* Post Metadata */}
      <footer style={{
        paddingTop: '1.5rem',
        borderTop: '2px solid #e5e7eb',
        fontSize: '0.9rem',
        color: '#6b7280',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '1rem'
      }}>
        <div>
          <strong>Event ID:</strong><br />
          <code style={{ fontSize: '0.8rem', wordBreak: 'break-all' }}>{event.id}</code>
        </div>
        <div>
          <strong>Public Key:</strong><br />
          <code style={{ fontSize: '0.8rem', wordBreak: 'break-all' }}>{event.pubkey}</code>
        </div>
      </footer>
    </div>
  );
}

export function CategorizedImageItem({ item }: { item: NostrFeedItem }) {
  return (
    <div className="hidden">
      {item.images.map((img, imgIndex) => (
        <div 
          key={imgIndex} 
          data-image-url={img.url}
          data-category={img.category}
          data-event-id={item.id}
          data-event-data={JSON.stringify({
            id: item.id,
            pubkey: item.pubkey,
            content: item.content,
            created_at: item.created_at
          })}
        ></div>
      ))}
    </div>
  );
}

export function NostrImagePost({ item, index }: { item: NostrFeedItem; index: number }) {
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  const truncatePubkey = (pubkey: string) => {
    return `${pubkey.slice(0, 8)}...${pubkey.slice(-4)}`;
  };

  // Remove image URLs from text content to avoid duplication
  let textContent = item.content;
  item.images.forEach(img => {
    textContent = textContent.replace(img, '').trim();
  });

  // Generate unique IDs for this post
  const postId = `post-${item.id.slice(0, 8)}`;
  const imageId = `img-${item.id.slice(0, 8)}`;
  
  return (
    <article 
      id={postId}
      data-post-index={index}
      style={{
        border: '1px solid rgba(243, 244, 246, 0.8)',
        borderRadius: '1rem',
        padding: '1.5rem',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        transition: 'all 0.3s ease',
        position: 'relative'
      }}
    >
      {/* Author Header */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        marginBottom: '1rem',
        paddingBottom: '0.75rem',
        borderBottom: '1px solid rgba(249, 250, 251, 0.8)'
      }}>
        {item.author?.picture ? (
          <img 
            src={item.author.picture} 
            alt="Profile"
            style={{
              width: '45px',
              height: '45px',
              borderRadius: '50%',
              objectFit: 'cover',
              border: '3px solid #e5e7eb'
            }}
          />
        ) : (
          <div style={{
            width: '45px',
            height: '45px',
            borderRadius: '50%',
            backgroundColor: '#f3f4f6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.3rem'
          }}>
            👤
          </div>
        )}
        
        <div style={{ flex: 1 }}>
          <div style={{ 
            fontWeight: '700', 
            color: '#111827',
            fontSize: '1rem'
          }}>
            {item.author?.name || truncatePubkey(item.pubkey)}
          </div>
          <div style={{ 
            fontSize: '0.85rem', 
            color: '#6b7280'
          }}>
            {formatTime(item.created_at)}
          </div>
        </div>
      </header>

      {/* Big Image Display */}
      <div style={{ marginBottom: textContent ? '1.5rem' : '0' }}>
        {item.images.map((img, imgIndex) => (
          <div
            key={imgIndex}
            className="image-container"
            data-image-url={img}
            data-post-id={postId}
            style={{
              marginBottom: imgIndex < item.images.length - 1 ? '1rem' : '0',
              position: 'relative'
            }}
          >
            <img
              id={`${imageId}-${imgIndex}`}
              src={img}
              alt={`Image ${imgIndex + 1}`}
              className="nostr-image-big"
              style={{
                width: '100%',
                height: 'auto',
                maxHeight: '80vh',
                objectFit: 'contain',
                borderRadius: '0.75rem',
                border: '2px solid #e5e7eb',
                cursor: 'pointer',
                transition: 'all 2s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
              }}
              loading="lazy"
              onLoad={`setTimeout(() => shrinkToBackground('${imageId}-${imgIndex}', '${img}', ${index}, ${imgIndex}), 3000)`}
            />
          </div>
        ))}
      </div>

      {/* Post Content */}
      {textContent && (
        <div style={{
          lineHeight: '1.7',
          color: '#374151',
          whiteSpace: 'pre-wrap',
          wordWrap: 'break-word',
          fontSize: '1rem',
          marginBottom: '1rem'
        }}>
          {e`${textContent}`}
        </div>
      )}

      {/* Post Footer */}
      <footer style={{
        paddingTop: '1rem',
        borderTop: '1px solid rgba(249, 250, 251, 0.8)',
        fontSize: '0.8rem',
        color: '#9ca3af',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span>ID: {item.id.slice(0, 8)}...</span>
        <span>{item.images.length} image{item.images.length > 1 ? 's' : ''}</span>
      </footer>
    </article>
  );
}

export function NostrPost({ item }: { item: NostrFeedItem }) {
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  const truncatePubkey = (pubkey: string) => {
    return `${pubkey.slice(0, 8)}...${pubkey.slice(-4)}`;
  };

  // Remove image URLs from text content to avoid duplication
  let textContent = item.content;
  item.images.forEach(img => {
    textContent = textContent.replace(img, '').trim();
  });

  return (
    <article style={{
      border: '1px solid #f3f4f6',
      borderRadius: '0.5rem',
      padding: '1rem',
      backgroundColor: 'white',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
      transition: 'box-shadow 0.2s'
    }}>
      {/* Author Header */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        marginBottom: '0.75rem',
        paddingBottom: '0.75rem',
        borderBottom: '1px solid #f9fafb'
      }}>
        {item.author?.picture ? (
          <img 
            src={item.author.picture} 
            alt="Profile"
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              objectFit: 'cover',
              border: '2px solid #e5e7eb'
            }}
          />
        ) : (
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: '#f3f4f6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.2rem'
          }}>
            👤
          </div>
        )}
        
        <div style={{ flex: 1 }}>
          <div style={{ 
            fontWeight: '600', 
            color: '#111827',
            fontSize: '0.95rem'
          }}>
            {item.author?.name || truncatePubkey(item.pubkey)}
          </div>
          <div style={{ 
            fontSize: '0.8rem', 
            color: '#6b7280'
          }}>
            {formatTime(item.created_at)}
          </div>
        </div>
      </header>

      {/* Post Content */}
      {textContent && (
        <div style={{
          marginBottom: item.images.length > 0 ? '1rem' : '0',
          lineHeight: '1.6',
          color: '#374151',
          whiteSpace: 'pre-wrap',
          wordWrap: 'break-word'
        }}>
          {e`${textContent}`}
        </div>
      )}

      {/* Images */}
      {item.images.length > 0 && (
        <div style={{
          display: 'grid',
          gap: '0.5rem',
          gridTemplateColumns: item.images.length === 1 ? '1fr' : 
                              item.images.length === 2 ? '1fr 1fr' : 
                              'repeat(auto-fit, minmax(200px, 1fr))'
        }}>
          {item.images.map((img, index) => (
            <img
              key={index}
              src={img}
              alt={`Image ${index + 1}`}
              style={{
                width: '100%',
                height: item.images.length === 1 ? 'auto' : '200px',
                objectFit: 'cover',
                borderRadius: '0.5rem',
                border: '1px solid #e5e7eb',
                cursor: 'pointer'
              }}
              loading="lazy"
            />
          ))}
        </div>
      )}

      {/* Post Footer */}
      <footer style={{
        marginTop: '0.75rem',
        paddingTop: '0.75rem',
        borderTop: '1px solid #f9fafb',
        fontSize: '0.75rem',
        color: '#9ca3af'
      }}>
        ID: {item.id.slice(0, 8)}...
      </footer>
    </article>
  );
}
