import { Layout, DiscoveryFeed, CategorizedImageItem, NostrPostDetail } from "./src/views.tsx";
import { nostrService } from "./src/nostr-service.js";

// Initialize Nostr service
console.log("🚀 Starting Visual Nostr Feed...");
nostrService.initialize().catch(console.error);

function log(...args: any[]) {
  console.log(new Date().toISOString(), "-", ...args);
}

function html(content: any, init?: ResponseInit): Response {
  const body = String(content);
  return new Response(body, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
    ...init,
  });
}

function fragment(content: any, init?: ResponseInit): Response {
  const body = String(content);
  const preview = body.replace(/\s+/g, " ").trim();
  log("Sending HTML patch:", preview);
  return new Response(body, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
    ...init,
  });
}

Bun.serve({
  port: Number(process.env.PORT ?? 3000),
  development: process.env.NODE_ENV !== "production",
  routes: {
    "/": async (req) => {
      const url = new URL(req.url);
      log(req.method, url.pathname + url.search);
      
      // Fetch Nostr feed items and cached images with data
      const feedItems = await nostrService.getFeedItems(20);
      const cachedImagesWithData = nostrService.getCachedImagesWithData();
      
      return html(
        <Layout title="Visual Nostr Discovery">
          <DiscoveryFeed items={feedItems} cachedImagesWithData={cachedImagesWithData} />
        </Layout>
      );
    },

    "/api/cached-images": {
      GET: async (req) => {
        const cachedImagesWithData = nostrService.getCachedImagesWithData();
        return new Response(JSON.stringify({ images: cachedImagesWithData }), {
          headers: { "Content-Type": "application/json" }
        });
      }
    },

    "/nostr/post/:eventId": {
      GET: async (req) => {
        const eventId = req.params.eventId;
        const event = nostrService.getEvents().find(e => e.id === eventId);
        
        if (!event) {
          return new Response("Post not found", { status: 404 });
        }

        // Get author info
        const author = await nostrService.getAuthorInfo(event.pubkey);
        
        return html(
          <Layout title={`Nostr Post - ${author?.name || event.pubkey.slice(0, 8)}`}>
            <NostrPostDetail event={event} author={author} />
          </Layout>
        );
      }
    },
    
    "/static/*": {
      GET: (req) => {
        const url = new URL(req.url);
        const filePath = url.pathname.replace('/static/', '');
        const file = Bun.file(`public/static/${filePath}`);
        
        // Set appropriate content type
        const ext = filePath.split('.').pop();
        const contentType = ext === 'js' ? 'application/javascript' : 
                           ext === 'css' ? 'text/css' : 
                           'text/plain';
        
        return new Response(file, {
          headers: { 'Content-Type': contentType }
        });
      }
    },

    "/nostr/stream": req => {
      const url = new URL(req.url);
      log(req.method, url.pathname + url.search, "(open nostr stream)");
      const headers = {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      };
      const stream = new ReadableStream<Uint8Array>({
        start(controller) {
          const client = (chunk: Uint8Array) => controller.enqueue(chunk);
          nostrSseClients.add(client);
          controller.enqueue(ENC.encode(": nostr feed connected\n\n"));
          
          // Set up real-time subscription for new posts
          nostrService.subscribeToUpdates((feedItem) => {
            const itemHtml = String(<CategorizedImageItem item={feedItem} />);
            const payload = JSON.stringify({
              target: "#visual-feed",
              swap: "afterbegin", 
              text: itemHtml
            });
            
            const chunk = ENC.encode(`event: fixi\ndata: ${payload}\n\n`);
            for (const send of nostrSseClients) {
              try {
                send(chunk);
              } catch (e) {
                nostrSseClients.delete(send);
              }
            }
            
            // Also trigger the JavaScript to add the image with event data and category
            const jsPayload = JSON.stringify({
              target: "body",
              swap: "beforeend",
              text: `<script>
                ${feedItem.images.map(img => 
                  `window.addNostrImage && window.addNostrImage('${img.url}', '${feedItem.id}', ${JSON.stringify({
                    id: feedItem.id,
                    pubkey: feedItem.pubkey,
                    content: feedItem.content,
                    created_at: feedItem.created_at
                  })}, '${img.category}', '${img.correctCategory}');`
                ).join('')}
              </script>`
            });
            
            const jsChunk = ENC.encode(`event: fixi\ndata: ${jsPayload}\n\n`);
            for (const send of nostrSseClients) {
              try {
                send(jsChunk);
              } catch (e) {
                nostrSseClients.delete(send);
              }
            }
          });
        },
        cancel() {
          // Client disconnected
        },
      });
      return new Response(stream, { headers });
    },
  },
  // Serve static assets under /static/* from ./public and fallback 404
  async fetch(req) {
    const url = new URL(req.url);
    if (url.pathname.startsWith("/static/")) {
      const rel = url.pathname.replace(/^\/static\//, "");
      const path = `public/${rel}`;
      try {
        const file = Bun.file(path);
        if (!(await file.exists())) return new Response("Not Found", { status: 404 });
        log(req.method, url.pathname, "->", path);
        return new Response(file);
      } catch {
        log(req.method, url.pathname, "(static not found)");
        return new Response("Not Found", { status: 404 });
      }
    }
    log(req.method, url.pathname + url.search, "(unmatched)");
    return new Response("Not Found", { status: 404 });
  },
  error(error) {
    console.error(error);
    return new Response("Internal Server Error", { status: 500 });
  },
});

console.log(`Server running on http://localhost:${process.env.PORT ?? 3000}`);

// SSE broadcast machinery
const ENC = new TextEncoder();
const nostrSseClients = new Set<(chunk: Uint8Array) => void>();
