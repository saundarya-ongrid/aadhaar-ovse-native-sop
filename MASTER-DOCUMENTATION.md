# Aadhaar OVSE Complete Project Documentation

**Project**: Aadhaar OVSE (Online Verification with Selective Disclosure) Integration  
**Last Updated**: March 21, 2026  
**Status**: ✅ Production Ready

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [What We Built](#what-we-built)
3. [Complete Working Flow](#complete-working-flow)
4. [How to Run Each Flow](#how-to-run-each-flow)
5. [SDK Distribution](#sdk-distribution)
6. [Technical Architecture](#technical-architecture)
7. [Key Achievements](#key-achievements)
8. [API Documentation](#api-documentation)
9. [Troubleshooting](#troubleshooting)
10.   [File Structure](#file-structure)

---

## 1. Project Overview

### What This Project Does

This project implements **Aadhaar OVSE verification** allowing users to verify their identity using the mAadhaar mobile app through:

- **App-to-App** communication (iOS/Android)
- **WebView** integration (Android only)
- Complete **API integration** with UIDAI backend

### Technologies Used

- **React Native** with Expo SDK 54
- **TypeScript** for type safety
- **Native iOS** (Xcode, Swift)
- **Native Android** (Kotlin)
- **OVSE API** (UIDAI backend)

---

## 2. What We Built

### A. Main Application

- **Location**: `/Users/userongrid/Desktop/Projects/aadhaar-ovse-sop/`
- **Type**: Expo React Native app
- **Platforms**: iOS (native build) + Android

### B. Three SDK Packages

1. **React Native SDK**
   - Location: `/Users/userongrid/Desktop/Projects/aadhaar-ovse-sdk-rn/`
   - Package: `@gridlines/aadhaar-ovse-sdk`
   - Platform: Cross-platform (iOS + Android)

2. **iOS Native SDK**
   - Location: `/Users/userongrid/Desktop/Projects/aadhaar-ovse-sdk-ios/`
   - Package: `AadhaarOVSESDK`
   - Language: Swift 5.5+

3. **Android Native SDK**
   - Location: `/Users/userongrid/Desktop/Projects/aadhaar-ovse-sdk-android/`
   - Package: `io.gridlines:aadhaar-ovse-sdk`
   - Language: Kotlin

---

## 3. Complete Working Flow

### OVSE Verification Flow (4 Steps + Polling)

```
User Input Token
       ↓
[1] POST /initiate/session
       ↓
   Returns: sessionId, authorization
       ↓
[2] POST /customer/kyc/method
       ↓
   Payload: {sessionId, method: "aadhaarovse"}
       ↓
[3] POST /ovse/generate-intent
       ↓
   Returns: jwt_token, transaction_id
       ↓
[4] Launch Aadhaar App
   iOS: URL Scheme (6 variations tried)
   Android: Intent
       ↓
   User completes verification in Aadhaar app
       ↓
[5] Poll /ovse/status (every 5 seconds)
       ↓
   Check until code ≠ "CALLBACK_NOT_YET_RECEIVED"
       ↓
   Return verification result
```

### Critical Detail: iOS App Launch

The key breakthrough was discovering the correct URL scheme. We try 6 variations:

1. `pehchan://in.gov.uidai.pehchan?req={jwt}`
2. `pehchaan://in.gov.uidai.pehchaan?req={jwt}` (double 'a')
3. `maadhaar://in.gov.uidai.pehchan?req={jwt}`
4. `aadhaar://in.gov.uidai.pehchan?req={jwt}`
5. `pehchan://?req={jwt}` (simplified)
6. `in.gov.uidai.mAadhaar://?req={jwt}` (bundle ID)

**One of these works** (device-dependent), and the app tries all until one succeeds.

---

## 4. How to Run Each Flow

### A. Run Main React Native App (with Metro)

#### On iOS Simulator/Expo Go

```bash
# Navigate to project
cd /Users/userongrid/Desktop/Projects/aadhaar-ovse-sop

# Start Metro bundler
npx expo start

# In another terminal (optional - for LAN access)
npx expo start --lan

# Scan QR code with Expo Go app
```

**Note**: Expo Go **cannot launch** Aadhaar app (limitation).

---

### B. Run Native iOS Build (RECOMMENDED for Testing)

#### Prerequisites

- ✅ Xcode installed
- ✅ iPhone connected via USB
- ✅ mAadhaar app installed on iPhone

#### Build Commands

```bash
# 1. Navigate to project
cd /Users/userongrid/Desktop/Projects/aadhaar-ovse-sop

# 2. Generate native iOS project
npx expo prebuild --platform ios --clean

# 3. Install iOS dependencies
cd ios && pod install && cd ..

# 4. Open in Xcode
open ios/aadhaarovsesop.xcworkspace

# 5. In Xcode:
#    - Select your iPhone as target device
#    - Press Cmd + R to build and run
```

#### First Time Setup in Xcode

1. **Sign the app**:
   - Click project name in left sidebar
   - Select "aadhaarovsesop" target
   - Go to "Signing & Capabilities"
   - Check "Automatically manage signing"
   - Select your Apple ID team

2. **Trust developer on iPhone**:
   - Settings > General > VPN & Device Management
   - Trust your developer certificate

3. **Build and Run**:
   - Press ▶ (Play button) or Cmd + R
   - App installs on your iPhone

#### Testing the Flow

1. Open the installed app on iPhone
2. Tap "Native (OVSE)" button
3. Enter token (e.g., "DPYmAX")
4. Tap "Submit"
5. App will launch mAadhaar app automatically
6. Complete verification in mAadhaar
7. App automatically polls and shows result

---

### C. Run Android Build

#### Prerequisites

- ✅ Android Studio installed
- ✅ Android device/emulator
- ✅ mAadhaar app installed

#### Build Commands

```bash
# 1. Navigate to project
cd /Users/userongrid/Desktop/Projects/aadhaar-ovse-sop

# 2. Generate native Android project
npx expo prebuild --platform android --clean

# 3. Build and run
npx expo run:android

# Or open in Android Studio
open -a "Android Studio" android/
# Then click Run ▶
```

---

### D. Build Release/Production Version

#### iOS Release Build

```bash
cd /Users/userongrid/Desktop/Projects/aadhaar-ovse-sop
open ios/aadhaarovsesop.xcworkspace

# In Xcode:
# 1. Product > Scheme > Edit Scheme
# 2. Run > Build Configuration > Release
# 3. Product > Archive
# 4. Distribute App > Custom > Development
# 5. Export .ipa file
```

#### Android Release Build

```bash
cd /Users/userongrid/Desktop/Projects/aadhaar-ovse-sop/android

# Build release APK
./gradlew assembleRelease

# Output: android/app/build/outputs/apk/release/app-release.apk

# Build AAB (for Play Store)
./gradlew bundleRelease

# Output: android/app/build/outputs/bundle/release/app-release.aab
```

---

## 5. SDK Distribution

### A. React Native SDK

#### Build & Publish

```bash
# Navigate to SDK
cd /Users/userongrid/Desktop/Projects/aadhaar-ovse-sdk-rn

# Test locally
npm install
npm link

# In your test app
npm link @gridlines/aadhaar-ovse-sdk

# Publish to npm
npm login
npm publish --access public
```

#### Client Integration

```bash
# Install
npm install @gridlines/aadhaar-ovse-sdk

# Use
import { OVSEService } from '@gridlines/aadhaar-ovse-sdk';

const result = await OVSEService.verify(
  token,
  (status) => console.log(status)
);
```

---

### B. iOS SDK

#### Distribution via Swift Package Manager

```bash
# Navigate to SDK
cd /Users/userongrid/Desktop/Projects/aadhaar-ovse-sdk-ios

# Initialize git
git init
git add .
git commit -m "Initial commit"

# Create GitHub repo and push
git remote add origin https://github.com/gridlines/aadhaar-ovse-sdk-ios.git
git push -u origin main

# Tag release
git tag 1.0.0
git push --tags
```

#### Client Integration

```swift
// In Xcode:
// File > Add Packages...
// Enter: https://github.com/gridlines/aadhaar-ovse-sdk-ios.git

// Use
import AadhaarOVSESDK

OVSEService.shared.verify(token: "TOKEN") { status in
    print(status)
} completion: { result in
    // Handle result
}
```

#### Distribution via CocoaPods

```bash
cd /Users/userongrid/Desktop/Projects/aadhaar-ovse-sdk-ios

# Validate
pod lib lint AadhaarOVSESDK.podspec

# Register (first time)
pod trunk register support@gridlines.io 'Gridlines'

# Publish
pod trunk push AadhaarOVSESDK.podspec
```

---

### C. Android SDK

#### Build AAR

```bash
cd /Users/userongrid/Desktop/Projects/aadhaar-ovse-sdk-android

# Build release AAR
./gradlew :aadhaar-ovse-sdk:assembleRelease

# Output location:
# aadhaar-ovse-sdk/build/outputs/aar/aadhaar-ovse-sdk-release.aar
```

#### Client Integration

```gradle
// Add to build.gradle
dependencies {
    implementation files('libs/aadhaar-ovse-sdk-release.aar')
    // Or from Maven/JitPack
    implementation 'io.gridlines:aadhaar-ovse-sdk:1.0.0'
}

// Use
import io.gridlines.aadhaar.ovse.OVSEService

OVSEService.getInstance().verify(
    context = this,
    token = "TOKEN",
    onStatusUpdate = { status -> /* ... */ },
    callback = { result -> /* ... */ }
)
```

---

## 6. Technical Architecture

### API Integration

**Base URL**: `https://d29vza544ghj85.cloudfront.net/api/integration`

#### Endpoints

1. **POST** `/initiate/session`
   - Body: `{"token": "DPYmAX"}`
   - Returns: `{status, data: {sessionId, authorization}}`

2. **POST** `/customer/kyc/method`
   - Headers: `Authorization: Bearer {token}`
   - Body: `{sessionId, method: "aadhaarovse"}`
   - Returns: `{status, message}`

3. **POST** `/ovse/generate-intent`
   - Headers: `Authorization: Bearer {token}`
   - Body: `{customer_session_id, channel: "WEB"}`
   - Returns: `{status, data: {jwt_token, transaction_id}}`

4. **POST** `/ovse/status`
   - Headers: `Authorization: Bearer {token}`
   - Body: `{customer_session_id, transaction_id}`
   - Returns: `{code, data, message}`

### Authentication Flow

```
Token (from backend)
    ↓
Initiate Session → Returns authorization token
    ↓
Use Bearer token for all subsequent API calls
```

### Platform-Specific Launching

#### iOS (React Native Linking API)

```javascript
// Try multiple URL schemes
const schemes = [
   `pehchan://in.gov.uidai.pehchan?req=${jwt}`,
   `pehchaan://in.gov.uidai.pehchaan?req=${jwt}`,
   // ... 4 more variations
];

for (const url of schemes) {
   try {
      await Linking.openURL(url);
      break; // Success!
   } catch (err) {
      // Try next
   }
}
```

#### Android (Intent System)

```javascript
await Linking.sendIntent("in.gov.uidai.pehchaan.INTENT_REQUEST", [{ key: "request", value: jwtToken }]);
```

### Configuration Files

#### iOS Info.plist

```xml
<key>LSApplicationQueriesSchemes</key>
<array>
  <string>pehchan</string>
  <string>pehchaan</string>
  <string>maadhaar</string>
</array>
```

#### Android AndroidManifest.xml

```xml
<uses-permission android:name="android.permission.INTERNET" />
```

---

## 7. Key Achievements

### ✅ Problems Solved

1. **iOS App-to-App Launch** (Hardest Problem)
   - ❌ Official docs URL scheme didn't work
   - ❌ Expo Go limitation
   - ✅ Discovered working URL schemes through trial
   - ✅ Implemented fallback mechanism (tries 6 variations)

2. **Network Connectivity Issues**
   - ❌ Mac firewall blocking
   - ❌ Port conflicts
   - ✅ Configured LAN binding
   - ✅ Cleared ports properly

3. **TypeScript Configuration**
   - ❌ 200+ JSX errors
   - ✅ Added correct tsconfig.json settings

4. **API Authentication**
   - ❌ 401 Unauthorized errors
   - ✅ Implemented Bearer token flow correctly

5. **Native Build Process**
   - ❌ Expo to native iOS build complexIt
   - ✅ Created complete build pipeline
   - ✅ Documented every step

### 🎯 What Works Now

- ✅ Complete OVSE API integration
- ✅ Automatic Aadhaar app launching (iOS + Android)
- ✅ Status polling with 5-second intervals
- ✅ Error handling for all scenarios
- ✅ Native iOS build installable on iPhone
- ✅ Three production-ready SDK packages
- ✅ Complete documentation

---

## 8. API Documentation

### Request/Response Examples

#### 1. Initiate Session

**Request:**

```bash
curl -X POST https://d29vza544ghj85.cloudfront.net/api/integration/initiate/session \
  -H "Content-Type: application/json" \
  -d '{"token": "DPYmAX"}'
```

**Response:**

```json
{
   "status": "success",
   "data": {
      "sessionId": "abc123",
      "authorization": "Bearer eyJ..."
   }
}
```

#### 2. Set KYC Method

**Request:**

```bash
curl -X POST https://d29vza544ghj85.cloudfront.net/api/integration/customer/kyc/method \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJ..." \
  -d '{"sessionId": "abc123", "method": "aadhaarovse"}'
```

**Response:**

```json
{
   "status": "success",
   "message": "KYC method set successfully"
}
```

#### 3. Generate Intent

**Request:**

```bash
curl -X POST https://d29vza544ghj85.cloudfront.net/api/integration/ovse/generate-intent \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJ..." \
  -d '{"customer_session_id": "abc123", "channel": "WEB"}'
```

**Response:**

```json
{
   "status": "success",
   "data": {
      "jwt_token": "eyJraWQ...",
      "transaction_id": "txn123"
   }
}
```

#### 4. Check Status

**Request:**

```bash
curl -X POST https://d29vza544ghj85.cloudfront.net/api/integration/ovse/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJ..." \
  -d '{"customer_session_id": "abc123", "transaction_id": "txn123"}'
```

**Response (Pending):**

```json
{
   "code": "CALLBACK_NOT_YET_RECEIVED",
   "message": "Waiting for callback"
}
```

**Response (Success):**

```json
{
   "code": "SUCCESS",
   "data": {
      /* user data */
   },
   "message": "Verification complete"
}
```

---

## 9. Troubleshooting

### Common Issues & Solutions

#### Issue: "Cannot launch Aadhaar app" on iOS

**Causes:**

1. Using Expo Go (doesn't support custom URL schemes)
2. mAadhaar app not installed
3. URL scheme not whitelisted

**Solutions:**

```bash
# 1. Build native version
npx expo run:ios --device

# 2. Ensure Info.plist has LSApplicationQueriesSchemes

# 3. Install mAadhaar from App Store
```

#### Issue: Network connection lost

**Causes:**

- macOS firewall blocking
- Wrong server binding
- Port conflicts

**Solutions:**

```bash
# Kill existing processes
lsof -ti:8081,8082 | xargs kill -9

# Start with LAN binding
REACT_NATIVE_PACKAGER_HOSTNAME=192.168.1.2 npx expo start --lan
```

#### Issue: TypeScript errors

**Solution:**
Check `tsconfig.json` has:

```json
{
   "compilerOptions": {
      "jsx": "react-native",
      "esModuleInterop": true,
      "skipLibCheck": true
   }
}
```

#### Issue: 401 Unauthorized on API calls

**Solution:**
Ensure Bearer token is passed:

```javascript
headers: {
  "Authorization": `Bearer ${authToken}`
}
```

---

## 10. File Structure

### Main Project

```
aadhaar-ovse-sop/
├── app/
│   ├── _layout.tsx                 # Root layout
│   ├── modal.tsx                   # Modal screen
│   ├── (tabs)/
│   │   ├── _layout.tsx            # Tab layout
│   │   ├── index.tsx              # Home (has WebView + OVSE buttons)
│   │   └── explore.tsx            # Explore tab
│   └── ovse-test.tsx              # 🎯 MAIN OVSE LOGIC HERE
├── ios/
│   └── aadhaarovsesop.xcworkspace # Native iOS project
├── android/                        # Native Android project
├── components/                     # Reusable UI components
├── constants/                      # Theme constants
├── hooks/                          # Custom hooks
├── assets/                         # Images and assets
├── app.json                        # Expo configuration
├── package.json                    # Dependencies
├── tsconfig.json                   # TypeScript config
└── MASTER-DOCUMENTATION.md        # 📄 THIS FILE
```

### SDK Projects

```
Desktop/Projects/
├── aadhaar-ovse-sdk-rn/           # React Native SDK
│   ├── src/
│   │   ├── index.js              # Main service
│   │   └── index.d.ts            # TypeScript definitions
│   ├── package.json
│   └── README.md
│
├── aadhaar-ovse-sdk-ios/          # iOS SDK
│   ├── Sources/AadhaarOVSESDK/
│   │   └── OVSEService.swift     # Swift implementation
│   ├── Package.swift
│   ├── AadhaarOVSESDK.podspec
│   └── README.md
│
└── aadhaar-ovse-sdk-android/      # Android SDK
    ├── aadhaar-ovse-sdk/
    │   └── src/main/java/
    │       └── OVSEService.kt     # Kotlin implementation
    ├── build.gradle
    └── README.md
```

---

## Quick Reference Commands

### Development

```bash
# Start Expo dev server
cd ~/Desktop/Projects/aadhaar-ovse-sop
npx expo start

# Build native iOS
npx expo prebuild --platform ios --clean
cd ios && pod install && cd ..
open ios/aadhaarovsesop.xcworkspace

# Build native Android
npx expo prebuild --platform android --clean
npx expo run:android
```

### SDK Distribution

```bash
# React Native
cd ~/Desktop/Projects/aadhaar-ovse-sdk-rn
npm publish

# iOS
cd ~/Desktop/Projects/aadhaar-ovse-sdk-ios
git push --tags

# Android
cd ~/Desktop/Projects/aadhaar-ovse-sdk-android
./gradlew :aadhaar-ovse-sdk:assembleRelease
```

### Cleanup

```bash
# Kill Metro bundler
lsof -ti:8081 | xargs kill -9

# Clean build
cd ~/Desktop/Projects/aadhaar-ovse-sop
rm -rf ios android node_modules
npm install
npx expo prebuild --clean
```

---

## Support

For issues or questions:

- **Email**: support@gridlines.io
- **Documentation**: See individual SDK README files
- **This File**: `/Users/userongrid/Desktop/Projects/aadhaar-ovse-sop/MASTER-DOCUMENTATION.md`

---

**Created**: March 21, 2026  
**Last Updated**: March 21, 2026  
**Version**: 1.0.0  
**Status**: ✅ Production Ready
