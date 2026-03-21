# VKYC iOS SDK - Architecture Overview

## 🏗️ Architecture

The VKYC iOS SDK follows a **Native Wrapper + React Native Core** architecture.

```
┌──────────────────────────────────────────────────────────┐
│                   Client iOS App                          │
│                                                           │
│  ┌─────────────────────────────────────────────────┐    │
│  │    VKYCManager.start(from:config:completion:)   │    │
│  └──────────────────────┬──────────────────────────┘    │
└─────────────────────────┼────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────┐
│            VKYC iOS SDK (.xcframework)                    │
│                                                           │
│  ┌──────────────────┐  ┌──────────────────────────────┐ │
│  │  VKYCManager     │  │   VKYCViewController         │ │
│  │  (Entry API)     │─▶│   (React Native Host)        │ │
│  └──────────────────┘  └────────┬─────────────────────┘ │
│                                  │                        │
│  ┌──────────────────────────────┼──────────────────────┐ │
│  │       React Native Bridge    │                      │ │
│  │                               │                      │ │
│  │    ┌──────────────────────────▼────────────────────┐ │ │
│  │    │      VKYCBridgeModule                         │ │ │
│  │    │  (Native ↔ RN Communication)                  │ │ │
│  │    └────────────────────────────────────────────────┘ │ │
│  └──────────────────────┬───────────────────────────────┘ │
└─────────────────────────┼────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────┐
│            React Native Core (vkyc-core)                  │
│                                                           │
│  ┌────────────┐  ┌────────────┐  ┌──────────────┐      │
│  │  VKYCApp   │  │   Config   │  │  API Layer   │      │
│  │ (Entry)    │─▶│  Manager   │─▶│  (Network)   │      │
│  └────────────┘  └────────────┘  └──────────────┘      │
│        │                                                 │
│        ▼                                                 │
│  ┌───────────────────────────────────────────────┐     │
│  │         Navigation & UI Screens               │     │
│  │  (Document Capture, Face Capture, etc.)       │     │
│  └───────────────────────────────────────────────┘     │
└──────────────────────────────────────────────────────────┘
```

---

## 📦 Components

### 1. **VKYCManager.swift** (Entry Point)

- Main SDK API
- Singleton pattern
- Manages lifecycle
- Handles callbacks (delegate + completion)
- Thread-safe

**Key Methods:**

- `start(from:config:completion:)` - Start VKYC with completion handler
- `start(from:config:)` - Start VKYC with delegate
- `initialize()` - Optional initialization
- Internal callback handlers

**Properties:**

- `shared` - Singleton instance
- `version` - SDK version
- `delegate` - Optional delegate for callbacks

### 2. **VKYCConfig.swift** (Configuration)

- Immutable configuration class
- Validation logic
- Dictionary conversion for RN
- Supports theme, features, metadata

**Structure:**

```swift
VKYCConfig(
    token: String,
    apiKey: String,
    environment: Environment
) {
    theme: VKYCTheme?
    features: VKYCFeatures?
    metadata: [String: Any]?
}
```

### 3. **VKYCDelegate.swift** (Callbacks)

- Protocol for lifecycle events
- Result enum for completion handler
- Error class with codes
- Optional delegate methods

**Patterns:**

- Delegate pattern for continuous updates
- Completion handler for one-time result
- Both can be used together

**Callbacks:**

- `vkycDidStart()` - Flow started
- `vkycDidSucceed(with:)` - Verification successful
- `vkycDidFail(with:)` - Verification failed
- `vkycDidCancel()` - User cancelled
- `vkycDidReceiveEvent(_:metadata:)` - Tracking events

### 4. **VKYCViewController.swift** (React Native Host)

- UIViewController subclass
- Hosts RCTRootView
- Creates RCTBridge
- Passes config via initialProperties
- Manages RN lifecycle

**Flow:**

1. Initializes with VKYCConfig
2. Creates React Native bridge
3. Sets up RCTRootView with config
4. Mounts VKYCApp component
5. Handles callbacks from RN
6. Cleans up on dismissal

### 5. **VKYCBridgeModule.swift** (Bridge Module)

- Conforms to RCTBridgeModule
- Enables RN → Native communication
- Triggers callbacks
- Dismisses view controller

**Methods (Called from RN):**

- `onSuccess(_:)` - Notify success
- `onFailure(_:errorMessage:errorDetails:)` - Notify failure
- `onCancel()` - Notify cancel
- `onEvent(_:metadata:)` - Send event
- `close()` - Dismiss view

**Exports:**

- Constants to RN (SDK_VERSION, PLATFORM)
- Runs on main queue

### 6. **VKYCBridgeModule.m** (Objective-C Bridge)

- Exposes Swift module to React Native
- Uses RCT_EXTERN_MODULE macros
- Required for RN to recognize Swift methods

---

## 🔄 Data Flow

### 1. **Native → React Native** (Configuration)

```
Client App
    ↓
VKYCManager.start(config)
    ↓
config.toDictionary()
    ↓
VKYCViewController created
    ↓
RCTRootView with initialProperties
    ↓
VKYCApp component receives props
```

### 2. **React Native → Native** (Callbacks)

```
React Native UI/Logic
    ↓
NativeModules.VKYCModule.onSuccess(result)
    ↓
VKYCBridgeModule.onSuccess()
    ↓
VKYCViewController.handleSuccess()
    ↓
VKYCManager.handleSuccess()
    ↓
delegate?.vkycDidSucceed() + completion(.success)
    ↓
Client App handles success
```

---

## 🎯 Key Design Decisions

### 1. **Singleton + Delegate Pattern**

- Singleton for global access
- Delegate for flexible callbacks
- Completion handler for convenience
- Supports both patterns simultaneously

### 2. **Weak References**

- Prevents retain cycles
- VKYCManager weak delegate
- VKYCViewController weak in bridge
- Automatic cleanup

### 3. **Dictionary for Configuration**

- React Native requires NSDictionary
- Type-safe conversion in Swift
- JSON-serializable values only

### 4. **Separate View Controller**

- Isolates React Native lifecycle
- Modal presentation
- No interference with host app
- Easy dismissal

### 5. **Protocol-based Callbacks**

- Optional delegate methods
- Flexible implementation
- Objective-C compatible

### 6. **Validation Layer**

- Fail-fast approach
- Clear error messages
- Prevents runtime issues

---

## 🔐 Security Considerations

1. **Token Management**
   - Tokens passed via view controller
   - Not persisted by SDK
   - Client responsible for security

2. **Permissions**
   - Runtime permission checks
   - Clear usage descriptions
   - Graceful denial handling

3. **Code Obfuscation**
   - Public API kept clear
   - Internal methods can be obfuscated
   - React Native bundle encryption

---

## 📊 Performance

1. **Lazy Initialization**
   - React Native loaded on-demand
   - Minimal impact on host app
   - Fast startup

2. **Memory Management**
   - Weak references prevent leaks
   - View controller lifecycle respected
   - React Native properly invalidated

3. **Bundle Size**
   - SDK: ~400KB (Swift code)
   - RN Bundle: ~2-3MB (JavaScript)
   - Total: ~2.4-3.4MB

---

## 🧪 Testing Strategy

1. **Unit Tests**
   - Config validation
   - Error code conversion
   - Dictionary conversion

2. **Integration Tests**
   - View controller lifecycle
   - Callback triggering
   - Bridge communication

3. **UI Tests**
   - React Native rendering
   - User flows
   - Error scenarios

---

## 🚀 Deployment

### Building XCFramework

```bash
# Build for device
xcodebuild archive \
  -scheme VKYC \
  -archivePath ./build/ios.xcarchive \
  -sdk iphoneos \
  BUILD_LIBRARY_FOR_DISTRIBUTION=YES \
  SKIP_INSTALL=NO

# Build for simulator
xcodebuild archive \
  -scheme VKYC \
  -archivePath ./build/ios-simulator.xcarchive \
  -sdk iphonesimulator \
  BUILD_LIBRARY_FOR_DISTRIBUTION=YES \
  SKIP_INSTALL=NO

# Create XCFramework
xcodebuild -create-xcframework \
  -framework ./build/ios.xcarchive/Products/Library/Frameworks/VKYC.framework \
  -framework ./build/ios-simulator.xcarchive/Products/Library/Frameworks/VKYC.framework \
  -output ./build/VKYC.xcframework
```

### Publishing to CocoaPods

```bash
pod lib lint VKYC.podspec
pod trunk push VKYC.podspec
```

---

## 🔄 Version Compatibility

| Component    | Version | Notes                  |
| ------------ | ------- | ---------------------- |
| Swift        | 5.5+    | Async/await supported  |
| iOS Min      | 13.0    | ~95% device coverage   |
| iOS Target   | 17.0    | Latest iOS             |
| React Native | 0.72+   | Hermes enabled         |
| Xcode        | 14.0+   | Required for Swift 5.5 |

---

## 📝 Future Enhancements

1. **Async/Await Support**

   ```swift
   func startVKYC(config: VKYCConfig) async throws -> [String: Any]
   ```

2. **Combine Support**

   ```swift
   func startVKYC(config: VKYCConfig) -> AnyPublisher<[String: Any], VKYCError>
   ```

3. **SwiftUI Native Views**

   ```swift
   VKYCView(config: config) { result in
       // Handle result
   }
   ```

4. **Offline Mode**
   - Queue verification requests
   - Sync when online

5. **Analytics Integration**
   - Built-in analytics
   - Custom event tracking

---

## 🐛 Known Limitations

1. **Single Instance**
   - Only one VKYC flow at a time
   - Multiple calls may conflict

2. **Portrait Only**
   - Currently locked to portrait
   - Landscape support planned

3. **iOS 13+ Only**
   - ~95% device coverage
   - Older devices not supported

---

## 🔗 Comparison with Android

| Feature     | iOS                   | Android              |
| ----------- | --------------------- | -------------------- |
| Language    | Swift/Obj-C           | Kotlin/Java          |
| Entry Point | VKYCManager           | VKYC                 |
| View Host   | VKYCViewController    | VKYCActivity         |
| Bridge      | VKYCBridgeModule      | VKYCModule           |
| Packaging   | .xcframework          | .aar                 |
| Callbacks   | Delegate + Completion | Interface + Callback |

---

## 📚 References

- [React Native iOS Integration](https://reactnative.dev/docs/native-modules-ios)
- [UIViewController Lifecycle](https://developer.apple.com/documentation/uikit/uiviewcontroller)
- [XCFramework Guide](https://developer.apple.com/documentation/xcode/creating-a-multi-platform-binary-framework-bundle)
