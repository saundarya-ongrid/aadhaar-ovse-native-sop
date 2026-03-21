# 🧪 OVSE Testing Guide

## Quick Start

Your Expo app is now ready to test the OVSE flow! I've created a test screen that handles the complete API flow.

## Setup

### 1. Start the Expo Server (if not already running)

```bash
# From the root directory
npm start
```

This will start the Metro bundler and show a QR code in your terminal.

---

## Testing on Android Emulator

### Option 1: Using Terminal

```bash
# From the root directory
npm run android
```

### Option 2: Using Expo QR Code

1. Make sure Android emulator is running
2. Press `a` in the terminal where `npm start` is running
3. App will automatically open on the emulator

### Steps to Test:

1. **Launch the app** - It will open to the "Aadhaar OVSE" landing screen
2. **Tap "Native" button** - This now says "Test OVSE Flow"
3. **You'll see the OVSE Test screen** with:
   - Token input field
   - Session data display
   - Status indicator
   - Polling controls

4. **Enter a token** (get this from your backend team, e.g., "DPYmAX")
5. **Tap "Start OVSE Flow"** - Watch the screen for:
   - ✅ "Initiating session..."
   - ✅ "Session created"
   - ✅ "Setting KYC method..."
   - ✅ "KYC method set"
   - ✅ "Generating intent..."
   - ✅ "Intent generated successfully!"

6. **You'll see an alert** with options:
   - "Copy JWT" - Copies JWT to console
   - "Start Polling" - Begins status polling

7. **Tap "Start Polling"** - The screen will:
   - Show "Polling (X/60)..."
   - Poll every 5 seconds
   - Display real-time status updates

8. **Complete authentication in Aadhaar app** (if you have it installed)
   - Or wait for backend to simulate completion

9. **View the final result** in an alert dialog

### Note for Android:

- **Aadhaar app launch**: Currently the test screen doesn't launch the Aadhaar app (that requires native module integration)
- **This test focuses on**: API flow, JWT generation, and status polling
- **To test app launch**: You'll need to integrate the native Android module

---

## Testing on iOS Device (Real Device)

### Setup Expo Go:

1. Install **Expo Go** from the App Store on your iPhone
2. Make sure your iPhone and Mac are on the **same WiFi network**

### Steps to Connect:

1. **Start Expo server**: `npm start` (from root directory)
2. **Open Expo Go** app on your iPhone
3. **Scan the QR code** shown in your terminal/browser
   - Or enter the URL manually (shown in terminal like `exp://192.168.x.x:8081`)

### Alternative: Using Tunnel Mode

If WiFi connection doesn't work:

```bash
# Stop the current server (Ctrl+C)
npm start -- --tunnel
```

This creates a tunnel so your iPhone can connect via internet instead of local network.

### Steps to Test (Same as Android):

1. App opens to landing screen
2. Tap "Native" (Test OVSE Flow)
3. Enter token
4. Start OVSE flow
5. Watch API calls complete
6. Start polling
7. View results

### iOS Specific Notes:

- **Network requests**: Make sure your API allows requests from the Expo Go app
- **CORS**: The API should allow cross-origin requests
- **SSL**: The API must use HTTPS (not HTTP)

---

## What You'll See in the Test Screen

### 📱 OVSE Test Screen Layout

```
┌─────────────────────────────┐
│  ← Back    OVSE Test   Clear│
├─────────────────────────────┤
│ 🧪 Test Environment         │
│ API: d29vza544ghj85...      │
│ Polling: 5s interval...     │
├─────────────────────────────┤
│ Enter Token                  │
│ ┌─────────────────────────┐ │
│ │ e.g., DPYmAX            │ │
│ └─────────────────────────┘ │
├─────────────────────────────┤
│  [ Start OVSE Flow ]        │
├─────────────────────────────┤
│ Status                       │
│ ● Polling (12/60)...        │
├─────────────────────────────┤
│ Session Data                 │
│ Session ID: abc123...       │
│ Transaction ID: xyz789...   │
│ JWT: eyJhbGc...             │
├─────────────────────────────┤
│ 📋 Instructions             │
│ 1. Enter valid token...     │
│ 2. Tap Start OVSE Flow...   │
└─────────────────────────────┘
```

---

## Expected Flow

### ✅ Successful Flow:

1. **User enters token** → `DPYmAX`
2. **API: Initiate Session** → Returns `session_id`
3. **API: Set KYC Method** → Returns `customer_session_id`
4. **API: Generate Intent** → Returns `transaction_id` + `jwt`
5. **Alert shows** → "Ready to Launch"
6. **User starts polling** → Button: "Start Polling"
7. **Polling begins** → Every 5 seconds (max 60 times = 5 minutes)
8. **Status updates** → "CALLBACK_NOT_YET_RECEIVED" → "SUCCESS"
9. **Alert shows** → "Verification Complete"

### ❌ Error Cases to Test:

#### Invalid Token:

```
Enter: "INVALID_TOKEN_123"
Expected: Error alert "Failed to initiate session"
```

#### Network Error:

```
Turn off WiFi
Tap "Start OVSE Flow"
Expected: Error alert with network message
```

#### Polling Timeout:

```
Complete flow but don't authenticate
Wait 5 minutes (60 polls × 5 seconds)
Expected: "Polling timeout after 5 minutes"
```

---

## Debugging Tips

### View Console Logs:

#### Android:

```bash
# In a new terminal
npx react-native log-android
```

Or use Chrome DevTools:

1. Shake the device/emulator
2. Select "Debug"
3. Open Chrome → `localhost:8081/debugger-ui`

#### iOS:

```bash
# In a new terminal
npx react-native log-ios
```

Or use Safari:

1. Safari → Develop → [Your iPhone] → Automatically Show Web Inspector

### Check Network Calls:

All API calls are logged to console with:

- Request URL
- Request body
- Response data

Look for logs like:

```
Session Response: { session_id: "...", customer: "..." }
KYC Response: { customer_session_id: "..." }
Intent Response: { transaction_id: "...", jwt: "..." }
Poll 1/60: { code: "CALLBACK_NOT_YET_RECEIVED" }
```

---

## Common Issues & Solutions

### Issue: "Unable to connect to Metro bundler"

**Solution:**

```bash
# Clear cache and restart
npx expo start --clear
```

### Issue: "Network request failed" on device

**Solution:**

- Make sure device and computer are on same WiFi
- Or use tunnel mode: `npm start -- --tunnel`
- Check if API allows requests from your IP

### Issue: "App crashes on launch"

**Solution:**

```bash
# Clear watchman and cache
watchman watch-del-all
npx expo start --clear
```

### Issue: QR code doesn't scan on iOS

**Solution:**

- Use the manual URL entry in Expo Go
- Or try tunnel mode: `npm start -- --tunnel`

### Issue: API returns 404 or 500

**Solution:**

- Verify the API base URL is correct
- Check if token is valid (get new one from backend)
- Review API documentation

---

## Testing Checklist

Before reporting the OVSE flow as working, verify:

- [ ] App launches on Android emulator
- [ ] App launches on iOS device (via Expo Go)
- [ ] Landing screen shows both buttons
- [ ] "Native" button navigates to OVSE Test screen
- [ ] Token input accepts text
- [ ] "Start OVSE Flow" button works
- [ ] Step 1: Session initiation succeeds
- [ ] Step 2: KYC method setting succeeds
- [ ] Step 3: Intent generation succeeds
- [ ] JWT token is displayed
- [ ] "Start Polling" begins polling
- [ ] Poll count increments (X/60)
- [ ] Status updates every 5 seconds
- [ ] Error handling works (test with invalid token)
- [ ] "Clear" button resets state
- [ ] "Back" button returns to landing screen
- [ ] Console logs show API requests/responses

---

## Next Steps: Native Integration

This test screen validates the **API flow** and **polling mechanism**. To complete the full OVSE integration with Aadhaar app launch:

### For Production:

1. **Eject from Expo** → `npx expo prebuild`
2. **Integrate native modules** (Android VKYCModule, iOS VKYCBridgeModule)
3. **Add Aadhaar app detection** (check if installed)
4. **Implement app launch** (Android Intent / iOS URL scheme)
5. **Handle app callbacks** (deep linking)

### Or Use the VKYC SDK Screens:

The `vkyc-sdk/vkyc-core` folder has complete screens with:

- `OVSETokenInputScreen.tsx`
- `OVSEProcessingScreen.tsx` (with native app launch)
- `OVSEResultScreen.tsx`

These require React Native + native module integration (not compatible with Expo Go).

---

## API Configuration

### Change API Base URL:

Edit `/app/ovse-test.tsx` line 26:

```typescript
private static BASE_URL = 'https://your-api-url.com/api/integration';
```

### Get Valid Token:

Contact your backend team to generate a test token. The token should:

- Be active/not expired
- Be associated with a test user
- Allow OVSE verification

---

## Support

### Logs to Share:

When reporting issues, include:

1. Console logs (full output)
2. Network tab (API requests/responses)
3. Device info (Android version / iOS version)
4. Steps to reproduce

### Need Help?

- Check the [OVSE_SETUP.md](../OVSE_SETUP.md) for detailed integration guide
- Review [OVSE_POC.md](../vkyc-sdk/vkyc-core/OVSE_POC.md) for API documentation
- Open an issue with logs and screenshots

---

## Summary

You now have a **fully functional OVSE test screen** that:
✅ Accepts token input
✅ Makes 3 sequential API calls (session → KYC method → intent)
✅ Generates JWT for Aadhaar app
✅ Polls status every 5 seconds
✅ Shows real-time updates
✅ Handles errors gracefully

**Test it now:**

```bash
npm start
# Then press 'a' for Android or scan QR on iOS
```

Happy testing! 🚀
