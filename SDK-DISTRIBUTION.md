# Aadhaar OVSE SDK Distribution Guide

## Current Status

✅ Working React Native app with iOS native app-to-app integration

## Distribution Options

---

## Option 1: React Native SDK (npm package)

### Structure:

```
aadhaar-ovse-sdk/
├── package.json
├── README.md
├── index.js (or index.ts)
├── src/
│   ├── OVSEService.js
│   ├── components/
│   │   └── OVSEVerification.js
│   └── utils/
│       └── linking.js
├── ios/
│   └── (native iOS code if needed)
├── android/
│   └── (native Android code if needed)
└── example/
    └── App.js
```

### Commands:

```bash
# Create SDK
mkdir aadhaar-ovse-sdk
cd aadhaar-ovse-sdk
npm init -y

# Copy your OVSE logic
cp ../app/ovse-test.tsx ./src/OVSEService.js

# Publish to npm
npm publish

# OR publish to private registry
npm publish --registry https://your-private-registry.com
```

### Client Usage (React Native):

```bash
# Install SDK
npm install aadhaar-ovse-sdk

# Use in app
import { OVSEService } from 'aadhaar-ovse-sdk';

const result = await OVSEService.initiateVerification(token);
```

---

## Option 2: iOS Native SDK (CocoaPods / Swift Package)

### A. Create iOS Framework:

```bash
# In Xcode:
# File > New > Project > Framework (iOS)
# Name: AadhaarOVSESDK

# Add your Swift files:
# - OVSEService.swift
# - NetworkManager.swift
# - Models.swift
```

### B. Distribute via CocoaPods:

```bash
# Create podspec
pod spec create AadhaarOVSESDK

# Edit AadhaarOVSESDK.podspec
# Then publish
pod trunk push AadhaarOVSESDK.podspec
```

### Client Usage (iOS):

```ruby
# Podfile
pod 'AadhaarOVSESDK', '~> 1.0'
```

```swift
// Swift code
import AadhaarOVSESDK

let ovse = OVSEService()
ovse.initiateVerification(token: "DPYmAX") { result in
    // Handle result
}
```

---

## Option 3: Android Native SDK (AAR / Maven)

### A. Create Android Library:

```bash
# In Android Studio:
# File > New > New Module > Android Library
# Name: aadhaar-ovse-sdk

# Add your Kotlin files:
# - OVSEService.kt
# - NetworkManager.kt
# - Models.kt
```

### B. Build AAR:

```bash
cd android
./gradlew :aadhaar-ovse-sdk:assembleRelease

# Output: aadhaar-ovse-sdk/build/outputs/aar/aadhaar-ovse-sdk-release.aar
```

### C. Publish to Maven:

```gradle
// publish.gradle
publishing {
    publications {
        release(MavenPublication) {
            from components.release
            groupId = 'com.yourcompany'
            artifactId = 'aadhaar-ovse-sdk'
            version = '1.0.0'
        }
    }
}
```

### Client Usage (Android):

```gradle
// build.gradle
dependencies {
    implementation 'com.yourcompany:aadhaar-ovse-sdk:1.0.0'
}
```

```kotlin
// Kotlin code
import com.yourcompany.aadhaarovsesdk.OVSEService

val ovse = OVSEService()
ovse.initiateVerification("DPYmAX") { result ->
    // Handle result
}
```

---

## Option 4: Multi-Platform SDK (Recommended for All Platforms)

### Use React Native as Bridge:

1. **Keep React Native SDK as base**
2. **Expose native modules for iOS/Android**
3. **Clients can use from:**
   - React Native apps (npm package)
   - Native iOS apps (CocoaPods bridge)
   - Native Android apps (AAR bridge)

### Structure:

```
aadhaar-ovse-sdk/
├── js/               # React Native code (works everywhere)
├── ios/              # Native iOS bridge
├── android/          # Native Android bridge
└── example/
    ├── react-native/
    ├── ios-native/
    └── android-native/
```

---

## Recommended Approach for Your Case

**Start with React Native SDK (Option 1)**

### Why?

1. ✅ You already have working React Native code
2. ✅ Works on both iOS and Android
3. ✅ Easiest to maintain
4. ✅ Can expose native modules later if needed

### Quick Start Commands:

```bash
# 1. Create SDK package
cd /Users/userongrid/Desktop/Projects
mkdir aadhaar-ovse-sdk
cd aadhaar-ovse-sdk

# 2. Initialize
npm init -y

# 3. Copy your working code
cp ../aadhaar-ovse-sop/app/ovse-test.tsx ./src/index.ts

# 4. Clean up and export
# (Remove UI components, export only service logic)

# 5. Test locally
npm link

# 6. In client app
npm link aadhaar-ovse-sdk

# 7. Publish
npm publish
```

---

## Complete Distribution Checklist

### For React Native SDK:

- [ ] Extract OVSE logic into reusable service
- [ ] Remove UI components (or make optional)
- [ ] Add TypeScript definitions
- [ ] Write README with examples
- [ ] Add example app
- [ ] Test on iOS and Android
- [ ] Publish to npm

### For iOS Native SDK:

- [ ] Convert React Native logic to Swift
- [ ] Create iOS Framework project
- [ ] Add CocoaPods support
- [ ] Write Swift documentation
- [ ] Test in sample iOS app
- [ ] Publish to CocoaPods

### For Android Native SDK:

- [ ] Convert React Native logic to Kotlin
- [ ] Create Android Library module
- [ ] Build AAR file
- [ ] Write Kotlin documentation
- [ ] Test in sample Android app
- [ ] Publish to Maven/JitPack

---

## Client Integration Examples

### React Native Client:

```javascript
import { OVSEService } from "aadhaar-ovse-sdk";

const verifyUser = async (token) => {
   try {
      const result = await OVSEService.verify(token);
      console.log("Verification result:", result);
   } catch (error) {
      console.error("Verification failed:", error);
   }
};
```

### iOS Native Client:

```swift
import AadhaarOVSESDK

OVSEService.shared.verify(token: "DPYmAX") { result in
    switch result {
    case .success(let data):
        print("Verified:", data)
    case .failure(let error):
        print("Error:", error)
    }
}
```

### Android Native Client:

```kotlin
import com.yourcompany.aadhaarovsesdk.OVSEService

OVSEService.getInstance().verify("DPYmAX") { result ->
    when (result) {
        is Result.Success -> println("Verified: ${result.data}")
        is Result.Error -> println("Error: ${result.error}")
    }
}
```

---

## Next Steps

1. **Decide distribution strategy** (React Native first recommended)
2. **Extract core logic** from app/ovse-test.tsx
3. **Create SDK package structure**
4. **Add documentation and examples**
5. **Test with sample apps**
6. **Publish to package registry**

Would you like me to help you create any of these SDK packages?
