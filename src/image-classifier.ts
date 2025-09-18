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

export class ImageClassifier {
  private cache = new Map<string, string>();
  
  constructor() {
    console.log("🎨 Image classifier initialized");
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

// Singleton instance
export const imageClassifier = new ImageClassifier();
