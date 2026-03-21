# VKYC Android SDK - Architecture Overview

## 🏗️ Architecture

The VKYC Android SDK follows a **Native Wrapper + React Native Core** architecture.

```
┌─────────────────────────────────────────────────────────┐
│                   Client Android App                     │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │           VKYC.start(config, callback)         │    │
│  └─────────────────────┬──────────────────────────┘    │
└────────────────────────┼───────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│              VKYC Android SDK (.aar)                     │
│                                                          │
│  ┌──────────────┐  ┌─────────────────────────────┐    │
│  │   VKYC.kt    │  │      VKYCActivity.kt        │    │
│  │  (Entry API) │─▶│  (React Native Host)        │    │
│  └──────────────┘  └────────┬────────────────────┘    │
│                              │                          │
│  ┌──────────────────────────┼───────────────────────┐ │
│  │       React Native Bridge │                       │ │
│  │                           │                       │ │
│  │    ┌──────────────────────▼────────────────────┐ │ │
│  │    │      VKYCModule.kt                        │ │ │
│  │    │  (Native → RN / RN → Native)              │ │ │
│  │    └───────────────────────────────────────────┘ │ │
│  └──────────────────────┬───────────────────────────┘ │
└─────────────────────────┼───────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│            React Native Core (vkyc-core)                 │
│                                                          │
│  ┌────────────┐  ┌────────────┐  ┌─────────────┐      │
│  │  VKYCApp   │  │   Config   │  │  API Layer  │      │
│  │ (Entry)    │─▶│  Manager   │─▶│  (Network)  │      │
│  └────────────┘  └────────────┘  └─────────────┘      │
│        │                                                │
│        ▼                                                │
│  ┌──────────────────────────────────────────────┐     │
│  │         Navigation & UI Screens              │     │
│  │  (Document Capture, Face Capture, etc.)      │     │
│  └──────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────┘
```

---

## 📦 Components

### 1. **VKYC.kt** (Entry Point)

- Main SDK API
- Validates configuration
- Launches VKYCActivity
- Manages callbacks
- Thread-safe singleton

**Key Methods:**

- `start(context, config, callback)` - Start VKYC flow
- `initialize(context)` - Optional initialization
- `getVersion()` - Get SDK version
- Internal callback triggers

### 2. **VKYCConfig.kt** (Configuration)

- Data class for SDK configuration
- Validation logic
- Bundle conversion for RN
- Supports theme, features, metadata

**Structure:**

```kotlin
VKYCConfig(
    token: String,
    apiKey: String,
    environment: Environment
) {
    theme: Theme?
    features: Features?
    metadata: Map<String, Any>?
}
```

### 3. **VKYCCallback.kt** (Callbacks)

- Interface for lifecycle events
- Error definitions
- Adapter pattern for optional override

**Callbacks:**

- `onStart()` - Flow started
- `onSuccess(result)` - Verification successful
- `onFailure(error)` - Verification failed
- `onCancel()` - User cancelled
- `onEvent(name, metadata)` - Tracking events

### 4. **VKYCActivity.kt** (React Native Host)

- Hosts React Native view
- Creates ReactInstanceManager
- Passes config via initialProperties
- Manages RN lifecycle
- Handles back button

**Flow:**

1. Receives config Bundle from Intent
2. Initializes React Native
3. Mounts VKYCApp component with config
4. Handles lifecycle events
5. Cleans up on destroy

### 5. **VKYCModule.kt** (Bridge Module)

- React Native Native Module
- Enables RN → Native communication
- Triggers callbacks
- Closes activity

**Methods (Called from RN):**

- `onSuccess(result)` - Notify success
- `onFailure(code, message, details)` - Notify failure
- `onCancel()` - Notify cancel
- `onEvent(name, metadata)` - Send event
- `close()` - Close activity

### 6. **VKYCReactPackage.kt**

- Registers VKYCModule with React Native
- Part of React Native initialization

---

## 🔄 Data Flow

### 1. **Native → React Native** (Configuration)

```
Client App
    ↓
VKYC.start(config)
    ↓
config.toBundle()
    ↓
Intent extras → VKYCActivity
    ↓
initialProperties → React Native
    ↓
VKYCApp component receives props
```

### 2. **React Native → Native** (Callbacks)

```
React Native UI/Logic
    ↓
NativeModules.VKYCModule.onSuccess(result)
    ↓
VKYCModule.onSuccess()
    ↓
VKYC.triggerSuccess(result)
    ↓
VKYCCallback.onSuccess(result)
    ↓
Client App handles success
```

---

## 🎯 Key Design Decisions

### 1. **Singleton Pattern for VKYC**

- Ensures only one VKYC flow active
- Centralizes callback management
- WeakReference prevents memory leaks

### 2. **Bundle for Configuration**

- React Native requires Bundle/Map for initialProperties
- Type-safe conversion in `toBundle()`
- Handles nested objects (theme, features)

### 3. **Separate Activity for RN**

- Isolates React Native lifecycle
- Clean separation of concerns
- Easy to dismiss/close
- No interference with host app

### 4. **Interface-based Callbacks**

- Flexible callback implementation
- Adapter pattern for convenience
- Type-safe error codes

### 5. **Validation Layer**

- Fail-fast approach
- Clear error messages
- Prevents runtime issues

---

## 🔐 Security Considerations

1. **Token Management**
   - Tokens passed securely via Intent
   - Not persisted by SDK
   - Client responsible for token security

2. **Permissions**
   - Runtime permission checks
   - Clear permission rationale
   - Graceful permission denial handling

3. **ProGuard**
   - Public API kept
   - Internal classes obfuscated
   - React Native classes preserved

---

## 📊 Performance

1. **Lazy Initialization**
   - React Native loaded on-demand
   - SoLoader initialized once
   - Minimal impact on host app

2. **Memory Management**
   - WeakReference for callbacks
   - Activity lifecycle respected
   - React Native properly destroyed

3. **Bundle Size**
   - SDK: ~500KB (without RN bundle)
   - RN Bundle: ~2-3MB (included in AAR)
   - Total: ~2.5-3.5MB

---

## 🧪 Testing Strategy

1. **Unit Tests**
   - Config validation
   - Error code mapping
   - Bundle conversion

2. **Integration Tests**
   - Activity lifecycle
   - Callback triggering
   - Bridge communication

3. **UI Tests**
   - React Native rendering
   - User flows
   - Error scenarios

---

## 🚀 Deployment

### Building AAR

```bash
./gradlew vkyc-android-sdk:assembleRelease
```

Output: `vkyc-android-sdk/build/outputs/aar/vkyc-android-sdk-release.aar`

### Publishing

```bash
./gradlew vkyc-android-sdk:publish
```

Publishes to configured Maven repository.

---

## 🔄 Version Compatibility

| Component          | Version       | Notes                |
| ------------------ | ------------- | -------------------- |
| Kotlin             | 1.9+          | Coroutines supported |
| Android Min SDK    | 21            | Android 5.0+         |
| Android Target SDK | 34            | Android 14           |
| React Native       | 0.72+         | Hermes enabled       |
| AndroidX           | Latest stable | Required             |

---

## 📝 Future Enhancements

1. **Kotlin Coroutines Support**

   ```kotlin
   suspend fun startVKYC(config): Result<Map<String, Any>>
   ```

2. **RxJava Support**

   ```kotlin
   fun startVKYC(config): Observable<VKYCResult>
   ```

3. **Compose Support**

   ```kotlin
   @Composable
   fun VKYCScreen(config, onResult)
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
   - Multiple calls queue (or fail)

2. **Portrait Only**
   - Currently locked to portrait
   - Landscape support planned

3. **Min SDK 21**
   - ~99% device coverage
   - Pre-L devices not supported

---

## 📚 References

- [React Native Integration](https://reactnative.dev/docs/native-modules-android)
- [Android Activity Lifecycle](https://developer.android.com/guide/components/activities/activity-lifecycle)
- [ProGuard Rules](https://developer.android.com/studio/build/shrink-code)
