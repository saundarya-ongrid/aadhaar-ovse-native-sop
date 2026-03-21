# OVSE (Offline Verification with Secure Execution) POC

## Overview

This document describes the implementation of Aadhaar OVSE verification flow in the VKYC SDK.

## Architecture

The OVSE flow consists of:

1. **Token Input** - User enters a unique token (e.g., "DPYmAX")
2. **API Orchestration** - Sequential API calls to set up the verification session
3. **Native App Launch** - Opens the Aadhaar app (Android/iOS) for biometric verification
4. **Status Polling** - Polls the backend every 5 seconds for verification result

## Flow Diagram

```
User Input Token
     ↓
API: initiate/session
     ↓
API: customer/kyc/method
     ↓
API: ovse/generate-intent
     ↓
Launch Aadhaar App (via Intent/URL Scheme)
     ↓
User completes biometric auth in Aadhaar
     ↓
Poll API: ovse/status (every 5s, max 60 attempts)
     ↓
Display Result
```

## API Endpoints

Base URL: `https://d29vza544ghj85.cloudfront.net/api/integration`

### 1. Initiate Session

```
POST /initiate/session
Body: { "token": "DPYmAX" }
Response: { "session_id": "...", "customer": "..." }
```

### 2. Set KYC Method

```
POST /customer/kyc/method
Body: {
  "session_id": "...",
  "method_id": "OFFLINESESSION"
}
Response: { "customer_session_id": "..." }
```

### 3. Generate Intent

```
POST /ovse/generate-intent
Body: {
  "customer_session_id": "...",
  "channel": "mobile"
}
Response: {
  "transaction_id": "...",
  "jwt": "..." // Used to launch Aadhaar app
}
```

### 4. Poll Status

```
POST /ovse/status
Body: {
  "customer_session_id": "...",
  "transaction_id": "..."
}
Response: {
  "code": "CALLBACK_NOT_YET_RECEIVED" | "SUCCESS" | "FAILED",
  "message": "...",
  "data": { ... }
}
```

## Native Integration

### Android (Intent)

**Action:** `in.gov.uidai.pehchaan.INTENT_REQUEST`
**Extra:** `request` (JWT token)

```kotlin
val intent = Intent().apply {
    action = "in.gov.uidai.pehchaan.INTENT_REQUEST"
    putExtra("request", jwtToken)
}
activity.startActivity(intent)
```

### iOS (URL Scheme)

**Scheme:** `pehchan://in.gov.uidai.pehchan`
**Parameter:** `req` (JWT token)

```swift
let urlString = "pehchan://in.gov.uidai.pehchan?req=\(encodedToken)"
let url = URL(string: urlString)
UIApplication.shared.open(url)
```

**iOS Info.plist Configuration:**

```xml
<key>LSApplicationQueriesSchemes</key>
<array>
    <string>pehchan</string>
</array>
```

## File Structure

### React Native Core

```
vkyc-core/src/
├── services/
│   └── OVSEAPIService.ts          # API client for OVSE endpoints
├── screens/
│   ├── OVSETokenInputScreen.tsx   # Token input screen
│   ├── OVSEProcessingScreen.tsx   # Aadhaar app launch + polling
│   └── OVSEResultScreen.tsx       # Display verification result
├── utils/
│   └── NativeBridge.ts            # Added launchAadhaarApp() method
└── navigation/
    └── AppNavigator.tsx           # Added OVSE routes
```

### Android SDK

```
vkyc-android-sdk/src/main/java/com/vkyc/sdk/
└── VKYCModule.kt                  # Added launchAadhaarApp() method
```

### iOS SDK

```
vkyc-ios-sdk/Sources/VKYC/
└── VKYCBridgeModule.swift         # Added launchAadhaarApp() method
```

## Implementation Details

### OVSEAPIService.ts

- **Purpose:** Centralized API client for OVSE endpoints
- **Methods:**
   - `initiateSession(token)` - Creates a new session
   - `setKYCMethod(sessionId, methodId)` - Sets verification method
   - `generateIntent(customerSessionId, channel)` - Generates JWT for app launch
   - `checkStatus(customerSessionId, transactionId)` - Checks verification status
   - `pollStatus(...)` - Polls status every 5s (max 60 attempts = 5 minutes)

### OVSETokenInputScreen.tsx

- **Purpose:** Entry point for OVSE flow
- **Features:**
   - Text input for token (auto-capitalized)
   - Validates non-empty token
   - Calls 3 APIs sequentially: initiate → setKYCMethod → generateIntent
   - Navigates to OVSEProcessing with sessionId, transactionId, jwtToken
   - Redux integration for loading/error states
   - NativeBridge event tracking

### OVSEProcessingScreen.tsx

- **Purpose:** Launches Aadhaar app and polls for result
- **Features:**
   - Calls `NativeBridge.launchAadhaarApp(jwtToken)` on mount
   - Starts polling after 2-second delay
   - Polls every 5 seconds (max 60 attempts)
   - Shows poll count (X/60)
   - Displays instructions for user
   - Navigates to OVSEResult on success
   - Navigates to Error on timeout/failure

### OVSEResultScreen.tsx

- **Purpose:** Displays final verification result
- **Features:**
   - Shows status code, message, session/transaction IDs
   - Displays response data in JSON format
   - Calls `NativeBridge.onSuccess()` or `onFailure()`
   - Done button closes the SDK

### NativeBridge.launchAadhaarApp()

**React Native (NativeBridge.ts):**

```typescript
async launchAadhaarApp(jwtToken: string): Promise<void>
```

**Android (VKYCModule.kt):**

```kotlin
@ReactMethod
fun launchAadhaarApp(jwtToken: String, promise: Promise)
```

**iOS (VKYCBridgeModule.swift):**

```swift
@objc func launchAadhaarApp(
    _ jwtToken: String,
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
)
```

## Usage

### Starting OVSE Flow

From the Welcome screen:

```typescript
navigation.navigate("OVSETokenInput");
```

Or programmatically:

```typescript
navigation.navigate("OVSETokenInput");
```

### Navigation Flow

```
Welcome
  → OVSETokenInput (enter token)
    → OVSEProcessing (launch app + poll)
      → OVSEResult (show result)
        → Close SDK
      → Error (on timeout/failure)
        → Close SDK
```

## Error Handling

### Network Errors

- All API calls wrapped in try-catch
- Error messages extracted from `response.data.message`
- Redux error state updated
- User redirected to Error screen

### Native Errors

- **APP_NOT_INSTALLED:** Aadhaar app not installed
- **LAUNCH_FAILED:** Failed to launch Aadhaar app
- **ENCODING_ERROR:** (iOS only) Failed to encode JWT
- **INVALID_URL:** (iOS only) Failed to create URL

### Polling Timeout

- Max 60 attempts (5 minutes)
- If timeout reached, navigates to Error screen with "Verification timeout" message

## Testing

### Prerequisites

1. Aadhaar app installed on device
2. Valid token from backend team
3. Device connected to internet

### Test Steps

1. Open app, tap "Start OVSE Verification"
2. Enter token (e.g., "DPYmAX")
3. Tap "Submit"
4. Verify Aadhaar app launches
5. Complete biometric auth in Aadhaar app
6. Verify polling starts
7. Verify result screen appears with success/failure

### Test Cases

- ✅ Valid token flow
- ✅ Invalid token error
- ✅ Network error handling
- ✅ Aadhaar app not installed
- ✅ Polling timeout (wait 5+ minutes)
- ✅ Cancel button at each stage
- ✅ Screen tracking events

## Known Limitations

1. **No callback from Aadhaar app:** Currently relies on polling. Could be enhanced with deep linking to receive callback.
2. **5-minute timeout:** Fixed at 60 attempts × 5 seconds. May need adjustment based on real-world usage.
3. **No retry logic:** If polling fails, user must restart flow. Could add retry button.
4. **No background polling:** Polling stops if app is backgrounded. Could use background tasks.

## Future Enhancements

1. **Deep linking:** Implement `vkyc://ovse/callback` to receive result from Aadhaar app
2. **Push notifications:** Notify user when verification completes
3. **Background polling:** Continue polling in background
4. **Retry mechanism:** Allow user to retry failed API calls
5. **Token validation:** Validate token format before API call
6. **Biometric prompt:** Show native biometric prompt as fallback
7. **Progress indicator:** Show detailed progress during API calls

## Troubleshooting

### Aadhaar app doesn't launch

- Verify app is installed
- Check Intent/URL scheme is correct
- Check JWT token is valid
- Check device permissions

### Polling never completes

- Verify transaction ID is correct
- Check network connectivity
- Verify backend is processing request
- Check backend logs for errors

### "APP_NOT_INSTALLED" error

- Install Aadhaar app from Play Store / App Store
- Verify URL scheme is registered (iOS Info.plist)

### API errors

- Check base URL is correct
- Verify token is valid
- Check network connectivity
- Review API response in console logs

## References

- OVSE API Documentation: [Link to API docs]
- Aadhaar App: [Link to download page]
- UIDAI Guidelines: [Link to guidelines]
