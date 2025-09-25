// Clean Views for Multi-Media Nostr Observatory
import { e } from "@kitajs/html";
import type { NostrFeedItem } from "./nostr-service.js";
import type { MediaType, MediaItem } from "./image-classifier.js";
import { MediaClassifier } from "./image-classifier.js";
import type { AgeRating, ContentCategory, FilterSettings } from "./content-filter.js";
import { CONFIG } from "./config.js";
import { TimeTravelControls } from "./time-travel-ui.js";

export function Layout(props: { title?: string; children?: React.ReactNode }) {
  const { title = "Visual Nostr Image Time Machine", children } = props;
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{title}</title>
        
        {/* Load Content Filter Script */}
        <script src="/static/content-filter.js" async></script>
        <script src="/static/general-filter.js" async></script>
        <style>{`
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body { 
            background: #000000;
            min-height: 100vh;
            overflow-x: hidden;
            overflow-y: auto;
            font-family: system-ui;
            margin: 0;
            padding: 0;
            scroll-behavior: smooth;
          }
          
          /* Smooth masonry layout */
          [style*="columns"] {
            column-fill: balance;
          }
          
          /* Prevent layout shift during image loading */
          img[loading="lazy"] {
            will-change: opacity;
            contain: layout style paint;
          }
          
          /* Optimize rendering for smooth animations */
          .content-item {
            transform: translateZ(0);
            backface-visibility: hidden;
          }
          
          /* Smooth transitions for all content */
          .content-item, .content-item * {
            transition: opacity 0.3s ease-in-out;
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
        
        {/* Configuration for client-side */}
        <script>{`
          // Make CONFIG available on client-side
          window.CONFIG = ${JSON.stringify(CONFIG)};
        `}</script>
        
        {/* Time Machine Script - Clean and Simple */}
        <script>{`
          // Image Time Machine - Simplified for masonry mode only
          function log(message, data = null) {
            console.log('[TimeMachine]', message, data || '');
          }
          
          // Smooth image loading to prevent flickering
          let loadedImageCount = 0;
          let totalImageCount = 0;
          let masonryReflowTimeout = null;
          
          window.smoothImageLoad = function(img) {
            // Fade in the image smoothly
            img.style.opacity = '1';
            loadedImageCount++;
            
            // Debounced masonry reflow to prevent layout jumps
            if (masonryReflowTimeout) clearTimeout(masonryReflowTimeout);
            masonryReflowTimeout = setTimeout(() => {
              // Force browser to recalculate masonry layout
              const container = document.querySelector('[style*="columns"]');
              if (container) {
                const currentDisplay = container.style.display;
                container.style.display = 'none';
                container.offsetHeight; // Force reflow
                container.style.display = currentDisplay;
              }
            }, 150);
          };
          
          // Pre-calculate image dimensions to prevent layout shift
          window.preloadImageDimensions = function() {
            const images = document.querySelectorAll('img[loading="lazy"]');
            totalImageCount = images.length;
            
            images.forEach(img => {
              if (img.naturalWidth === 0) {
                // Set minimum height to prevent layout shift
                img.style.minHeight = '200px';
                img.style.backgroundColor = 'rgba(255,255,255,0.05)';
                
                const tempImg = new Image();
                tempImg.onload = function() {
                  // Calculate aspect ratio and set proper height
                  const aspectRatio = this.naturalHeight / this.naturalWidth;
                  const containerWidth = img.offsetWidth;
                  const calculatedHeight = containerWidth * aspectRatio;
                  
                  img.style.minHeight = calculatedHeight + 'px';
                  img.style.backgroundColor = 'transparent';
                };
                tempImg.src = img.src;
              }
            });
          };
          
          // Smooth scroll behavior
          document.documentElement.style.scrollBehavior = 'smooth';
          
          // Initialize time machine
          document.addEventListener('DOMContentLoaded', () => {
            log('🕰️ Image Time Machine initialized');
            log('🎬 Professional timeline controls active');
            
            // Initialize smooth loading
            setTimeout(preloadImageDimensions, 100);
          });
          
          // Minimal compatibility functions
          window.addNostrImage = function(imageUrl, eventId, eventData, category, correctCategory) {
            // Time machine handles all image storage automatically
            log('📸 New image added to time machine:', imageUrl.slice(0, 50) + '...');
          };
          
          // Global error handler
          window.addEventListener('error', (event) => {
            log('Error caught:', event.error);
          });
        `}</script>
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}

export function ModernDiscoveryFeed({ items, cachedImagesWithData = [], timeMachineMedia = [], displayMode = 'masonry', timeMachineData, activeMediaType = 'mix' }: { 
  items: NostrFeedItem[]; 
  cachedImagesWithData?: Array<{ imageUrl: string; eventId?: string; eventData?: any; correctCategory?: string }>;
  timeMachineMedia?: any[];
  displayMode?: string;
  activeMediaType?: string;
  timeMachineData?: {
    currentTimeRange: { start: number; end: number };
    availablePeriods: Array<{ start: number; end: number; count: number; label: string }>;
    totalImages: number;
    mediaStats?: Record<string, number>;
  };
}) {
  // Helper functions for server-side rendering
  const getMediaTypeColor = (type: string) => {
    const colors = {
      image: '#ec4899',    // Pink
      video: '#667eea',    // Blue
      audio: '#f093fb',    // Purple
      document: '#a8edea', // Cyan
      link: '#ffecd2'      // Orange
    };
    return colors[type as keyof typeof colors] || '#6b7280';
  };
  
  const getMediaTypeIcon = (type: string) => {
    const icons = {
      image: '📸',
      video: '🎥',
      audio: '🎵',
      document: '📄',
      link: '🔗'
    };
    return icons[type as keyof typeof icons] || '📄';
  };

  // 🎬 NEW: Convert items to multi-media format for masonry with aggressive deduplication
  const allMediaItems: any[] = [];
  const seenUrls = new Set<string>(); // Track URLs to prevent visual duplicates
  
  // Add cached images (legacy compatibility)
  cachedImagesWithData.forEach(cached => {
    // Skip if we've already seen this URL
    if (seenUrls.has(cached.imageUrl)) {
      return;
    }
    seenUrls.add(cached.imageUrl);
    
    allMediaItems.push({
      url: cached.imageUrl,
      eventId: cached.eventId || '',
      type: 'image',
      title: 'Image',
      category: cached.correctCategory || 'art'
    });
  });
  
  // Add time machine media (for specific media type views)
  timeMachineMedia.forEach(mediaItem => {
    if (!seenUrls.has(mediaItem.url)) {
      seenUrls.add(mediaItem.url);
      allMediaItems.push({
        url: mediaItem.url,
        eventId: mediaItem.eventId || '',
        type: mediaItem.type,
        title: mediaItem.title || mediaItem.type.charAt(0).toUpperCase() + mediaItem.type.slice(1),
        thumbnail: mediaItem.thumbnail,
        subtype: mediaItem.subtype,
        category: mediaItem.category || 'art'
      });
    }
  });
  
  // Add new multi-media items from feed
  items.forEach(item => {
    if (item.media) {
      // Add all media types based on active filter (with deduplication)
      if (activeMediaType === 'mix' || activeMediaType === 'image') {
        item.media.images.forEach(img => {
          if (!seenUrls.has(img.url)) {
            seenUrls.add(img.url);
            allMediaItems.push({
              url: img.url,
              eventId: item.id,
              type: 'image',
              title: img.title || 'Image',
              thumbnail: img.thumbnail,
              category: 'art'
            });
          }
        });
      }
      
      if (activeMediaType === 'mix' || activeMediaType === 'video') {
        item.media.videos.forEach(video => {
          if (!seenUrls.has(video.url)) {
            seenUrls.add(video.url);
            allMediaItems.push({
              url: video.url,
              eventId: item.id,
              type: 'video',
              title: video.title || 'Video',
              thumbnail: video.thumbnail,
              subtype: video.subtype
            });
          }
        });
      }
      
      if (activeMediaType === 'mix' || activeMediaType === 'audio') {
        item.media.audio.forEach(audio => {
          if (!seenUrls.has(audio.url)) {
            seenUrls.add(audio.url);
            allMediaItems.push({
              url: audio.url,
              eventId: item.id,
              type: 'audio',
              title: audio.title || 'Audio',
              subtype: audio.subtype
            });
          }
        });
      }
      
      if (activeMediaType === 'mix' || activeMediaType === 'document') {
        item.media.documents.forEach(doc => {
          if (!seenUrls.has(doc.url)) {
            seenUrls.add(doc.url);
            allMediaItems.push({
              url: doc.url,
              eventId: item.id,
              type: 'document',
              title: doc.title || 'Document',
              subtype: doc.subtype
            });
          }
        });
      }
    }
    
    // Legacy support for old image format (with deduplication)
    item.images?.forEach(img => {
      if ((activeMediaType === 'mix' || activeMediaType === 'image') && !seenUrls.has(img.url)) {
        seenUrls.add(img.url);
        allMediaItems.push({
          url: img.url,
          eventId: item.id,
          type: 'image',
          title: 'Image',
          category: img.correctCategory
        });
      }
    });
  });

  return (
    <div id="modern-discovery-feed" style={{
      background: '#0a0a0a',
      minHeight: '100vh',
      color: 'white',
      overflowY: 'auto',
      overflowX: 'hidden'
    }}>
      {/* Media Type Filter Buttons */}
      <div style={{
        position: 'fixed',
        top: '110px', // Below timeline
        left: '20px',
        zIndex: 9999,
        display: 'flex',
        gap: '8px',
        background: 'rgba(0,0,0,0.9)',
        padding: '10px',
        borderRadius: '12px',
        border: '2px solid rgba(124,58,237,0.4)'
      }}>
        <button 
          onclick={`window.location.href='/?type=image'`}
          style={{
            background: activeMediaType === 'image' ? 'rgba(124,58,237,0.9)' : 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.3)',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: '600'
          }}
        >
          📸 Images {timeMachineData?.mediaStats?.image ? `(${timeMachineData.mediaStats.image})` : ''}
        </button>
        
        <button 
          onclick={`window.location.href='/?type=video'`}
          style={{
            background: activeMediaType === 'video' ? 'rgba(124,58,237,0.9)' : 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.3)',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: '600'
          }}
        >
          🎥 Videos {timeMachineData?.mediaStats?.video ? `(${timeMachineData.mediaStats.video})` : ''}
        </button>
        
        <button 
          onclick={`window.location.href='/?type=audio'`}
          style={{
            background: activeMediaType === 'audio' ? 'rgba(124,58,237,0.9)' : 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.3)',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: '600'
          }}
        >
          🎵 Audio {timeMachineData?.mediaStats?.audio ? `(${timeMachineData.mediaStats.audio})` : ''}
        </button>
        
        <button 
          onclick={`window.location.href='/?type=document'`}
          style={{
            background: activeMediaType === 'document' ? 'rgba(124,58,237,0.9)' : 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.3)',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: '600'
          }}
        >
          📄 Docs {timeMachineData?.mediaStats?.document ? `(${timeMachineData.mediaStats.document})` : ''}
        </button>
        
        <button 
          onclick={`window.location.href='/?type=mix'`}
          style={{
            background: activeMediaType === 'mix' ? 'rgba(16,185,129,0.9)' : 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.3)',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: '600'
          }}
        >
          🌀 Mix View
        </button>
        
        {/* Age Rating Filter */}
        <button 
          onclick="toggleContentFilter()"
          id="filter-toggle-btn"
          style={{
            background: 'rgba(255,107,107,0.2)',
            border: '1px solid rgba(255,107,107,0.4)',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: '600'
          }}
          title="Toggle age rating filter"
        >
          [18+] Filter
        </button>
        
        {/* Content Safety Filter */}
        <button 
          onclick="toggleCategoryFilter()"
          id="category-filter-btn"
          style={{
            background: 'rgba(124,58,237,0.2)',
            border: '1px solid rgba(124,58,237,0.4)',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: '600'
          }}
          title="Toggle content safety filter"
        >
          🔞 Safety
        </button>
        
        {/* General Category Filter */}
        <button 
          onclick="toggleGeneralFilter()"
          id="general-filter-btn"
          style={{
            background: 'rgba(16,185,129,0.2)',
            border: '1px solid rgba(16,185,129,0.4)',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: '600'
          }}
          title="Toggle general category filter"
        >
          🎨 Topics
        </button>
      </div>

      {/* Filter Settings Panel */}
      <div id="filter-settings-panel" style={{
        position: 'fixed',
        top: '170px',
        right: '20px',
        zIndex: 10000,
        width: '300px',
        background: 'rgba(0,0,0,0.95)',
        borderRadius: '12px',
        border: '2px solid rgba(255,107,107,0.4)',
        padding: '20px',
        display: 'none',
        boxShadow: '0 8px 32px rgba(0,0,0,0.8)'
      }}>
        <h3 style={{
          color: 'white',
          marginBottom: '16px',
          fontSize: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          [18+] Content Filter Settings
        </h3>
        
        {/* Age Rating */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ color: 'white', fontSize: '14px', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>
            Maximum Age Rating:
          </label>
          <select id="age-rating-select" style={{
            width: '100%',
            padding: '8px',
            borderRadius: '6px',
            border: '1px solid rgba(255,255,255,0.3)',
            background: 'rgba(255,255,255,0.1)',
            color: 'white',
            fontSize: '14px'
          }}>
            <option value="0">FSK 0 - All Ages</option>
            <option value="6">FSK 6 - Ages 6+</option>
            <option value="12">FSK 12 - Ages 12+</option>
            <option value="16" selected>FSK 16 - Ages 16+</option>
            <option value="18">FSK 18 - Adults Only</option>
          </select>
        </div>
        
        {/* Category Blocking */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ color: 'white', fontSize: '14px', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>
            Block Categories:
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'white', fontSize: '13px' }}>
              <input type="checkbox" id="block-porn" checked style={{ accentColor: '#ff6b6b' }} />
              [18+] Porn
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'white', fontSize: '13px' }}>
              <input type="checkbox" id="block-hentai" checked style={{ accentColor: '#ff6b6b' }} />
              🎨 Hentai
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'white', fontSize: '13px' }}>
              <input type="checkbox" id="block-sexy" style={{ accentColor: '#ff6b6b' }} />
              💋 Sexy
            </label>
          </div>
        </div>
        
        {/* Filter Options */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'white', fontSize: '13px', marginBottom: '6px' }}>
            <input type="checkbox" id="blur-sensitive" checked style={{ accentColor: '#ff6b6b' }} />
            🌫️ Blur sensitive content
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'white', fontSize: '13px' }}>
            <input type="checkbox" id="show-warnings" checked style={{ accentColor: '#ff6b6b' }} />
            Warning Show content warnings
          </label>
        </div>
        
        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onclick="saveFilterSettings()" style={{
            background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 16px',
            color: 'white',
            fontSize: '12px',
            fontWeight: 'bold',
            cursor: 'pointer',
            flex: 1
          }}>
            Save Save
          </button>
          <button onclick="closeFilterSettings()" style={{
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: '8px',
            padding: '8px 16px',
            color: 'white',
            fontSize: '12px',
            fontWeight: 'bold',
            cursor: 'pointer',
            flex: 1
          }}>
            X Close
          </button>
        </div>
      </div>

      {/* Category Filter Panel */}
      <div id="category-filter-panel" style={{
        position: 'fixed',
        top: '170px',
        right: '340px', // Next to age rating panel
        zIndex: 10000,
        width: '280px',
        background: 'rgba(0,0,0,0.95)',
        borderRadius: '12px',
        border: '2px solid rgba(124,58,237,0.4)',
        padding: '20px',
        display: 'none',
        boxShadow: '0 8px 32px rgba(0,0,0,0.8)'
      }}>
        <h3 style={{
          color: 'white',
          marginBottom: '16px',
          fontSize: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          🔞 Content Safety Filter
        </h3>
        
        <div style={{ marginBottom: '12px', fontSize: '13px', color: '#9ca3af' }}>
          Select categories to show (uncheck to hide):
        </div>
        
        {/* Category Checkboxes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'white', fontSize: '14px' }}>
            <input type="checkbox" id="show-neutral" checked style={{ accentColor: '#10b981' }} />
            <span style={{ background: '#10b981', padding: '2px 6px', borderRadius: '8px', fontSize: '10px', fontWeight: 'bold' }}>NEUTRAL</span>
            <span style={{ fontSize: '12px', opacity: '0.8' }}>Safe, general content</span>
          </label>
          
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'white', fontSize: '14px' }}>
            <input type="checkbox" id="show-drawing" checked style={{ accentColor: '#3b82f6' }} />
            <span style={{ background: '#3b82f6', padding: '2px 6px', borderRadius: '8px', fontSize: '10px', fontWeight: 'bold' }}>DRAWING</span>
            <span style={{ fontSize: '12px', opacity: '0.8' }}>Art, illustrations</span>
          </label>
          
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'white', fontSize: '14px' }}>
            <input type="checkbox" id="show-sexy" checked style={{ accentColor: '#f59e0b' }} />
            <span style={{ background: '#f59e0b', padding: '2px 6px', borderRadius: '8px', fontSize: '10px', fontWeight: 'bold' }}>SEXY</span>
            <span style={{ fontSize: '12px', opacity: '0.8' }}>Suggestive, bikinis</span>
          </label>
          
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'white', fontSize: '14px' }}>
            <input type="checkbox" id="show-porn" style={{ accentColor: '#ef4444' }} />
            <span style={{ background: '#ef4444', padding: '2px 6px', borderRadius: '8px', fontSize: '10px', fontWeight: 'bold' }}>PORN</span>
            <span style={{ fontSize: '12px', opacity: '0.8' }}>Explicit content</span>
          </label>
          
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'white', fontSize: '14px' }}>
            <input type="checkbox" id="show-hentai" style={{ accentColor: '#7c2d12' }} />
            <span style={{ background: '#7c2d12', padding: '2px 6px', borderRadius: '8px', fontSize: '10px', fontWeight: 'bold' }}>HENTAI</span>
            <span style={{ fontSize: '12px', opacity: '0.8' }}>Animated adult</span>
          </label>
        </div>
        
        {/* Quick Presets */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ color: 'white', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' }}>Quick Presets:</div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <button onclick="setCategoryPreset('safe')" style={{
              background: '#10b981',
              border: 'none',
              borderRadius: '6px',
              padding: '4px 8px',
              color: 'white',
              fontSize: '11px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}>
              🛡️ Safe
            </button>
            <button onclick="setCategoryPreset('moderate')" style={{
              background: '#f59e0b',
              border: 'none',
              borderRadius: '6px',
              padding: '4px 8px',
              color: 'white',
              fontSize: '11px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}>
              ⚖️ Moderate
            </button>
            <button onclick="setCategoryPreset('all')" style={{
              background: '#6b7280',
              border: 'none',
              borderRadius: '6px',
              padding: '4px 8px',
              color: 'white',
              fontSize: '11px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}>
              🌐 All
            </button>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onclick="applyCategoryFilter()" style={{
            background: 'linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%)',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 16px',
            color: 'white',
            fontSize: '12px',
            fontWeight: 'bold',
            cursor: 'pointer',
            flex: 1
          }}>
            ✨ Apply
          </button>
          <button onclick="closeCategoryFilter()" style={{
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: '8px',
            padding: '8px 16px',
            color: 'white',
            fontSize: '12px',
            fontWeight: 'bold',
            cursor: 'pointer',
            flex: 1
          }}>
            ✖ Close
          </button>
        </div>
      </div>

      {/* General Topics Filter Panel */}
      <div id="general-filter-panel" style={{
        position: 'fixed',
        top: '170px',
        right: '640px', // Next to safety filter panel
        zIndex: 10000,
        width: '300px',
        background: 'rgba(0,0,0,0.95)',
        borderRadius: '12px',
        border: '2px solid rgba(16,185,129,0.4)',
        padding: '20px',
        display: 'none',
        boxShadow: '0 8px 32px rgba(0,0,0,0.8)',
        maxHeight: '500px',
        overflowY: 'auto'
      }}>
        <h3 style={{
          color: 'white',
          marginBottom: '16px',
          fontSize: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          🎨 General Topics Filter
        </h3>
        
        <div style={{ marginBottom: '12px', fontSize: '13px', color: '#9ca3af' }}>
          AI detects 1000+ categories. Select topics to show:
        </div>
        
        {/* Popular Categories */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ color: 'white', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' }}>🔥 Popular Topics:</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'white', fontSize: '13px' }}>
              <input type="checkbox" id="show-food" checked style={{ accentColor: '#f59e0b' }} />
              🍕 Food & Drinks
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'white', fontSize: '13px' }}>
              <input type="checkbox" id="show-animals" checked style={{ accentColor: '#10b981' }} />
              🐕 Animals & Pets
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'white', fontSize: '13px' }}>
              <input type="checkbox" id="show-sports" checked style={{ accentColor: '#3b82f6' }} />
              ⚽ Sports & Activities
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'white', fontSize: '13px' }}>
              <input type="checkbox" id="show-vehicles" checked style={{ accentColor: '#ef4444' }} />
              🚗 Vehicles & Transport
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'white', fontSize: '13px' }}>
              <input type="checkbox" id="show-nature" checked style={{ accentColor: '#22c55e' }} />
              🌳 Nature & Landscapes
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'white', fontSize: '13px' }}>
              <input type="checkbox" id="show-technology" checked style={{ accentColor: '#8b5cf6' }} />
              💻 Technology & Electronics
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'white', fontSize: '13px' }}>
              <input type="checkbox" id="show-fashion" checked style={{ accentColor: '#ec4899' }} />
              👗 Fashion & Style
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'white', fontSize: '13px' }}>
              <input type="checkbox" id="show-architecture" checked style={{ accentColor: '#6b7280' }} />
              🏠 Buildings & Architecture
            </label>
          </div>
        </div>
        
        {/* AI Status */}
        <div style={{ 
          background: 'rgba(16,185,129,0.1)', 
          border: '1px solid rgba(16,185,129,0.3)',
          borderRadius: '8px',
          padding: '8px',
          marginBottom: '16px',
          fontSize: '11px',
          color: '#10b981'
        }}>
          🤖 MobileNet AI: Loading in background... Classifications will improve over time.
        </div>
        
        {/* Quick Presets */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ color: 'white', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' }}>Quick Presets:</div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <button onclick="setGeneralPreset('popular')" style={{
              background: '#f59e0b',
              border: 'none',
              borderRadius: '6px',
              padding: '4px 8px',
              color: 'white',
              fontSize: '11px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}>
              🔥 Popular
            </button>
            <button onclick="setGeneralPreset('lifestyle')" style={{
              background: '#ec4899',
              border: 'none',
              borderRadius: '6px',
              padding: '4px 8px',
              color: 'white',
              fontSize: '11px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}>
              🎨 Lifestyle
            </button>
            <button onclick="setGeneralPreset('all')" style={{
              background: '#6b7280',
              border: 'none',
              borderRadius: '6px',
              padding: '4px 8px',
              color: 'white',
              fontSize: '11px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}>
              🌐 All
            </button>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onclick="applyGeneralFilter()" style={{
            background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 16px',
            color: 'white',
            fontSize: '12px',
            fontWeight: 'bold',
            cursor: 'pointer',
            flex: 1
          }}>
            ✨ Apply
          </button>
          <button onclick="closeGeneralFilter()" style={{
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: '8px',
            padding: '8px 16px',
            color: 'white',
            fontSize: '12px',
            fontWeight: 'bold',
            cursor: 'pointer',
            flex: 1
          }}>
            ✖ Close
          </button>
        </div>
      </div>

      {/* Professional Multi-Media Grid */}
      <div style={{
        columns: 'auto 280px', // Slightly wider for video/audio players
        columnGap: '20px',
        padding: '200px 20px 40px', // Extra padding for media type filters
        minHeight: 'calc(100vh - 200px)'
      }}>
        {allMediaItems.map((item, index) => (
          <div 
            key={index}
            style={{
              breakInside: 'avoid',
              marginBottom: '20px',
              borderRadius: '12px',
              overflow: 'hidden',
              background: 'rgba(255,255,255,0.08)',
              cursor: 'pointer',
              border: `2px solid ${getMediaTypeColor(item.type)}`,
              transition: 'all 0.3s ease'
            }}
            onclick={`window.open('/nostr/post/${item.eventId}', '_blank')`}
          >
            {/* Media Content Based on Type */}
            {item.type === 'image' && (
              <div style={{ position: 'relative' }} className="content-item" data-url={item.url}>
                <img
                  src={item.url} 
                  alt="Nostr Image"
                  style={{
                    width: '100%',
                    height: 'auto',
                    display: 'block',
                    opacity: 0,
                    transition: 'opacity 0.3s ease-in-out'
                  }}
                  loading="lazy"
                  onload="smoothImageLoad(this); window.classifyImage && window.classifyImage(this); window.classifyGeneralImage && window.classifyGeneralImage(this)"
                />
                
                {/* AI Classification Tags */}
                <div className="ai-tags" style={{
                  position: 'absolute',
                  top: '8px',
                  left: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  zIndex: 10,
                  pointerEvents: 'none'
                }}>
                  {/* Content Safety Tag */}
                  <div className="safety-tag" style={{
                    background: 'rgba(124,58,237,0.9)',
                    color: 'white',
                    padding: '2px 6px',
                    borderRadius: '8px',
                    fontSize: '9px',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    backdropFilter: 'blur(4px)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    display: 'none'
                  }}>NEUTRAL</div>
                  
                  {/* General Topic Tag */}
                  <div className="topic-tag" style={{
                    background: 'rgba(16,185,129,0.9)',
                    color: 'white',
                    padding: '2px 6px',
                    borderRadius: '8px',
                    fontSize: '9px',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    backdropFilter: 'blur(4px)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    display: 'none'
                  }}>GENERAL</div>
                  
                  {/* Confidence Indicator */}
                  <div className="confidence-tag" style={{
                    background: 'rgba(0,0,0,0.7)',
                    color: 'white',
                    padding: '1px 4px',
                    borderRadius: '6px',
                    fontSize: '8px',
                    fontWeight: 'bold',
                    backdropFilter: 'blur(4px)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    display: 'none'
                  }}>AI</div>
                </div>

                {/* Content Warning Overlay (hidden by default) */}
                <div className="content-warning-overlay" style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'rgba(0,0,0,0.9)',
                  display: 'none',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  textAlign: 'center',
                  cursor: 'pointer'
                }} onClick="revealContent(this)">
                  <div style={{ fontSize: '48px', marginBottom: '12px' }}>[18+]</div>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>Sensitive Content</div>
                  <div className="age-rating" style={{ fontSize: '14px', marginBottom: '8px', padding: '4px 8px', background: '#ff6b6b', borderRadius: '12px' }}>FSK 18+</div>
                  <div style={{ fontSize: '12px', opacity: 0.8, marginBottom: '12px' }}>Click to reveal</div>
                  <div style={{ fontSize: '10px', opacity: 0.6 }}>Warning: May contain adult content</div>
                </div>
              </div>
            )}
            
            {item.type === 'video' && (
              <div style={{ position: 'relative' }}>
                {item.thumbnail ? (
                  <div style={{ position: 'relative' }}>
                    <img 
                      src={item.thumbnail}
                      alt="Video Thumbnail"
                      style={{
                        width: '100%',
                        height: 'auto',
                        display: 'block',
                        opacity: 0,
                        transition: 'opacity 0.3s ease-in-out'
                      }}
                      loading="lazy"
                      onload="smoothImageLoad(this)"
                    />
                    <div style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      background: 'rgba(0,0,0,0.8)',
                      borderRadius: '50%',
                      width: '60px',
                      height: '60px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '24px'
                    }}>
                      ▶️
                    </div>
                  </div>
                ) : (
                  <div style={{
                    width: '100%',
                    height: '200px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '48px'
                  }}>
                    🎥
                  </div>
                )}
              </div>
            )}
            
            {item.type === 'audio' && (
              <div style={{
                width: '100%',
                height: '150px',
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '48px',
                gap: '10px'
              }}>
                <div>🎵</div>
                <div style={{ fontSize: '12px', opacity: 0.8 }}>
                  {item.subtype?.toUpperCase() || 'AUDIO'}
                </div>
              </div>
            )}
            
            {item.type === 'document' && (
              <div style={{
                width: '100%',
                height: '180px',
                background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '48px',
                gap: '10px',
                color: '#333'
              }}>
                <div>📄</div>
                <div style={{ fontSize: '12px', opacity: 0.7 }}>
                  {item.subtype?.toUpperCase() || 'DOCUMENT'}
                </div>
              </div>
            )}
            
            {item.type === 'link' && (
              <div style={{
                width: '100%',
                height: '120px',
                background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '36px',
                gap: '8px',
                color: '#333'
              }}>
                <div>🔗</div>
                <div style={{ fontSize: '10px', opacity: 0.7, textAlign: 'center', padding: '0 10px' }}>
                  {item.title || 'External Link'}
                </div>
              </div>
            )}

            {/* Media Info Footer */}
            <div style={{
              padding: '12px',
              fontSize: '12px',
              opacity: '0.9',
              background: 'rgba(0,0,0,0.3)'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{
                  display: 'inline-block',
                  padding: '4px 8px',
                  background: getMediaTypeColor(item.type),
                  borderRadius: '12px',
                  fontSize: '10px',
                  fontWeight: 'bold'
                }}>
                  {getMediaTypeIcon(item.type)} {item.type.toUpperCase()}
                </div>
                <div style={{ fontSize: '10px', opacity: 0.7 }}>
                  {item.title}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Loading State */}
      {allMediaItems.length === 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          textAlign: 'center'
        }}>
          <div>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>
              {activeMediaType === 'image' ? '📸' :
               activeMediaType === 'video' ? '🎥' :
               activeMediaType === 'audio' ? '🎵' :
               activeMediaType === 'document' ? '📄' : '🌀'}
            </div>
            <div>Loading {activeMediaType === 'mix' ? 'multi-media' : activeMediaType} observatory...</div>
            <div style={{ fontSize: '14px', opacity: '0.7', marginTop: '8px' }}>
              {timeMachineData ? 
                `Time traveling through ${activeMediaType} content...` :
                'Connecting to global Nostr network...'
              }
            </div>
          </div>
        </div>
      )}

      {/* Time Travel Controls */}
      {timeMachineData && (
        <TimeTravelControls
          currentTimeRange={timeMachineData.currentTimeRange}
          totalImages={timeMachineData.totalImages}
          availablePeriods={timeMachineData.availablePeriods}
          onTimeTravel={() => {}}
          onJumpToNow={() => {}}
        />
      )}
      
      <script>{`
        // Enable smooth scrolling
        document.documentElement.style.scrollBehavior = 'smooth';
        
        // Optimize scroll performance
        document.addEventListener('DOMContentLoaded', function() {
          // Add scroll-to-top button
          const scrollButton = document.createElement('button');
          scrollButton.innerHTML = '↑';
          scrollButton.style.cssText = \`
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 50px;
            height: 50px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border: none;
            border-radius: 50%;
            color: white;
            font-size: 20px;
            cursor: pointer;
            z-index: 1000;
            opacity: 0;
            transition: all 0.3s ease;
            box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);
          \`;
          
          scrollButton.addEventListener('click', function() {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          });
          
          document.body.appendChild(scrollButton);
          
          // Show/hide scroll button based on scroll position
          window.addEventListener('scroll', function() {
            if (window.scrollY > 300) {
              scrollButton.style.opacity = '1';
              scrollButton.style.transform = 'scale(1)';
            } else {
              scrollButton.style.opacity = '0';
              scrollButton.style.transform = 'scale(0.8)';
            }
          });
          
          // Keyboard shortcuts for scrolling
          document.addEventListener('keydown', function(e) {
            if (e.key === 'Home') {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
            if (e.key === 'End') {
              e.preventDefault();
              window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
            }
            if (e.key === 'PageUp') {
              e.preventDefault();
              window.scrollBy({ top: -window.innerHeight * 0.8, behavior: 'smooth' });
            }
            if (e.key === 'PageDown') {
              e.preventDefault();
              window.scrollBy({ top: window.innerHeight * 0.8, behavior: 'smooth' });
            }
          });
          
          console.log('🎬 Multi-Media Observatory loaded');
          console.log('📜 Smooth scrolling enabled - use mouse wheel, arrow keys, or scroll button');
        });
        
        // Helper functions for media type styling
        function getMediaTypeColor(type) {
          const colors = {
            image: '#ec4899',    // Pink
            video: '#667eea',    // Blue
            audio: '#f093fb',    // Purple
            document: '#a8edea', // Cyan
            link: '#ffecd2'      // Orange
          };
          return colors[type] || '#6b7280';
        }
        
        function getMediaTypeIcon(type) {
          const icons = {
            image: '📸',
            video: '🎥',
            audio: '🎵',
            document: '📄',
            link: '🔗'
          };
          return icons[type] || '📄';
        }
        
        // Make functions globally available
        window.getMediaTypeColor = getMediaTypeColor;
        window.getMediaTypeIcon = getMediaTypeIcon;
        
        // [18+] BASIC CONTENT FILTER SYSTEM
        let nsfwModel = null;
        let isFilterActive = false;
        let imageClassifications = new Map(); // Store classifications
        let classificationQueue = [];
        
        // Queue image for background classification
        window.queueImageClassification = function(imgElement) {
          if (!imgElement.complete) return;
          
          // Add to classification queue
          classificationQueue.push(imgElement);
          
          // Process queue in background
          if (nsfwModel) {
            processClassificationQueue();
          }
        };
        
        // Load NSFWJS model in background
        async function initializeContentFilter() {
          try {
            console.log('[18+] Loading NSFWJS model in background...');
            
            // Load from CDN
            if (!window.tf) {
              const script1 = document.createElement('script');
              script1.src = 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js';
              document.head.appendChild(script1);
              await new Promise(resolve => script1.onload = resolve);
            }
            
            if (!window.nsfwjs) {
              const script2 = document.createElement('script');
              script2.src = 'https://cdn.jsdelivr.net/npm/nsfwjs@4.2.1/dist/nsfwjs.min.js';
              document.head.appendChild(script2);
              await new Promise(resolve => script2.onload = resolve);
            }
            
            // Initialize model
            nsfwModel = await window.nsfwjs.load();
            console.log('✅ NSFWJS model loaded - background classification active');
            
            // Process any queued images
            processClassificationQueue();
            
          } catch (error) {
            console.error('❌ NSFWJS not available:', error);
            console.log('Warning Content filter will work without AI classification');
          }
        }
        
        // Process classification queue in background
        async function processClassificationQueue() {
          if (!nsfwModel || classificationQueue.length === 0) return;
          
          // Process one image at a time to avoid blocking UI
          const img = classificationQueue.shift();
          if (!img || !img.complete) return;
          
          try {
            const predictions = await nsfwModel.classify(img);
            const classification = convertPredictionsToClassification(predictions);
            
            // Store classification
            imageClassifications.set(img.src, classification);
            
            console.log('[18+] Classified:', img.src.slice(0, 30) + '...', '→', classification.category, classification.ageRating + '+');
            
            // Apply filter if currently active
            if (isFilterActive) {
              applyFilterToImage(img, classification);
            }
            
          } catch (error) {
            console.error('Classification error:', error);
          }
          
          // Continue processing queue
          if (classificationQueue.length > 0) {
            setTimeout(processClassificationQueue, 100); // Small delay to avoid blocking
          }
        }
        
        // Convert NSFWJS predictions to simple classification
        function convertPredictionsToClassification(predictions) {
          const maxPred = predictions.reduce((max, pred) => 
            pred.probability > max.probability ? pred : max
          );
          
          const category = maxPred.className;
          const confidence = maxPred.probability;
          
          // Simple age rating logic
          let ageRating = '0';
          let shouldBlur = false;
          
          if (category === 'Porn' && confidence > 0.5) {
            ageRating = '18';
            shouldBlur = true;
          } else if (category === 'Hentai' && confidence > 0.4) {
            ageRating = '18';
            shouldBlur = true;
          } else if (category === 'Sexy' && confidence > 0.6) {
            ageRating = '16';
            shouldBlur = true;
          } else if (category === 'Sexy' && confidence > 0.3) {
            ageRating = '12';
          } else if (category === 'Drawing') {
            ageRating = '6';
          }
          
          return { ageRating, category, confidence, shouldBlur };
        }
        
        // Apply filter to specific image
        function applyFilterToImage(img, classification) {
          if (!classification.shouldBlur) return;
          
          const container = img.closest('.content-item');
          const overlay = container.querySelector('.content-warning-overlay');
          
          if (overlay) {
            overlay.style.display = 'flex';
            overlay.querySelector('.age-rating').textContent = 'FSK ' + classification.ageRating + '+';
            img.style.filter = 'blur(20px)';
          }
        }
        
        // Toggle filter on/off
        window.toggleContentFilter = function() {
          isFilterActive = !isFilterActive;
          
          // Update button
          const btn = document.getElementById('filter-toggle-btn');
          if (btn) {
            btn.style.background = isFilterActive ? 'rgba(255,107,107,0.8)' : 'rgba(255,107,107,0.2)';
            btn.innerHTML = isFilterActive ? '[18+] Filter ON' : '[18+] Filter OFF';
          }
          
          if (isFilterActive) {
            // Apply filters to all classified images
            imageClassifications.forEach((classification, imgSrc) => {
              const img = document.querySelector('img[src="' + imgSrc + '"]');
              if (img) {
                applyFilterToImage(img, classification);
              }
            });
            console.log('[18+] Content filter activated');
          } else {
            // Remove all filters
            document.querySelectorAll('.content-item img').forEach(img => {
              img.style.filter = 'none';
              const overlay = img.closest('.content-item').querySelector('.content-warning-overlay');
              if (overlay) overlay.style.display = 'none';
            });
            console.log('[18+] Content filter deactivated');
          }
        };
        
        // Reveal censored content
        window.revealContent = function(overlayElement) {
          const img = overlayElement.parentElement.querySelector('img');
          img.style.filter = 'none';
          overlayElement.style.display = 'none';
          console.log('👁️ Content revealed by user');
        };
        
        // Initialize content filter when page loads
        setTimeout(() => {
          initializeContentFilter();
          console.log('[18+] Content filter system initialized');
        }, 1000);
      `}</script>
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

  // Extract different media types from content
  const imageRegex = /(https?:\/\/[^\s]+\.(?:jpg|jpeg|png|gif|webp|bmp|svg|tiff|ico|avif|heic)(?:\?[^\s]*)?)/gi;
  const videoRegex = /(https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|vimeo\.com\/)[^\s]+)/gi;
  const audioRegex = /(https?:\/\/[^\s]+\.(?:mp3|wav|ogg|m4a|flac|aac)(?:\?[^\s]*)?|https?:\/\/(?:open\.)?spotify\.com\/[^\s]+)/gi;
  const documentRegex = /(https?:\/\/[^\s]+\.(?:pdf|doc|docx|ppt|pptx)(?:\?[^\s]*)?)/gi;
  
  const images = event.content.match(imageRegex) || [];
  const videos = event.content.match(videoRegex) || [];
  const audio = event.content.match(audioRegex) || [];
  const documents = event.content.match(documentRegex) || [];
  
  // Remove media URLs from text content
  let textContent = event.content;
  [...images, ...videos, ...audio, ...documents].forEach(url => {
    textContent = textContent.replace(url, '').trim();
  });
  
  // Clean up extra whitespace
  textContent = textContent.replace(/\s+/g, ' ').trim();

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
        ← Back to Time Machine
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
        
        <div style={{ flex: 1 }}>
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
        
        {/* HEART + SHOW MORE Actions */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          alignItems: 'flex-end'
        }}>
          <button
            onclick={`likePost('${event.id}', '${author?.name || truncatePubkey(event.pubkey)}')`}
            style={{
              background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
              border: 'none',
              borderRadius: '25px',
              padding: '8px 16px',
              color: 'white',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 12px rgba(255, 107, 107, 0.3)'
            }}
            onmouseenter="this.style.transform='scale(1.05)'; this.style.boxShadow='0 6px 20px rgba(255, 107, 107, 0.4)'"
            onmouseleave="this.style.transform='scale(1)'; this.style.boxShadow='0 4px 12px rgba(255, 107, 107, 0.3)'"
            title="Like this post"
          >
            ❤️ HEART
          </button>
          
          <button
            onclick={`window.open('/user/${event.pubkey}', '_blank')`}
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              borderRadius: '25px',
              padding: '8px 16px',
              color: 'white',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
            }}
            onmouseenter="this.style.transform='scale(1.05)'; this.style.boxShadow='0 6px 20px rgba(102, 126, 234, 0.4)'"
            onmouseleave="this.style.transform='scale(1)'; this.style.boxShadow='0 4px 12px rgba(102, 126, 234, 0.3)'"
            title="Show all media from this user"
          >
            🎬 SHOW MORE
          </button>
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

      {/* 🎬 Professional Media Players */}
      
      {/* Videos */}
      {videos.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ color: '#667eea', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🎥 Videos ({videos.length})
          </h3>
          <div style={{
            display: 'grid',
            gap: '1rem',
            gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))'
          }}>
            {videos.map((videoUrl, index) => {
              const isYouTube = videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be');
              const videoId = isYouTube ? videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)?.[1] : null;
              
              return (
                <div key={index} style={{
                  background: 'rgba(102, 126, 234, 0.1)',
                  borderRadius: '12px',
                  padding: '16px',
                  border: '2px solid #667eea'
                }}>
                  {isYouTube && videoId ? (
                    // YouTube Player
                    <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden' }}>
                      <iframe
                        src={`https://www.youtube.com/embed/${videoId}`}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          borderRadius: '8px'
                        }}
                        frameBorder="0"
                        allowFullScreen
                        title="YouTube Video"
                      />
                    </div>
                  ) : (
                    // Direct Video Player or Link
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '48px', marginBottom: '8px' }}>🎥</div>
                      <a
                        href={videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-block',
                          padding: '12px 24px',
                          background: '#667eea',
                          color: 'white',
                          textDecoration: 'none',
                          borderRadius: '8px',
                          fontSize: '14px',
                          fontWeight: 'bold'
                        }}
                      >
                        ▶️ Play Video
                      </a>
                    </div>
                  )}
                  <div style={{ marginTop: '8px', fontSize: '12px', color: '#667eea', wordBreak: 'break-all' }}>
                    {videoUrl}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Audio */}
      {audio.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ color: '#f093fb', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🎵 Audio ({audio.length})
          </h3>
          <div style={{
            display: 'grid',
            gap: '1rem',
            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))'
          }}>
            {audio.map((audioUrl, index) => {
              const isSpotify = audioUrl.includes('spotify.com');
              
              return (
                <div key={index} style={{
                  background: 'rgba(240, 147, 251, 0.1)',
                  borderRadius: '12px',
                  padding: '16px',
                  border: '2px solid #f093fb'
                }}>
                  {isSpotify ? (
                    // Spotify Player
                    <div style={{ position: 'relative', paddingBottom: '152px', height: 0, overflow: 'hidden' }}>
                      <iframe
                        src={audioUrl.replace('open.spotify.com', 'open.spotify.com/embed')}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          borderRadius: '8px'
                        }}
                        frameBorder="0"
                        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                        loading="lazy"
                      />
                    </div>
                  ) : (
                    // Direct Audio Player
                    <audio
                      controls
                      style={{
                        width: '100%',
                        borderRadius: '8px'
                      }}
                      preload="metadata"
                    >
                      <source src={audioUrl} />
                      Your browser does not support the audio tag.
                    </audio>
                  )}
                  <div style={{ marginTop: '8px', fontSize: '12px', color: '#f093fb', wordBreak: 'break-all' }}>
                    {audioUrl}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Images */}
      {images.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ color: '#ec4899', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            📸 Images ({images.length})
          </h3>
          <div style={{
            display: 'grid',
            gap: '1rem',
            gridTemplateColumns: images.length === 1 ? '1fr' : 
                                images.length === 2 ? '1fr 1fr' : 
                                'repeat(auto-fit, minmax(300px, 1fr))'
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
                  border: '2px solid #ec4899',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                }}
                loading="lazy"
              />
            ))}
          </div>
        </div>
      )}

      {/* Documents */}
      {documents.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ color: '#a8edea', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            📄 Documents ({documents.length})
          </h3>
          <div style={{
            display: 'grid',
            gap: '1rem',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))'
          }}>
            {documents.map((docUrl, index) => (
              <div key={index} style={{
                background: 'rgba(168, 237, 234, 0.1)',
                borderRadius: '12px',
                padding: '16px',
                border: '2px solid #a8edea',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '8px' }}>📄</div>
                <a
                  href={docUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-block',
                    padding: '8px 16px',
                    background: '#a8edea',
                    color: 'black',
                    textDecoration: 'none',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}
                >
                  📥 Open Document
                </a>
                <div style={{ marginTop: '8px', fontSize: '12px', color: '#a8edea', wordBreak: 'break-all' }}>
                  {docUrl}
                </div>
              </div>
            ))}
          </div>
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

      {/* JavaScript for Post Actions */}
      <script>{`
        // Like post function
        window.likePost = function(eventId, authorName) {
          console.log('❤️ Liked post:', eventId.slice(0, 8), 'by', authorName);
          
          // Visual feedback
          const button = event.target;
          const originalText = button.innerHTML;
          button.innerHTML = '💖 LIKED!';
          button.style.background = 'linear-gradient(135deg, #ff4757 0%, #c44569 100%)';
          
          // Store like in localStorage
          const likes = JSON.parse(localStorage.getItem('nostr-likes') || '[]');
          if (!likes.includes(eventId)) {
            likes.push(eventId);
            localStorage.setItem('nostr-likes', JSON.stringify(likes));
          }
          
          // Reset button after animation
          setTimeout(() => {
            button.innerHTML = originalText;
            button.style.background = 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)';
          }, 2000);
          
          // Optional: Send like to server
          fetch('/api/like-post', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ eventId: eventId, timestamp: Date.now() })
          }).catch(console.error);
        };
        
        console.log('❤️ Post actions initialized');
      `}</script>
    </div>
  );
}

export function UserMediaGallery({ userMedia, author, pubkey }: { 
  userMedia: any[]; 
  author?: any; 
  pubkey: string; 
}) {
  const truncatePubkey = (pubkey: string) => {
    return `${pubkey.slice(0, 8)}...${pubkey.slice(-4)}`;
  };

  // Group media by type
  const mediaByType = {
    image: userMedia.filter(m => m.type === 'image'),
    video: userMedia.filter(m => m.type === 'video'),
    audio: userMedia.filter(m => m.type === 'audio'),
    document: userMedia.filter(m => m.type === 'document'),
    link: userMedia.filter(m => m.type === 'link')
  };

  const getMediaTypeColor = (type: string) => {
    const colors = {
      image: '#ec4899',    // Pink
      video: '#667eea',    // Blue
      audio: '#f093fb',    // Purple
      document: '#a8edea', // Cyan
      link: '#ffecd2'      // Orange
    };
    return colors[type] || '#6b7280';
  };

  const getMediaTypeIcon = (type: string) => {
    const icons = {
      image: '📸',
      video: '🎥',
      audio: '🎵',
      document: '📄',
      link: '🔗'
    };
    return icons[type] || '📄';
  };

  return (
    <div style={{
      maxWidth: '1200px',
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
        ← Back to Observatory
      </button>

      {/* User Header */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        marginBottom: '2rem',
        paddingBottom: '1rem',
        borderBottom: '3px solid #7c3aed'
      }}>
        {author?.picture ? (
          <img 
            src={author.picture} 
            alt="Profile"
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              objectFit: 'cover',
              border: '4px solid #7c3aed'
            }}
          />
        ) : (
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            backgroundColor: '#7c3aed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2rem',
            color: 'white'
          }}>
            👤
          </div>
        )}
        
        <div style={{ flex: 1 }}>
          <h1 style={{ 
            margin: 0,
            fontSize: '2rem',
            color: '#111827',
            marginBottom: '0.5rem'
          }}>
            🎬 {author?.name || truncatePubkey(pubkey)}
          </h1>
          <p style={{ 
            margin: 0,
            color: '#6b7280',
            fontSize: '1rem',
            marginBottom: '0.5rem'
          }}>
            {userMedia.length} media items discovered
          </p>
          {author?.about && (
            <p style={{
              margin: 0,
              color: '#9ca3af',
              fontSize: '0.9rem',
              fontStyle: 'italic'
            }}>
              {author.about}
            </p>
          )}
        </div>

        {/* Media Type Stats */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          alignItems: 'flex-end'
        }}>
          {Object.entries(mediaByType).map(([type, items]) => (
            items.length > 0 && (
              <div key={type} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 8px',
                background: `${getMediaTypeColor(type)}20`,
                borderRadius: '12px',
                border: `1px solid ${getMediaTypeColor(type)}`,
                fontSize: '12px',
                fontWeight: 'bold',
                color: getMediaTypeColor(type)
              }}>
                <span>{getMediaTypeIcon(type)}</span>
                <span>{items.length}</span>
              </div>
            )
          ))}
        </div>
      </header>

      {/* Media Gallery */}
      <div style={{
        columns: 'auto 280px',
        columnGap: '20px',
        padding: '20px 0'
      }}>
        {userMedia.map((item, index) => (
          <div 
            key={index}
            style={{
              breakInside: 'avoid',
              marginBottom: '20px',
              borderRadius: '12px',
              overflow: 'hidden',
              background: 'rgba(255,255,255,0.08)',
              cursor: 'pointer',
              border: `2px solid ${getMediaTypeColor(item.type)}`,
              transition: 'all 0.3s ease'
            }}
            onclick={`window.open('/nostr/post/${item.eventId}', '_blank')`}
          >
            {/* Media Content Based on Type */}
            {item.type === 'image' && (
              <img 
                src={item.url} 
                alt="User Media"
                style={{
                  width: '100%',
                  height: 'auto',
                  display: 'block'
                }}
                loading="lazy"
              />
            )}
            
            {item.type === 'video' && (
              <div style={{ position: 'relative' }}>
                {item.thumbnail ? (
                  <div style={{ position: 'relative' }}>
                    <img 
                      src={item.thumbnail} 
                      alt="Video Thumbnail"
                      style={{
                        width: '100%',
                        height: 'auto',
                        display: 'block',
                        opacity: 0,
                        transition: 'opacity 0.3s ease-in-out'
                      }}
                      loading="lazy"
                      onload="smoothImageLoad(this)"
                    />
                    <div style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      background: 'rgba(0,0,0,0.8)',
                      borderRadius: '50%',
                      width: '60px',
                      height: '60px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '24px'
                    }}>
                      ▶️
                    </div>
                  </div>
                ) : (
                  <div style={{
                    width: '100%',
                    height: '200px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '48px'
                  }}>
                    🎥
                  </div>
                )}
              </div>
            )}
            
            {item.type === 'audio' && (
              <div style={{
                width: '100%',
                height: '200px',
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '48px'
              }}>
                🎵
              </div>
            )}
            
            {item.type === 'document' && (
              <div style={{
                width: '100%',
                height: '200px',
                background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '48px'
              }}>
                📄
              </div>
            )}
            
            {item.type === 'link' && (
              <div style={{
                width: '100%',
                height: '200px',
                background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '48px'
              }}>
                🔗
              </div>
            )}

            {/* Media Info */}
            <div style={{
              padding: '12px',
              fontSize: '12px',
              opacity: 0.9,
              background: 'rgba(0,0,0,0.3)'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{
                  display: 'inline-block',
                  padding: '4px 8px',
                  background: getMediaTypeColor(item.type),
                  borderRadius: '12px',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  color: 'white'
                }}>
                  {getMediaTypeIcon(item.type)} {item.type.toUpperCase()}
                </div>
                <div style={{
                  fontSize: '10px',
                  opacity: 0.7,
                  color: 'white'
                }}>
                  {new Date(item.timestamp).toLocaleDateString()}
                </div>
              </div>
              {item.title && (
                <div style={{
                  marginTop: '4px',
                  fontSize: '11px',
                  color: 'white',
                  opacity: 0.8
                }}>
                  {item.title}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Loading More Indicator */}
      <div id="loading-more" style={{
        textAlign: 'center',
        padding: '2rem',
        display: 'none'
      }}>
        <div style={{
          display: 'inline-block',
          width: '40px',
          height: '40px',
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #7c3aed',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <div style={{
          marginTop: '1rem',
          color: '#7c3aed',
          fontWeight: 'bold'
        }}>
          🔍 Searching Nostr network for more media...
        </div>
      </div>

      {/* Load More Button */}
      <div id="load-more-container" style={{
        textAlign: 'center',
        padding: '2rem'
      }}>
        <button
          id="load-more-btn"
          onclick={`loadMoreUserMedia('${pubkey}')`}
          style={{
            background: 'linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%)',
            border: 'none',
            borderRadius: '25px',
            padding: '12px 24px',
            color: 'white',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            margin: '0 auto',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)'
          }}
          onmouseenter="this.style.transform='scale(1.05)'; this.style.boxShadow='0 6px 20px rgba(124, 58, 237, 0.4)'"
          onmouseleave="this.style.transform='scale(1)'; this.style.boxShadow='0 4px 12px rgba(124, 58, 237, 0.3)'"
        >
          🔍 Load More from Nostr Network
        </button>
      </div>

      {/* No Media Message */}
      {userMedia.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '4rem 2rem',
          color: '#6b7280'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎬</div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>No Media Found</h2>
          <p>This user hasn't posted any media content yet. Try "Load More" to search the Nostr network!</p>
        </div>
      )}

      {/* Infinite Scroll & Load More JavaScript */}
      <script>{`
        let currentPage = 0;
        let isLoading = false;
        let hasMore = true;
        
        // Load more media from Nostr network
        window.loadMoreUserMedia = async function(pubkey) {
          if (isLoading || !hasMore) return;
          
          isLoading = true;
          currentPage++;
          
          // Show loading indicator
          document.getElementById('loading-more').style.display = 'block';
          document.getElementById('load-more-btn').style.display = 'none';
          
          try {
            const response = await fetch('/api/user-media', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                pubkey: pubkey, 
                page: currentPage, 
                limit: 20 
              })
            });
            
            const data = await response.json();
            
            if (data.success && data.newMedia.length > 0) {
              console.log('🎬 Found', data.newMedia.length, 'new media items for user');
              
              // Add new media to gallery
              const gallery = document.querySelector('[style*="columns:auto 280px"]');
              if (gallery) {
                data.newMedia.forEach((item, index) => {
                  const mediaDiv = createMediaCard(item, currentPage * 20 + index);
                  gallery.appendChild(mediaDiv);
                  
                  // Animate in
                  setTimeout(() => {
                    mediaDiv.style.opacity = '1';
                    mediaDiv.style.transform = 'translateY(0)';
                  }, index * 100);
                });
              }
              
              // Update stats
              const totalItems = data.existingCount + (currentPage * 20) + data.newMedia.length;
              document.querySelector('h1').innerHTML = '🎬 ' + document.querySelector('h1').innerHTML.split('🎬 ')[1];
              document.querySelector('p').innerHTML = totalItems + ' media items discovered';
              
              hasMore = data.hasMore;
            } else {
              hasMore = false;
              console.log('🔍 No more media found for this user');
            }
          } catch (error) {
            console.error('Load more error:', error);
            hasMore = false;
          }
          
          // Hide loading, show button if more available
          document.getElementById('loading-more').style.display = 'none';
          if (hasMore) {
            document.getElementById('load-more-btn').style.display = 'flex';
          } else {
            document.getElementById('load-more-container').innerHTML = '<div style="color: #6b7280; font-style: italic;">🎬 All media discovered from Nostr network!</div>';
          }
          
          isLoading = false;
        };
        
        // Create media card element
        function createMediaCard(item, index) {
          const div = document.createElement('div');
          div.style.cssText = \`
            break-inside: avoid;
            margin-bottom: 20px;
            border-radius: 12px;
            overflow: hidden;
            background: rgba(255,255,255,0.08);
            cursor: pointer;
            border: 2px solid \${getMediaTypeColor(item.type)};
            transition: all 0.3s ease;
            opacity: 0;
            transform: translateY(20px);
          \`;
          
          div.onclick = () => window.open('/nostr/post/' + item.eventId, '_blank');
          
          let mediaContent = '';
          
          if (item.type === 'image') {
            mediaContent = \`<img src="\${item.url}" alt="User Media" style="width:100%;height:auto;display:block;" loading="lazy"/>\`;
          } else if (item.type === 'video') {
            if (item.thumbnail) {
              mediaContent = \`
                <div style="position:relative;">
                  <img src="\${item.thumbnail}" alt="Video Thumbnail" style="width:100%;height:auto;display:block;" loading="lazy"/>
                  <div style="position:absolute;top:50%;left:50%;transform:translate(-50%, -50%);background:rgba(0,0,0,0.8);border-radius:50%;width:60px;height:60px;display:flex;align-items:center;justify-content:center;font-size:24px;">▶️</div>
                </div>
              \`;
            } else {
              mediaContent = \`<div style="width:100%;height:200px;background:linear-gradient(135deg, #667eea 0%, #764ba2 100%);display:flex;align-items:center;justify-content:center;font-size:48px;">🎥</div>\`;
            }
          } else if (item.type === 'audio') {
            mediaContent = \`<div style="width:100%;height:200px;background:linear-gradient(135deg, #f093fb 0%, #f5576c 100%);display:flex;align-items:center;justify-content:center;font-size:48px;">🎵</div>\`;
          } else if (item.type === 'document') {
            mediaContent = \`<div style="width:100%;height:200px;background:linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);display:flex;align-items:center;justify-content:center;font-size:48px;">📄</div>\`;
          } else if (item.type === 'link') {
            mediaContent = \`<div style="width:100%;height:200px;background:linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);display:flex;align-items:center;justify-content:center;font-size:48px;">🔗</div>\`;
          }
          
          div.innerHTML = \`
            \${mediaContent}
            <div style="padding:12px;font-size:12px;opacity:0.9;background:rgba(0,0,0,0.3);">
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <div style="display:inline-block;padding:4px 8px;background:\${getMediaTypeColor(item.type)};border-radius:12px;font-size:10px;font-weight:bold;color:white;">
                  \${getMediaTypeIcon(item.type)} \${item.type.toUpperCase()}
                </div>
                <div style="font-size:10px;opacity:0.7;color:white;">
                  \${new Date(item.timestamp).toLocaleDateString()}
                </div>
              </div>
              \${item.title ? '<div style="margin-top:4px;font-size:11px;color:white;opacity:0.8;">' + item.title + '</div>' : ''}
            </div>
          \`;
          
          return div;
        }
        
        // Helper functions for media styling
        function getMediaTypeColor(type) {
          const colors = {
            image: '#ec4899',
            video: '#667eea',
            audio: '#f093fb',
            document: '#a8edea',
            link: '#ffecd2'
          };
          return colors[type] || '#6b7280';
        }
        
        function getMediaTypeIcon(type) {
          const icons = {
            image: '📸',
            video: '🎥',
            audio: '🎵',
            document: '📄',
            link: '🔗'
          };
          return icons[type] || '📄';
        }
        
        // Infinite scroll detection
        window.addEventListener('scroll', function() {
          if (isLoading || !hasMore) return;
          
          const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
          const windowHeight = window.innerHeight;
          const documentHeight = document.documentElement.scrollHeight;
          
          // Trigger when 200px from bottom
          if (scrollTop + windowHeight >= documentHeight - 200) {
            loadMoreUserMedia('${pubkey}');
          }
        });
        
        // CSS animation for loading spinner
        const style = document.createElement('style');
        style.textContent = \`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        \`;
        document.head.appendChild(style);
        
        console.log('🎬 User gallery with infinite scroll initialized');
        console.log('📜 Scroll to bottom or click "Load More" to discover more media from Nostr network');
      `}</script>
    </div>
  );
}
