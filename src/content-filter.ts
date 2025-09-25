/**
 * 🔞 Content Filter & Age Rating System
 * 
 * Comprehensive content filtering with NSFWJS integration
 * FSK/USK age ratings: 0/6/12/16/18
 * Categories: Neutral, Drawing, Sexy, Porn, Hentai
 */

export type AgeRating = '0' | '6' | '12' | '16' | '18';
export type ContentCategory = 'Neutral' | 'Drawing' | 'Sexy' | 'Porn' | 'Hentai';

export interface ContentClassification {
  ageRating: AgeRating;
  category: ContentCategory;
  confidence: number;
  shouldBlur: boolean;
  reason: string;
}

export interface FilterSettings {
  maxAgeRating: AgeRating;
  blockedCategories: ContentCategory[];
  blurSensitive: boolean;
  showWarnings: boolean;
}

export class ContentFilterService {
  private static instance: ContentFilterService;
  private nsfwModel: any = null;
  private isModelLoaded = false;
  private cache = new Map<string, ContentClassification>();

  private constructor() {
    this.initializeModel();
  }

  static getInstance(): ContentFilterService {
    if (!ContentFilterService.instance) {
      ContentFilterService.instance = new ContentFilterService();
    }
    return ContentFilterService.instance;
  }

  private async initializeModel(): Promise<void> {
    try {
      console.log('🔞 Initializing NSFWJS model...');
      
      // Dynamic import for browser compatibility
      if (typeof window !== 'undefined') {
        const nsfwjs = await import('nsfwjs');
        const tf = await import('@tensorflow/tfjs');
        
        // Load the model
        this.nsfwModel = await nsfwjs.load();
        this.isModelLoaded = true;
        
        console.log('✅ NSFWJS model loaded successfully');
      } else {
        console.log('⚠️ NSFWJS model loading skipped (server-side)');
      }
    } catch (error) {
      console.error('❌ Failed to load NSFWJS model:', error);
      this.isModelLoaded = false;
    }
  }

  /**
   * Classify image content and determine age rating
   */
  async classifyImage(imageUrl: string): Promise<ContentClassification> {
    // Check cache first
    if (this.cache.has(imageUrl)) {
      return this.cache.get(imageUrl)!;
    }

    try {
      // If model not loaded, return safe default
      if (!this.isModelLoaded || !this.nsfwModel) {
        const safeDefault: ContentClassification = {
          ageRating: '0',
          category: 'Neutral',
          confidence: 0.5,
          shouldBlur: false,
          reason: 'Model not loaded - safe default'
        };
        this.cache.set(imageUrl, safeDefault);
        return safeDefault;
      }

      // Create image element for classification
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      return new Promise((resolve) => {
        img.onload = async () => {
          try {
            // Classify with NSFWJS
            const predictions = await this.nsfwModel.classify(img);
            
            // Convert NSFWJS predictions to our classification system
            const classification = this.convertPredictionsToClassification(predictions);
            
            // Cache result
            this.cache.set(imageUrl, classification);
            
            console.log(`🔞 Classified ${imageUrl.slice(0, 50)}... → ${classification.category} (${classification.ageRating}+) [${Math.round(classification.confidence * 100)}%]`);
            
            resolve(classification);
          } catch (error) {
            console.error('Classification error:', error);
            const fallback: ContentClassification = {
              ageRating: '12',
              category: 'Neutral',
              confidence: 0.3,
              shouldBlur: false,
              reason: 'Classification failed - safe fallback'
            };
            this.cache.set(imageUrl, fallback);
            resolve(fallback);
          }
        };
        
        img.onerror = () => {
          const errorDefault: ContentClassification = {
            ageRating: '0',
            category: 'Neutral',
            confidence: 0.1,
            shouldBlur: false,
            reason: 'Image load failed'
          };
          this.cache.set(imageUrl, errorDefault);
          resolve(errorDefault);
        };
        
        img.src = imageUrl;
      });
      
    } catch (error) {
      console.error('Image classification error:', error);
      const errorClassification: ContentClassification = {
        ageRating: '12',
        category: 'Neutral',
        confidence: 0.2,
        shouldBlur: false,
        reason: 'Error during classification'
      };
      this.cache.set(imageUrl, errorClassification);
      return errorClassification;
    }
  }

  /**
   * Convert NSFWJS predictions to our classification system
   */
  private convertPredictionsToClassification(predictions: any[]): ContentClassification {
    // NSFWJS returns: Drawing, Hentai, Neutral, Porn, Sexy
    const predMap = new Map<string, number>();
    predictions.forEach(pred => {
      predMap.set(pred.className, pred.probability);
    });

    // Find highest confidence prediction
    const maxPred = predictions.reduce((max, pred) => 
      pred.probability > max.probability ? pred : max
    );

    const category = maxPred.className as ContentCategory;
    const confidence = maxPred.probability;

    // Determine age rating based on category and confidence
    let ageRating: AgeRating;
    let shouldBlur = false;

    if (category === 'Porn' && confidence > 0.6) {
      ageRating = '18';
      shouldBlur = true;
    } else if (category === 'Hentai' && confidence > 0.5) {
      ageRating = '18';
      shouldBlur = true;
    } else if (category === 'Sexy' && confidence > 0.7) {
      ageRating = '16';
      shouldBlur = true;
    } else if (category === 'Sexy' && confidence > 0.4) {
      ageRating = '12';
      shouldBlur = false;
    } else if (category === 'Drawing') {
      ageRating = '6';
      shouldBlur = false;
    } else {
      ageRating = '0';
      shouldBlur = false;
    }

    // Additional safety check - blur if any adult content is detected above threshold
    const pornScore = predMap.get('Porn') || 0;
    const hentaiScore = predMap.get('Hentai') || 0;
    const sexyScore = predMap.get('Sexy') || 0;

    if (pornScore > 0.3 || hentaiScore > 0.3 || sexyScore > 0.6) {
      shouldBlur = true;
      if (ageRating === '0' || ageRating === '6') {
        ageRating = '16';
      }
    }

    return {
      ageRating,
      category,
      confidence,
      shouldBlur,
      reason: `${category} detected with ${Math.round(confidence * 100)}% confidence`
    };
  }

  /**
   * Check if content should be filtered based on user settings
   */
  shouldFilterContent(classification: ContentClassification, settings: FilterSettings): boolean {
    // Check age rating
    const ageRatings = ['0', '6', '12', '16', '18'];
    const contentRatingIndex = ageRatings.indexOf(classification.ageRating);
    const maxRatingIndex = ageRatings.indexOf(settings.maxAgeRating);
    
    if (contentRatingIndex > maxRatingIndex) {
      return true;
    }

    // Check blocked categories
    if (settings.blockedCategories.includes(classification.category)) {
      return true;
    }

    return false;
  }

  /**
   * Get default filter settings
   */
  getDefaultSettings(): FilterSettings {
    return {
      maxAgeRating: '16',
      blockedCategories: ['Porn', 'Hentai'],
      blurSensitive: true,
      showWarnings: true
    };
  }

  /**
   * Load user settings from localStorage
   */
  loadUserSettings(): FilterSettings {
    if (typeof window === 'undefined') {
      return this.getDefaultSettings();
    }

    try {
      const stored = localStorage.getItem('nostr-filter-settings');
      if (stored) {
        return { ...this.getDefaultSettings(), ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('Error loading filter settings:', error);
    }
    
    return this.getDefaultSettings();
  }

  /**
   * Save user settings to localStorage
   */
  saveUserSettings(settings: FilterSettings): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem('nostr-filter-settings', JSON.stringify(settings));
      console.log('💾 Filter settings saved');
    } catch (error) {
      console.error('Error saving filter settings:', error);
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; classifications: Record<string, number> } {
    const classifications: Record<string, number> = {};
    
    for (const [, classification] of this.cache) {
      const key = `${classification.category}-${classification.ageRating}`;
      classifications[key] = (classifications[key] || 0) + 1;
    }

    return {
      size: this.cache.size,
      classifications
    };
  }
}

// Singleton instance
export const contentFilter = ContentFilterService.getInstance();
