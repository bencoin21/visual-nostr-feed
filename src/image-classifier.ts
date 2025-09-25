/**
 * 🎬 Multi-Media Classifier for Nostr Observatory
 * Enhanced to support Images, Videos, Audio, Documents, and Links
 */

export type MediaType = 'image' | 'video' | 'audio' | 'document' | 'link' | 'text';

export interface MediaItem {
  url: string;
  type: MediaType;
  subtype?: string; // jpg, mp4, pdf, etc.
  title?: string;
  duration?: number; // for video/audio
  thumbnail?: string; // preview image
  category?: string; // content category (nature, tech, etc.)
}

export interface ClassifiedContent {
  images: MediaItem[];
  videos: MediaItem[];
  audio: MediaItem[];
  documents: MediaItem[];
  links: MediaItem[];
  textContent: string; // remaining text after media extraction
  totalCount: number;
}

export interface ImageCategory {
  name: string;
  color: string;
  zone: {
    x: number; // 0-1 (percentage of screen width)
    y: number; // 0-1 (percentage of screen height)
    width: number; // 0-1 (percentage of screen width)
    height: number; // 0-1 (percentage of screen height)
  };
  keywords: string[];
  urlPatterns: RegExp[];
}

export const IMAGE_CATEGORIES: Record<string, ImageCategory> = {
  nature: {
    name: "Nature & Landscapes",
    color: "#10b981", // Green
    zone: { x: 0, y: 0, width: 0.33, height: 0.5 }, // Top-left
    keywords: ["nature", "landscape", "tree", "forest", "mountain", "ocean", "sunset", "flower", "garden", "park"],
    urlPatterns: [/nature|landscape|tree|forest|mountain|ocean|sunset|flower/i]
  },
  
  food: {
    name: "Food & Drinks",
    color: "#f59e0b", // Orange
    zone: { x: 0.33, y: 0, width: 0.34, height: 0.5 }, // Top-center
    keywords: ["food", "pizza", "burger", "coffee", "restaurant", "cooking", "recipe", "fruit", "drink"],
    urlPatterns: [/food|pizza|burger|coffee|restaurant|cooking|recipe|fruit|drink/i]
  },
  
  tech: {
    name: "Tech & Crypto",
    color: "#3b82f6", // Blue
    zone: { x: 0.67, y: 0, width: 0.33, height: 0.5 }, // Top-right
    keywords: ["bitcoin", "crypto", "blockchain", "tech", "computer", "code", "programming", "ai"],
    urlPatterns: [/bitcoin|crypto|blockchain|tech|computer|code|programming|ai/i]
  },
  
  memes: {
    name: "Memes & Humor",
    color: "#8b5cf6", // Purple
    zone: { x: 0, y: 0.5, width: 0.5, height: 0.5 }, // Bottom-left
    keywords: ["meme", "funny", "lol", "joke", "humor", "comic", "pepe", "wojak"],
    urlPatterns: [/meme|funny|lol|joke|humor|comic|pepe|wojak/i]
  },
  
  art: {
    name: "Art & Creative",
    color: "#ec4899", // Pink
    zone: { x: 0.5, y: 0.5, width: 0.5, height: 0.5 }, // Bottom-right
    keywords: ["art", "painting", "drawing", "creative", "design", "artist", "gallery"],
    urlPatterns: [/art|painting|drawing|creative|design|artist|gallery/i]
  }
};

export class MediaClassifier {
  private cache = new Map<string, string>();
  
  private static readonly MEDIA_PATTERNS = {
    // Images - comprehensive pattern
    images: /(https?:\/\/[^\s]+\.(?:jpg|jpeg|png|gif|webp|bmp|svg|tiff|ico|avif|heic)(?:\?[^\s]*)?)/gi,
    
    // Videos - all formats including streaming platforms
    videos: /(https?:\/\/[^\s]+\.(?:mp4|webm|mov|avi|mkv|m4v|flv|wmv|3gp|ogv)(?:\?[^\s]*)?|https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|vimeo\.com\/|twitch\.tv\/videos\/|rumble\.com\/|odysee\.com\/)[^\s]+)/gi,
    
    // Audio - music, podcasts, voice notes
    audio: /(https?:\/\/[^\s]+\.(?:mp3|wav|ogg|m4a|flac|aac|wma|opus)(?:\?[^\s]*)?|https?:\/\/(?:open\.)?(?:spotify\.com\/|soundcloud\.com\/|anchor\.fm\/|podcasts\.apple\.com\/)[^\s]+)/gi,
    
    // Documents - PDFs, docs, presentations
    documents: /(https?:\/\/[^\s]+\.(?:pdf|doc|docx|ppt|pptx|xls|xlsx|txt|md|rtf|odt|ods|odp)(?:\?[^\s]*)?)/gi,
    
    // Links - any other HTTP links
    links: /(https?:\/\/[^\s]+)/gi
  };
  
  constructor() {
    console.log("🎬 Multi-Media classifier initialized");
  }

  /**
   * Classify all media content from a Nostr event
   */
  static classifyContent(content: string): ClassifiedContent {
    const result: ClassifiedContent = {
      images: [],
      videos: [],
      audio: [],
      documents: [],
      links: [],
      textContent: content,
      totalCount: 0
    };

    // Extract images
    const imageMatches = content.match(this.MEDIA_PATTERNS.images) || [];
    result.images = imageMatches.map(url => ({
      url,
      type: 'image' as MediaType,
      subtype: this.getFileExtension(url),
      thumbnail: url, // images are their own thumbnails
      title: `Image: ${this.getFileExtension(url).toUpperCase()}`
    }));

    // Extract videos
    const videoMatches = content.match(this.MEDIA_PATTERNS.videos) || [];
    result.videos = videoMatches.map(url => ({
      url,
      type: 'video' as MediaType,
      subtype: this.getVideoType(url),
      title: this.getVideoTitle(url),
      thumbnail: this.getVideoThumbnail(url)
    }));

    // Extract audio
    const audioMatches = content.match(this.MEDIA_PATTERNS.audio) || [];
    result.audio = audioMatches.map(url => ({
      url,
      type: 'audio' as MediaType,
      subtype: this.getAudioType(url),
      title: this.getAudioTitle(url)
    }));

    // Extract documents
    const documentMatches = content.match(this.MEDIA_PATTERNS.documents) || [];
    result.documents = documentMatches.map(url => ({
      url,
      type: 'document' as MediaType,
      subtype: this.getFileExtension(url),
      title: this.getDocumentTitle(url)
    }));

    // Extract remaining links (excluding already classified media)
    const allMediaUrls = new Set([
      ...imageMatches,
      ...videoMatches,
      ...audioMatches,
      ...documentMatches
    ]);

    const linkMatches = content.match(this.MEDIA_PATTERNS.links) || [];
    result.links = linkMatches
      .filter(url => !allMediaUrls.has(url))
      .map(url => ({
        url,
        type: 'link' as MediaType,
        title: this.getLinkTitle(url)
      }));

    // Clean text content (remove all media URLs)
    result.textContent = content;
    [...imageMatches, ...videoMatches, ...audioMatches, ...documentMatches, ...result.links.map(l => l.url)]
      .forEach(url => {
        result.textContent = result.textContent.replace(url, '').trim();
      });

    // Calculate total count
    result.totalCount = result.images.length + result.videos.length + result.audio.length + result.documents.length + result.links.length;

    return result;
  }

  // Helper methods for metadata extraction
  private static getFileExtension(url: string): string {
    const match = url.match(/\.([^.?]+)(?:\?|$)/);
    return match ? match[1].toLowerCase() : 'unknown';
  }

  private static getVideoType(url: string): string {
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
    if (url.includes('vimeo.com')) return 'vimeo';
    if (url.includes('twitch.tv')) return 'twitch';
    if (url.includes('rumble.com')) return 'rumble';
    if (url.includes('odysee.com')) return 'odysee';
    return this.getFileExtension(url);
  }

  private static getAudioType(url: string): string {
    if (url.includes('spotify.com')) return 'spotify';
    if (url.includes('soundcloud.com')) return 'soundcloud';
    if (url.includes('anchor.fm')) return 'podcast';
    if (url.includes('podcasts.apple.com')) return 'apple-podcast';
    return this.getFileExtension(url);
  }

  private static getVideoTitle(url: string): string {
    if (url.includes('youtube.com/watch?v=')) {
      const videoId = url.match(/v=([^&]+)/)?.[1];
      return `📺 YouTube ${videoId?.slice(0, 8) || ''}`;
    }
    if (url.includes('youtu.be/')) {
      const videoId = url.split('/').pop()?.split('?')[0];
      return `📺 YouTube ${videoId?.slice(0, 8) || ''}`;
    }
    if (url.includes('vimeo.com')) return '📺 Vimeo Video';
    if (url.includes('twitch.tv')) return '📺 Twitch Stream';
    return `📺 ${this.getFileExtension(url).toUpperCase()} Video`;
  }

  private static getAudioTitle(url: string): string {
    if (url.includes('spotify.com')) return '🎵 Spotify Track';
    if (url.includes('soundcloud.com')) return '🎵 SoundCloud Audio';
    if (url.includes('anchor.fm') || url.includes('podcasts.apple.com')) return '🎙️ Podcast';
    return `🎵 ${this.getFileExtension(url).toUpperCase()} Audio`;
  }

  private static getDocumentTitle(url: string): string {
    const ext = this.getFileExtension(url);
    return `📄 ${ext.toUpperCase()} Document`;
  }

  private static getLinkTitle(url: string): string {
    try {
      const domain = new URL(url).hostname.replace('www.', '');
      return `🔗 ${domain}`;
    } catch {
      return '🔗 External Link';
    }
  }

  private static getVideoThumbnail(url: string): string | undefined {
    // Generate YouTube thumbnail
    if (url.includes('youtube.com/watch?v=')) {
      const videoId = url.match(/v=([^&]+)/)?.[1];
      return videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : undefined;
    }
    if (url.includes('youtu.be/')) {
      const videoId = url.split('/').pop()?.split('?')[0];
      return videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : undefined;
    }
    return undefined;
  }
  
  async classifyImage(imageUrl: string, postContent: string = ""): Promise<string> {
    // Check cache first for the CORRECT category (not placement)
    if (this.cache.has(imageUrl)) {
      return this.cache.get(imageUrl)!;
    }
    
    // Determine the CORRECT category based on content analysis
    let correctCategory = "art"; // Default
    let maxScore = 0;
    
    const textToAnalyze = (postContent + " " + imageUrl).toLowerCase();
    
    for (const [categoryKey, categoryData] of Object.entries(IMAGE_CATEGORIES)) {
      let score = 0;
      
      // Check URL patterns
      for (const pattern of categoryData.urlPatterns) {
        if (pattern.test(textToAnalyze)) {
          score += 3;
        }
      }
      
      // Check keywords in content
      for (const keyword of categoryData.keywords) {
        if (textToAnalyze.includes(keyword)) {
          score += 1;
        }
      }
      
      if (score > maxScore) {
        maxScore = score;
        correctCategory = categoryKey;
      }
    }
    
    // Cache the CORRECT category
    this.cache.set(imageUrl, correctCategory);
    
    console.log(`🎯 Correct category for image: "${correctCategory}" (score: ${maxScore}):`, imageUrl.slice(0, 50));
    
    return correctCategory;
  }

  getRandomCategory(): string {
    const categories = Object.keys(IMAGE_CATEGORIES);
    return categories[Math.floor(Math.random() * categories.length)];
  }

  getRandomPlacementZone(): string {
    // Always place randomly for the game
    return this.getRandomCategory();
  }
  
  getCategoryZone(category: string): { x: number; y: number; width: number; height: number } {
    const categoryData = IMAGE_CATEGORIES[category];
    if (!categoryData) {
      return IMAGE_CATEGORIES.art.zone; // Default to art zone
    }
    return categoryData.zone;
  }
  
  getCategoryColor(category: string): string {
    const categoryData = IMAGE_CATEGORIES[category];
    if (!categoryData) {
      return IMAGE_CATEGORIES.art.color; // Default to art color
    }
    return categoryData.color;
  }
  
  getCategoryName(category: string): string {
    const categoryData = IMAGE_CATEGORIES[category];
    if (!categoryData) {
      return IMAGE_CATEGORIES.art.name; // Default to art name
    }
    return categoryData.name;
  }
  
  getAllCategories(): Record<string, ImageCategory> {
    return IMAGE_CATEGORIES;
  }
}

// Legacy ImageClassifier class for backward compatibility
export class ImageClassifier {
  private cache = new Map<string, string>();
  
  constructor() {
    console.log("🎨 Image classifier initialized (legacy compatibility)");
  }
  
  async classifyImage(imageUrl: string, postContent: string = ""): Promise<string> {
    // Check cache first for the CORRECT category (not placement)
    if (this.cache.has(imageUrl)) {
      return this.cache.get(imageUrl)!;
    }
    
    // Determine the CORRECT category based on content analysis
    let correctCategory = "art"; // Default
    let maxScore = 0;
    
    const textToAnalyze = (postContent + " " + imageUrl).toLowerCase();
    
    for (const [categoryKey, categoryData] of Object.entries(IMAGE_CATEGORIES)) {
      let score = 0;
      
      // Check URL patterns
      for (const pattern of categoryData.urlPatterns) {
        if (pattern.test(textToAnalyze)) {
          score += 3;
        }
      }
      
      // Check keywords in content
      for (const keyword of categoryData.keywords) {
        if (textToAnalyze.includes(keyword)) {
          score += 1;
        }
      }
      
      if (score > maxScore) {
        maxScore = score;
        correctCategory = categoryKey;
      }
    }
    
    // Cache the CORRECT category
    this.cache.set(imageUrl, correctCategory);
    
    console.log(`🎯 Correct category for image: "${correctCategory}" (score: ${maxScore}):`, imageUrl.slice(0, 50));
    
    return correctCategory;
  }

  getRandomCategory(): string {
    const categories = Object.keys(IMAGE_CATEGORIES);
    return categories[Math.floor(Math.random() * categories.length)];
  }

  getRandomPlacementZone(): string {
    // Always place randomly for the game
    return this.getRandomCategory();
  }
  
  getCategoryZone(category: string): { x: number; y: number; width: number; height: number } {
    const categoryData = IMAGE_CATEGORIES[category];
    if (!categoryData) {
      return IMAGE_CATEGORIES.art.zone; // Default to art zone
    }
    return categoryData.zone;
  }
  
  getCategoryColor(category: string): string {
    const categoryData = IMAGE_CATEGORIES[category];
    if (!categoryData) {
      return IMAGE_CATEGORIES.art.color; // Default to art color
    }
    return categoryData.color;
  }
  
  getCategoryName(category: string): string {
    const categoryData = IMAGE_CATEGORIES[category];
    if (!categoryData) {
      return IMAGE_CATEGORIES.art.name; // Default to art name
    }
    return categoryData.name;
  }
  
  getAllCategories(): Record<string, ImageCategory> {
    return IMAGE_CATEGORIES;
  }
}

// Singleton instances
export const imageClassifier = new ImageClassifier();
export const mediaClassifier = MediaClassifier;
