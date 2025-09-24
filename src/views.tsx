// Clean Views for Image Time Machine
import { e } from "@kitajs/html";
import type { NostrFeedItem } from "./nostr-service.js";
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
          
          // Initialize time machine
          document.addEventListener('DOMContentLoaded', () => {
            log('🕰️ Image Time Machine initialized');
            log('🎬 Professional timeline controls active');
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

export function ModernDiscoveryFeed({ items, cachedImagesWithData = [], displayMode = 'masonry', timeMachineData }: { 
  items: NostrFeedItem[]; 
  cachedImagesWithData?: Array<{ imageUrl: string; eventId?: string; eventData?: any; correctCategory?: string }>;
  displayMode?: string;
  timeMachineData?: {
    currentTimeRange: { start: number; end: number };
    availablePeriods: Array<{ start: number; end: number; count: number; label: string }>;
    totalImages: number;
  };
}) {
  // Convert items to simple format for masonry
  const allImages = [
    ...cachedImagesWithData.map(cached => ({
      url: cached.imageUrl,
      eventId: cached.eventId || '',
      category: 'art',
      correctCategory: cached.correctCategory || 'art'
    })),
    ...items.flatMap(item => 
      item.images.map(img => ({
        url: img.url,
        eventId: item.id,
        category: img.category,
        correctCategory: img.correctCategory
      }))
    )
  ];

  return (
    <div id="modern-discovery-feed" style={{
      background: '#0a0a0a',
      minHeight: '100vh',
      color: 'white',
      overflowY: 'auto',
      overflowX: 'hidden'
    }}>
      {/* Masonry Grid - Always show (removed mode switching) */}
      <div style={{
        columns: 'auto 250px',
        columnGap: '16px',
        padding: '130px 20px 40px', // Extra top padding for larger timeline
        minHeight: 'calc(100vh - 130px)'
      }}>
        {allImages.map((img, index) => (
          <div 
            key={index}
            style={{
              breakInside: 'avoid',
              marginBottom: '16px',
              borderRadius: '8px',
              overflow: 'hidden',
              background: 'rgba(255,255,255,0.05)',
              cursor: 'pointer'
            }}
            onclick={`window.open('/nostr/post/${img.eventId}', '_blank')`}
          >
            <img 
              src={img.url} 
              alt="Nostr Image"
              style={{
                width: '100%',
                height: 'auto',
                display: 'block'
              }}
              loading="lazy"
            />
            <div style={{
              padding: '12px',
              fontSize: '12px',
              opacity: '0.8'
            }}>
              <div style={{
                display: 'inline-block',
                padding: '4px 8px',
                background: img.category === 'nature' ? '#10b981' : 
                           img.category === 'food' ? '#f59e0b' :
                           img.category === 'tech' ? '#3b82f6' :
                           img.category === 'memes' ? '#8b5cf6' : '#ec4899',
                borderRadius: '12px',
                marginBottom: '4px'
              }}>
                {img.category === 'nature' ? 'Nature' :
                 img.category === 'food' ? 'Food' :
                 img.category === 'tech' ? 'Tech' :
                 img.category === 'memes' ? 'Memes' : 'Art'}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Loading State */}
      {allImages.length === 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          textAlign: 'center'
        }}>
          <div>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🕰️</div>
            <div>Loading image time machine...</div>
            <div style={{ fontSize: '14px', opacity: '0.7', marginTop: '8px' }}>
              {timeMachineData ? 
                `Time traveling to ${new Date(timeMachineData.currentTimeRange.start).toLocaleString()}...` :
                'Connecting to Nostr relays...'
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
          
          console.log('🎨 Image Time Machine loaded');
          console.log('📜 Smooth scrolling enabled - use mouse wheel, arrow keys, or scroll button');
        });
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
