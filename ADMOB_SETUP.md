# AdMob Integration Guide for Pill Reminder PWA

## 🎯 Overview
This app supports both **AdSense** (for web/PWA) and **AdMob** (for TWA/native Android). The system automatically detects the environment and uses the appropriate ad platform.

## 📱 Current Status
- ✅ **AdMob/AdSense system** integrated and ready
- ✅ **Test ads** configured (safe for testing)
- ✅ **Automatic platform detection** (web vs native)
- ✅ **Banner ads** + **Interstitial ads** support
- ⚠️ **Needs real AdMob/AdSense IDs** for production

## 🔧 Setup Instructions

### **Step 1: Get AdSense Account (for PWA)**
1. Go to https://www.google.com/adsense/
2. Create/sign in to AdSense account
3. Add your website domain
4. Get **Publisher ID** (ca-pub-XXXXXXXXXX)
5. Create **Ad Units** for banner and display ads

### **Step 2: Get AdMob Account (for Android TWA)**
1. Go to https://admob.google.com/
2. Create/sign in to AdMob account  
3. Create new Android app
4. Get **App ID** (ca-app-pub-XXXXXXXXXX~XXXXXXXXXX)
5. Create **Ad Units**:
   - Banner Ad Unit
   - Interstitial Ad Unit

### **Step 3: Update Configuration**
Replace test IDs in `/app/frontend/src/App.js`:

```javascript
// Find this section and replace with your real IDs:
const adConfig = {
  publisherId: 'ca-pub-YOUR-REAL-PUBLISHER-ID', // Your AdSense Publisher ID
  bannerId: 'ca-app-pub-YOUR-PUBLISHER-ID/YOUR-BANNER-UNIT-ID', // Your AdMob Banner Unit
  interstitialId: 'ca-app-pub-YOUR-PUBLISHER-ID/YOUR-INTERSTITIAL-UNIT-ID' // Your AdMob Interstitial Unit
};
```

And in `/app/frontend/src/App.js` banner section:
```javascript
adMob.showBanner({
  containerId: 'main-ad-banner',
  parent: 'main',
  adSlot: 'YOUR-ADSENSE-AD-SLOT-ID', // Your AdSense ad slot
  format: 'rectangle'
});
```

## 📊 Ad Behavior

### **PWA/Web Version:**
- Uses **Google AdSense**
- Banner ads appear after 3 seconds
- Interstitial ads show every 3rd medication added
- Ads display in designated containers

### **TWA/Android Version:**
- Uses **Google AdMob**
- Native AdMob banner integration
- Native interstitial ad experience
- Better performance and revenue

## 🎮 Current Test Configuration

The app is configured with **Google's test ad units**, which are safe for development:

```javascript
// Test IDs currently in use:
testIds = {
  banner: 'ca-app-pub-3940256099942544/6300978111',
  interstitial: 'ca-app-pub-3940256099942544/1033173712',
  rewarded: 'ca-app-pub-3940256099942544/5224354917'
}
```

## 💰 Revenue Optimization

### **Ad Placement Strategy:**
- **Banner**: Bottom of main content area
- **Interstitial**: After adding medications (every 3rd time)
- **Future**: Rewarded ads for premium features

### **User Experience:**
- Non-intrusive placement
- Relevant to health/wellness audience
- Respects user workflow

## 🚀 Deployment Steps

### **For PWA (Current):**
1. Get AdSense approval
2. Replace test IDs with real AdSense IDs
3. Deploy to production
4. Monitor ad performance

### **For TWA (Future Google Play):**
1. Get AdMob account
2. Update configuration with AdMob IDs
3. Build TWA with AdMob plugin
4. Submit to Google Play Store

## ⚠️ Important Notes

### **Policy Compliance:**
- ✅ App follows Google Ad policies
- ✅ Health app category allowed
- ✅ No misleading medical claims
- ✅ User privacy respected

### **Technical Requirements:**
- ✅ HTTPS required for AdSense
- ✅ Valid SSL certificate
- ✅ Privacy policy required
- ✅ GDPR compliance for EU users

## 🧪 Testing

### **Current Test Mode:**
- Safe test ads display without penalty
- No real revenue generated
- Perfect for development and demo

### **Production Checklist:**
- [ ] AdSense account approved
- [ ] Real publisher ID configured
- [ ] Ad units created and configured
- [ ] Privacy policy added
- [ ] GDPR compliance implemented
- [ ] Production domain verified

## 📈 Expected Revenue

### **Conservative Estimates:**
- **PWA AdSense**: $0.50-2.00 per 1000 views
- **TWA AdMob**: $1.00-4.00 per 1000 views  
- **Interstitial**: $2.00-8.00 per 1000 views

### **Optimization Opportunities:**
- Increase user engagement
- Better ad placement
- Targeted content ads
- Premium subscription upselling

## 🔗 Resources

- **AdSense**: https://support.google.com/adsense/
- **AdMob**: https://support.google.com/admob/
- **TWA Guide**: https://developers.google.com/web/android/trusted-web-activity
- **Ad Policies**: https://support.google.com/admob/answer/6128543

## 🆘 Troubleshooting

### **Common Issues:**
1. **Ads not showing**: Check network, IDs, and approval status
2. **Invalid clicks**: Avoid clicking own ads during testing
3. **Policy violations**: Ensure content compliance
4. **Technical errors**: Check console for JavaScript errors

### **Debug Mode:**
Enable debug logging in browser console to see ad loading status and errors.