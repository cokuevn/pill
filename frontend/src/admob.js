// AdMob Integration for React PWA
// Works with both web AdSense and TWA AdMob

class AdMobManager {
  constructor() {
    this.isAdMobSupported = 'admob' in window || 'cordova' in window;
    this.isWebAdSupported = true;
    this.adUnits = {
      banner: null,
      interstitial: null,
      rewarded: null
    };
    
    // Real Production IDs - provided by user
    this.productionIds = {
      publisherId: 'ca-pub-4181222038181630',
      banner: 'ca-app-pub-4181222038181630/7332397743',
      interstitial: 'ca-app-pub-4181222038181630/5191667171'
    };
  }

  // Initialize AdMob (for TWA) or AdSense (for web)
  async init(config = {}) {
    try {
      console.log('🚀 Initializing Ad system...');
      
      if (this.isNativeApp()) {
        return await this.initAdMob(config);
      } else {
        return await this.initAdSense(config);
      }
    } catch (error) {
      console.error('❌ Ad initialization failed:', error);
      return false;
    }
  }

  // Check if running in native app (TWA)
  isNativeApp() {
    return window.ReactNativeWebView || 
           window.Android || 
           navigator.userAgent.includes('wv') ||
           'admob' in window;
  }

  // Initialize AdMob for native TWA
  async initAdMob(config) {
    try {
      if (!window.admob) {
        console.warn('⚠️ AdMob plugin not available');
        return false;
      }

      await window.admob.start();
      
      // Configure ad units with real IDs
      this.adUnits.banner = config.bannerId || this.productionIds.banner;
      this.adUnits.interstitial = config.interstitialId || this.productionIds.interstitial;
      
      console.log('✅ AdMob initialized for native app');
      return true;
    } catch (error) {
      console.error('❌ AdMob initialization failed:', error);
      return false;
    }
  }

  // Initialize AdSense for web PWA
  async initAdSense(config) {
    try {
      // Load AdSense script
      if (!window.adsbygoogle) {
        await this.loadAdSenseScript(config.publisherId);
      }
      
      // Initialize AdSense with real Publisher ID - wrapped in try/catch
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({
          google_ad_client: config.publisherId || this.productionIds.publisherId,
          enable_page_level_ads: true
        });
      } catch (pushError) {
        console.warn('⚠️ AdSense push failed, but continuing:', pushError.message);
      }
      
      console.log('✅ AdSense initialized for web');
      return true;
    } catch (error) {
      console.warn('⚠️ AdSense initialization failed (expected until approved):', error.message);
      return false;
    }
  }

  // Load AdSense script dynamically
  loadAdSenseScript(publisherId) {
    return new Promise((resolve, reject) => {
      // Check if script already loaded
      if (document.querySelector(`script[src*="${publisherId}"]`)) {
        resolve();
        return;
      }
      
      const script = document.createElement('script');
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publisherId}`;
      script.async = true;
      script.crossOrigin = 'anonymous';
      
      script.onload = () => {
        console.log('✅ AdSense script loaded');
        resolve();
      };
      script.onerror = (error) => {
        console.warn('⚠️ AdSense script failed to load (expected until approved)');
        // Don't reject - just resolve so app continues working
        resolve();
      };
      
      document.head.appendChild(script);
    });
  }

  // Show banner ad
  async showBanner(options = {}) {
    try {
      if (this.isNativeApp()) {
        return await this.showAdMobBanner(options);
      } else {
        return await this.showAdSenseBanner(options);
      }
    } catch (error) {
      console.error('❌ Failed to show banner:', error);
      return false;
    }
  }

  // Show AdMob banner (native)
  async showAdMobBanner(options) {
    if (!window.admob) return false;
    
    const bannerConfig = {
      adUnitId: this.adUnits.banner,
      position: options.position || 'bottom',
      size: options.size || 'SMART_BANNER',
      ...options
    };
    
    await window.admob.banner.show(bannerConfig);
    console.log('📱 AdMob banner shown');
    return true;
  }

  // Show AdSense banner (web)
  async showAdSenseBanner(options) {
    try {
      // Create banner container if doesn't exist
      let container = document.getElementById(options.containerId || 'ad-banner-container');
      if (!container) {
        container = document.createElement('div');
        container.id = options.containerId || 'ad-banner-container';
        container.style.textAlign = 'center';
        container.style.margin = '10px 0';
        
        // Append to specified parent or body
        const parent = options.parent ? document.querySelector(`#${options.parent}`) : document.body;
        if (parent) {
          parent.appendChild(container);
        }
      }
      
      // Clear existing content
      container.innerHTML = '';
      
      // Create ad element
      const adElement = document.createElement('ins');
      adElement.className = 'adsbygoogle';
      adElement.style.display = 'block';
      adElement.style.minHeight = '100px';
      adElement.setAttribute('data-ad-client', options.publisherId || this.productionIds.publisherId);
      adElement.setAttribute('data-ad-slot', options.adSlot || this.productionIds.banner.split('/')[1]);
      adElement.setAttribute('data-ad-format', options.format || 'auto');
      adElement.setAttribute('data-full-width-responsive', 'true');
      
      container.appendChild(adElement);
      
      // Wait for adsbygoogle to be available
      let attempts = 0;
      while (!window.adsbygoogle && attempts < 10) {
        await new Promise(resolve => setTimeout(resolve, 500));
        attempts++;
      }
      
      if (!window.adsbygoogle) {
        throw new Error('AdSense not loaded');
      }
      
      // Push ad
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        console.log('🌐 AdSense banner requested');
        
        // Check if ad loaded after delay
        setTimeout(() => {
          const adIframe = container.querySelector('iframe');
          if (!adIframe || adIframe.style.display === 'none') {
            console.warn('⚠️ AdSense banner may not have loaded (normal until approved)');
            return false;
          }
        }, 2000);
        
        return true;
      } catch (adError) {
        console.warn('⚠️ AdSense push failed (expected until approved):', adError.message);
        return false;
      }
      
    } catch (error) {
      console.error('❌ AdSense banner error:', error);
      return false;
    }
  }

  // Show interstitial ad
  async showInterstitial() {
    try {
      if (this.isNativeApp()) {
        return await this.showAdMobInterstitial();
      } else {
        return await this.showAdSenseInterstitial();
      }
    } catch (error) {
      console.error('❌ Failed to show interstitial:', error);
      return false;
    }
  }

  // Show AdMob interstitial (native)
  async showAdMobInterstitial() {
    if (!window.admob) return false;
    
    // Load and show interstitial
    await window.admob.interstitial.load(this.adUnits.interstitial);
    await window.admob.interstitial.show();
    
    console.log('📱 AdMob interstitial shown');
    return true;
  }

  // Show AdSense interstitial (web) - using overlay
  async showAdSenseInterstitial() {
    // Create overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.8);
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    
    // Create ad container
    const adContainer = document.createElement('div');
    adContainer.style.cssText = `
      background: white;
      padding: 20px;
      border-radius: 10px;
      max-width: 90%;
      max-height: 90%;
      position: relative;
    `;
    
    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '×';
    closeBtn.style.cssText = `
      position: absolute;
      top: 10px;
      right: 15px;
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
    `;
    closeBtn.onclick = () => document.body.removeChild(overlay);
    
    // Ad element
    const adElement = document.createElement('ins');
    adElement.className = 'adsbygoogle';
    adElement.style.display = 'block';
    adElement.setAttribute('data-ad-client', this.productionIds.publisherId);
    adElement.setAttribute('data-ad-slot', this.productionIds.interstitial.split('/')[1]);
    adElement.setAttribute('data-ad-format', 'fluid');
    
    adContainer.appendChild(closeBtn);
    adContainer.appendChild(adElement);
    overlay.appendChild(adContainer);
    document.body.appendChild(overlay);
    
    // Push ad
    (window.adsbygoogle = window.adsbygoogle || []).push({});
    
    // Auto close after 5 seconds
    setTimeout(() => {
      if (document.body.contains(overlay)) {
        document.body.removeChild(overlay);
      }
    }, 5000);
    
    console.log('🌐 AdSense interstitial shown');
    return true;
  }

  // Hide banner
  async hideBanner() {
    try {
      if (this.isNativeApp() && window.admob) {
        await window.admob.banner.hide();
        console.log('📱 AdMob banner hidden');
      } else {
        const container = document.getElementById('ad-banner-container');
        if (container) {
          container.style.display = 'none';
          console.log('🌐 AdSense banner hidden');
        }
      }
      return true;
    } catch (error) {
      console.error('❌ Failed to hide banner:', error);
      return false;
    }
  }

  // Remove banner completely
  async removeBanner() {
    try {
      if (this.isNativeApp() && window.admob) {
        await window.admob.banner.remove();
      } else {
        const container = document.getElementById('ad-banner-container');
        if (container) {
          container.remove();
        }
      }
      return true;
    } catch (error) {
      console.error('❌ Failed to remove banner:', error);
      return false;
    }
  }

  // Get configuration for real deployment
  getProductionConfig() {
    return {
      // Replace these with your real AdMob/AdSense IDs
      publisherId: 'ca-pub-YOUR-PUBLISHER-ID',
      adUnits: {
        banner: 'ca-app-pub-YOUR-PUBLISHER-ID/BANNER-AD-UNIT-ID',
        interstitial: 'ca-app-pub-YOUR-PUBLISHER-ID/INTERSTITIAL-AD-UNIT-ID',
        rewarded: 'ca-app-pub-YOUR-PUBLISHER-ID/REWARDED-AD-UNIT-ID'
      }
    };
  }

  // Helper to check if ads are ready
  isReady() {
    if (this.isNativeApp()) {
      return !!window.admob;
    } else {
      return !!window.adsbygoogle;
    }
  }

  // Get ad revenue (if available)
  async getRevenue() {
    try {
      if (this.isNativeApp() && window.admob && window.admob.getRevenue) {
        return await window.admob.getRevenue();
      }
      return null;
    } catch (error) {
      console.error('❌ Failed to get revenue:', error);
      return null;
    }
  }
}

// Export singleton instance
const adMob = new AdMobManager();
export default adMob;