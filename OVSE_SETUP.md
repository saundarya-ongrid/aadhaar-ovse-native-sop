# OVSE Setup Guide

This guide helps you integrate the OVSE (Offline Verification with Secure Execution) POC into your app.

## Prerequisites

1. **Aadhaar app installed** on test device
   - Android: [UIDAI Aadhaar app from Play Store]
   - iOS: [UIDAI Aadhaar app from App Store]

2. **Valid token** from backend team (e.g., "DPYmAX")

3. **Internet connectivity** for API calls

## Platform Configuration

### iOS Configuration

Add the following to your app's `Info.plist`:

```xml
<key>LSApplicationQueriesSchemes</key>
<array>
    <string>pehchan</string>
</array>
```

This allows your app to query if the Aadhaar app is installed and to open URL schemes.

**Location:** `ios/YourApp/Info.plist`

### Android Configuration

No additional configuration required. The Intent system will automatically handle the Aadhaar app launch.

However, if you want to handle the callback from Aadhaar app, add:

```xml
<!-- AndroidManifest.xml -->
<activity android:name=".MainActivity">
    <intent-filter>
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE" />
        <data android:scheme="vkyc" android:host="ovse" />
    </intent-filter>
</activity>
```

## Integration Steps

### 1. Import VKYC SDK

```typescript
import VKYC from "@vkyc/sdk";
```

### 2. Initialize SDK

```typescript
const config = {
   apiKey: "your-api-key",
   environment: "production",
};

VKYC.initialize(config, {
   onSuccess: (result) => {
      console.log("OVSE verification success:", result);
   },
   onFailure: (error) => {
      console.error("OVSE verification failed:", error);
   },
   onCancel: () => {
      console.log("User cancelled OVSE verification");
   },
});
```

### 3. Launch OVSE Flow

```typescript
// Option 1: Full VKYC flow (includes OVSE)
VKYC.start();

// Option 2: Direct OVSE flow
navigation.navigate("OVSETokenInput");
```

### 4. Handle Callbacks

```typescript
VKYC.initialize(config, {
   onSuccess: (result) => {
      // result contains:
      // - sessionId
      // - transactionId
      // - code (status code)
      // - data (verification data)

      console.log("Session ID:", result.sessionId);
      console.log("Status:", result.code);
      console.log("Data:", result.data);
   },

   onFailure: (error) => {
      // error contains:
      // - code (error code)
      // - message (error message)

      console.error("Error:", error.code, error.message);
   },

   onCancel: () => {
      console.log("User cancelled");
   },
});
```

## Testing

### 1. Local Testing

```bash
# Terminal 1: Start Metro bundler
cd vkyc-sdk/vkyc-core
npm start

# Terminal 2: Run on Android
npm run android

# Terminal 2 (alternative): Run on iOS
npm run ios
```

### 2. Test with Token

1. Launch app
2. Tap "Start OVSE Verification"
3. Enter token (provided by backend team)
4. Tap "Submit"
5. Aadhaar app should launch
6. Complete biometric auth
7. Return to app (automatically or manually)
8. Verify polling starts and result appears

### 3. Test Error Cases

#### Token Not Found

- Enter invalid token (e.g., "INVALID")
- Verify error screen shows

#### Aadhaar App Not Installed

- Uninstall Aadhaar app
- Try launching OVSE flow
- Verify error: "Aadhaar app is not installed"

#### Network Error

- Disable internet
- Try launching OVSE flow
- Verify error screen shows network error

#### Timeout

- Complete step 1-3 above
- When Aadhaar app launches, don't complete auth
- Wait 5+ minutes
- Verify timeout error shows

## Debugging

### Enable Debug Logs

#### React Native

```typescript
// In your app
console.log('[OVSE Debug] Enabled');

// Check logs
npx react-native log-android  // Android
npx react-native log-ios      // iOS
```

#### Android

```bash
adb logcat | grep -i vkyc
```

#### iOS

```bash
# Xcode → Product → Scheme → Edit Scheme → Run → Arguments
# Add: -com.apple.CoreData.SQLDebug 1

# Or use Console app to filter "VKYC"
```

### Common Issues

#### "VKYCModule not found"

- Verify native modules are linked
- Run `cd ios && pod install` (iOS)
- Clean build: `cd android && ./gradlew clean` (Android)

#### "Cannot resolve module '@vkyc/sdk'"

- Verify package is installed: `npm list @vkyc/sdk`
- Clear cache: `npm start --reset-cache`

#### "Aadhaar app doesn't launch"

- Check app is installed
- Verify Intent/URL scheme in logs
- Check JWT token is not empty
- Android: Check Intent filter in logs
- iOS: Check `LSApplicationQueriesSchemes` in Info.plist

#### "Polling never completes"

- Check network connectivity
- Verify transaction ID in logs
- Check backend API is processing request
- Increase timeout (default: 5 minutes)

## API Configuration

If you need to change the API base URL:

```typescript
// vkyc-core/src/services/OVSEAPIService.ts
private static BASE_URL = "https://your-api-domain.com/api/integration";
```

## Environment Variables

For different environments:

```typescript
// .env
OVSE_API_URL=https://d29vza544ghj85.cloudfront.net/api/integration
OVSE_TIMEOUT=300000  // 5 minutes in ms
OVSE_POLL_INTERVAL=5000  // 5 seconds in ms
```

Load in code:

```typescript
import Config from "react-native-config";

const BASE_URL = Config.OVSE_API_URL || "https://d29vza544ghj85.cloudfront.net/api/integration";
```

## Production Checklist

- [ ] API base URL updated to production
- [ ] Valid API keys configured
- [ ] iOS Info.plist configured with `LSApplicationQueriesSchemes`
- [ ] Aadhaar app installation verified
- [ ] Error handling tested (all error cases)
- [ ] Timeout tested (wait 5+ minutes)
- [ ] Network error handling tested
- [ ] Success flow tested end-to-end
- [ ] Redux state properly cleared after flow
- [ ] Memory leaks checked (no retained references)
- [ ] Analytics/tracking events configured
- [ ] User instructions added (explain Aadhaar auth)

## Security Considerations

1. **JWT Token Security**
   - JWT is passed to Aadhaar app via Intent/URL scheme
   - Token is short-lived (typically 5-10 minutes)
   - Token is single-use
   - Do not log JWT in production

2. **HTTPS Only**
   - All API calls use HTTPS
   - Certificate pinning recommended for production

3. **Data Encryption**
   - Response data may contain PII
   - Store securely or don't persist
   - Clear data after flow completes

4. **App Transport Security (iOS)**
   - Ensure `NSAppTransportSecurity` allows HTTPS

## Support

For issues or questions:

- Email: support@vkyc.com
- Docs: https://docs.vkyc.com
- GitHub: https://github.com/vkyc/vkyc-sdk

## References

- [OVSE POC Documentation](./OVSE_POC.md)
- [VKYC SDK Documentation](../README.md)
- [UIDAI Aadhaar Guidelines](https://uidai.gov.in)
