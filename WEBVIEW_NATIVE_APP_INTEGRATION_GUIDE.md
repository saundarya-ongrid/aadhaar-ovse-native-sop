# Web App Integration in Native Mobile Apps (Android + iOS)

## Purpose

This guide explains how to embed our Video KYC customer journey web app inside your native Android or iOS mobile app using WebView technology, with full access to device capabilities like camera, microphone, and location.

## What This Enables

Your users will be able to:

- Access their camera within the app for photo/video capture
- Use their microphone for audio calls during video KYC verification
- Share their location (mandatory for the verification flow)
- Have a seamless experience between your native app and the web-based flow

---

## Important Note

This integration is not only "load URL in WebView". It is a permissions + WebView + external navigation + testing setup.

---

## 1) How It Works (The Basics)

**Traditional web browsers** (like Chrome, Safari) automatically ask users for camera/mic/location access when a website requests it.

**When a website is inside your app's WebView**, you need to:

1. Tell the operating system (Android/iOS) what permissions your app might need.
2. When your app launches, ask the user to grant those permissions.
3. Configure the WebView to pass those permissions through to the web content.
4. Handle any external links or deep-links that redirect to other apps.

The technical implementation is different for Android and iOS, so both are covered separately below.

### Integration Lifecycle

This is the full lifecycle that happens:

1. Native app opens a WebView screen with the Video KYC URL.
2. Web page asks for camera/mic/location.
3. OS asks user permission (first time).
4. User allows or denies.
5. Web journey continues, pauses, or fails based on that choice.
6. If journey redirects to another app/deep link, native app handles that navigation.
7. User returns to native app and resumes the flow.

Important to understand:

- Permission-denied outcomes are expected product states, not necessarily bugs.
- External app opens and return behavior must be tested and validated.
- Both success and denial paths need testing.

---

## 2) Android Implementation

### Why Android is Different

Android requires two separate approvals:

1. Manifest declaration (what your app might use)
2. Runtime user consent (what user actually allows now)

If either is missing, camera/mic/location can fail even when your web page is correct.

### Android Step 0: Decide Where This Flow Lives In Your App

Before coding, decide these product-level points:

1. Which screen opens the WebView (new screen, modal, or in-tab section)
2. What user message appears before permission prompts
3. What fallback UX appears if user denies permission
4. Which external links should open outside the app

Why this is required:

- Ensures consistent behavior across the app.

### Android Step 1: Declare Permissions in Manifest

In your AndroidManifest.xml file, add:

```xml
<!-- Device capability declaration (not a user prompt) -->
<uses-feature android:name="android.hardware.camera.any" android:required="false" />
<uses-feature android:name="android.hardware.microphone" android:required="false" />

<!-- Runtime permissions your app can request -->
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
```

What each line means:

- uses-feature: describes hardware expectation to Play Store/device filtering.
- required=false: app can still install on devices without that hardware.
- uses-permission: declares legal permission scope your app may ask from users.

### Android Step 2: Request Runtime Permissions

Ask permissions before starting the web journey or just-in-time when needed.

```kotlin
private val requiredPermissions = arrayOf(
    Manifest.permission.CAMERA,
    Manifest.permission.RECORD_AUDIO,
    Manifest.permission.ACCESS_FINE_LOCATION,
    Manifest.permission.ACCESS_COARSE_LOCATION
)

private fun requestMissingPermissions(activity: Activity) {
    val missingPermissions = requiredPermissions.filter {
        ContextCompat.checkSelfPermission(activity, it) != PackageManager.PERMISSION_GRANTED
    }

    if (missingPermissions.isNotEmpty()) {
        ActivityCompat.requestPermissions(
            activity,
            missingPermissions.toTypedArray(),
            1001
        )
    }
}

override fun onRequestPermissionsResult(
    requestCode: Int,
    permissions: Array<String>,
    grantResults: IntArray
) {
    super.onRequestPermissionsResult(requestCode, permissions, grantResults)
    if (requestCode == 1001) {
        permissions.indices.forEach { i ->
            val granted = grantResults.getOrNull(i) == PackageManager.PERMISSION_GRANTED
            Log.d("Permissions", "${permissions[i]} -> $granted")
        }
    }
}
```

Why this is required:

- Manifest alone is not enough on Android 6+.
- Without runtime grant, WebView media request will be denied.

### Android Step 3: Configure WebView Core Settings

```kotlin
webView.settings.apply {
    javaScriptEnabled = true
    domStorageEnabled = true
    mediaPlaybackRequiresUserGesture = false

    // Use ALWAYS_ALLOW only if your page intentionally uses mixed content.
    mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
}
```

What each setting means:

- javaScriptEnabled: required for modern web apps and permission APIs.
- domStorageEnabled: enables local/session storage used by most SPA flows.
- mediaPlaybackRequiresUserGesture=false: allows inline media behavior without extra taps.
- mixedContentMode: allows HTTPS page to load HTTP sub-resources. Prefer HTTPS-only if possible.

### Android Step 4: Bridge Web Permission Requests To Android Permissions

When the web page calls getUserMedia, Android triggers WebChromeClient.onPermissionRequest.
You must map website permission requests to Android granted permissions.

```kotlin
webView.webChromeClient = object : WebChromeClient() {
    override fun onPermissionRequest(request: PermissionRequest) {
        val grantedResources = mutableListOf<String>()
        val toRequestFromAndroid = mutableListOf<String>()

        request.resources.forEach { resource ->
            when (resource) {
                PermissionRequest.RESOURCE_VIDEO_CAPTURE -> {
                    if (ContextCompat.checkSelfPermission(
                            this@MainActivity,
                            Manifest.permission.CAMERA
                        ) == PackageManager.PERMISSION_GRANTED
                    ) {
                        grantedResources.add(PermissionRequest.RESOURCE_VIDEO_CAPTURE)
                    } else {
                        toRequestFromAndroid.add(Manifest.permission.CAMERA)
                    }
                }
                PermissionRequest.RESOURCE_AUDIO_CAPTURE -> {
                    if (ContextCompat.checkSelfPermission(
                            this@MainActivity,
                            Manifest.permission.RECORD_AUDIO
                        ) == PackageManager.PERMISSION_GRANTED
                    ) {
                        grantedResources.add(PermissionRequest.RESOURCE_AUDIO_CAPTURE)
                    } else {
                        toRequestFromAndroid.add(Manifest.permission.RECORD_AUDIO)
                    }
                }
            }
        }

        if (grantedResources.isNotEmpty()) {
            request.grant(grantedResources.toTypedArray())
        }

        if (toRequestFromAndroid.isNotEmpty()) {
            ActivityCompat.requestPermissions(
                this@MainActivity,
                toRequestFromAndroid.distinct().toTypedArray(),
                2002
            )
        }
    }
}
```

Why this is required:

- WebView does not automatically assume Android runtime grants.
- This bridge is the handshake between website API requests and Android OS permissions.

### Android Step 5: Handle External App Redirects (If Configured)

Depending on your journey configuration and client settings, the web flow may redirect to external apps.
If this is enabled, handle the deep-link redirect in shouldOverrideUrlLoading.

```kotlin
webView.webViewClient = object : WebViewClient() {
    override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
        val url = request.url.toString()

        return if (url.startsWith("http://") || url.startsWith("https://")) {
            false // Keep standard web links inside WebView
        } else {
            // Open external app (e.g., Aadhaar app via deep link)
            startActivity(Intent(Intent.ACTION_VIEW, request.url))
            true
        }
    }
}
```

What this does:

- Detects when the web journey triggers a redirect to an external app (via deep link or intent URI).
- Opens the external app on the user's device.
- Prevents WebView from failing on non-http schemes.

**Note:** This is only needed if your specific journey configuration requires external app redirects.

### Android Quick Validation Checklist (After Integration)

1. App asks camera/mic/location permissions on first relevant action.
2. Camera preview works inside WebView.
3. Mic recording works and no blocked prompt appears.
4. Deny path shows controlled fallback UX.
5. External deep link opens and user can return.
6. Reopening app retains prior permission states.

---

## 3) iOS Implementation

### Why iOS is Different

iOS still asks user permission at runtime, but there is no Android-like separate permission API flow for the host app in many WebView scenarios.
The critical requirement is to provide usage description keys in Info.plist. Without those keys, access fails.

### iOS Step 0: Product and UX Decisions

Decide before coding:

1. Which screen hosts WKWebView
2. What copy appears before first camera/mic/location request
3. Fallback behavior when user taps "Don't Allow"
4. Which outbound links open in Safari/other apps

### iOS Step 1: Add Info.plist Usage Descriptions

In Info.plist add:

```xml
<key>NSCameraUsageDescription</key>
<string>We need camera access to complete identity verification.</string>

<key>NSMicrophoneUsageDescription</key>
<string>We need microphone access to record verification audio.</string>

<key>NSLocationWhenInUseUsageDescription</key>
<string>We need your location while using the app for verification compliance.</string>
```

Why this is required:

- iOS uses these strings in system prompts.
- Missing keys can cause silent denial/crash depending on API call path.

### iOS Step 2: Configure WKWebView Properly

```swift
import WebKit

let config = WKWebViewConfiguration()
config.allowsInlineMediaPlayback = true
config.mediaTypesRequiringUserActionForPlayback = []

let webView = WKWebView(frame: .zero, configuration: config)
webView.navigationDelegate = self
webView.uiDelegate = self
```

What each configuration means:

- WKWebViewConfiguration: global behavior for this webview instance.
- allowsInlineMediaPlayback=true: media plays inside page layout, not forced fullscreen.
- mediaTypesRequiringUserActionForPlayback=[]: removes mandatory user tap for media start.
- navigationDelegate: controls URL decisions and navigation outcomes.
- uiDelegate: handles JS dialogs and media permission callback APIs where applicable.

### iOS Step 3: Load The Journey URL

```swift
let url = URL(string: "https://your-web-journey-url")!
webView.load(URLRequest(url: url))
```

**⚠️ iOS Limitation:** External app redirects work on iOS. However, redirecting to Aadhaar app and completing Aadhaar validation as part of OVSE flow is not supported as of now.

### iOS Step 4: Optional Explicit Media Permission Handling (iOS 15+)

```swift
func webView(
    _ webView: WKWebView,
    requestMediaCapturePermissionFor origin: WKSecurityOrigin,
    initiatedByFrame frame: WKFrameInfo,
    type: WKMediaCaptureType,
    decisionHandler: @escaping (WKPermissionDecision) -> Void
) {
    // Add allowlist checks here if needed (for specific trusted domains only).
    decisionHandler(.grant)
}
```

When this is useful:

- Enterprise apps with strict domain allowlist.
- Advanced logging/auditing around permission grants.
- Custom business policy by environment.

### iOS Quick Validation Checklist (After Integration)

1. First camera/mic use shows iOS permission dialog with your copy.
2. Allow path opens camera/mic inside the web journey.
3. Deny path shows expected blocked state and retry instructions.
4. External deep links open outside app and return works.
5. App resume maintains web journey state correctly.

---

## 4) Code Glossary (What Each Item Means)

Use this section when reading code during reviews.

| Code / Configuration                                                            | Platform    | Plain Meaning                                         | Why It Exists                                       |
| ------------------------------------------------------------------------------- | ----------- | ----------------------------------------------------- | --------------------------------------------------- |
| `WebView`                                                                       | Android     | Embedded browser view inside app screen               | Hosts the web journey without opening Chrome        |
| `WKWebView`                                                                     | iOS         | Embedded browser view inside app screen               | Hosts the web journey without opening Safari        |
| `WebChromeClient.onPermissionRequest`                                           | Android     | Callback when website asks camera/mic access          | Bridges website request to Android permission state |
| `navigationDelegate`                                                            | iOS         | Controls URL navigation policy                        | Decides in-app vs external app opening              |
| `uiDelegate`                                                                    | iOS         | Handles WebView UI callbacks                          | Manages dialogs/media permission callbacks          |
| `javaScriptEnabled`                                                             | Android     | Allows JavaScript execution                           | Required for modern web app logic                   |
| `domStorageEnabled`                                                             | Android     | Enables local/session storage                         | Required for web state/session handling             |
| `allowsInlineMediaPlayback`                                                     | iOS         | Play media inside webpage area                        | Prevents forced fullscreen playback                 |
| `mediaPlaybackRequiresUserGesture` / `mediaTypesRequiringUserActionForPlayback` | Android/iOS | Controls whether user tap is required before playback | Helps smooth camera/video UX                        |
| `shouldOverrideUrlLoading` / `decidePolicyFor`                                  | Android/iOS | Intercepts outgoing links                             | Supports deep links, UPI, SMS, map redirects        |

If PM/QA asks "why this line is here", map the line to one of three goals:

1. User privacy compliance (permissions)
2. Journey continuity (WebView behavior and storage)
3. Redirect safety (external app/deep-link handling)

---

## 5) Common Mistakes to Avoid

### ❌ Mistake 1: Forgetting Info.plist Keys (iOS)

**Problem:** iOS denies camera/mic, user sees "blocked" in website.  
**Why:** Missing `NSCameraUsageDescription` / `NSMicrophoneUsageDescription` keys.  
**Fix:** Add the descriptions in Info.plist before the website requests access.

### ❌ Mistake 2: Not Requesting Permissions (Android)

**Problem:** Website can't access camera, even though permissions are declared.  
**Why:** App declared permissions but never asked the user to grant them.  
**Fix:** Request runtime permissions when app starts.

### ❌ Mistake 3: Disabling JavaScript

**Problem:** Website looks broken, buttons don't work, camera prompt never appears.  
**Why:** JavaScript is needed for the website to request camera/mic and function properly.  
**Fix:** Ensure `javaScriptEnabled = true` (or equivalent) in WebView config.

### ❌ Mistake 4: Injecting JavaScript that Blocks Permissions

**Problem:** Website asks for camera but is told it's blocked.  
**Why:** App injects custom JavaScript that overrides permission queries.  
**Fix:** Don't override permission queries unless intentionally blocking for a workaround. Let real permissions pass through.

---

## 6) Test Before Shipping

Before releasing your app, test these scenarios on real devices:

### Android Testing

| Test Scenario                                             | Expected Result                                 |
| --------------------------------------------------------- | ----------------------------------------------- |
| Open app for the first time                               | System shows "Allow camera/mic?" dialog         |
| User taps "Allow"                                         | Website can now use camera                      |
| User denies permission                                    | Website shows "Camera blocked" or similar error |
| Website tries external redirect (SMS/deep-link)           | Another app opens                               |
| Close and reopen app                                      | Previously granted permissions are remembered   |
| Long-click app → `App info` → `Permissions` → Deny camera | Website again shows camera blocked              |

### iOS Testing

| Test Scenario                                            | Expected Result                                      |
| -------------------------------------------------------- | ---------------------------------------------------- |
| Open app for the first time, tap website's camera button | System shows permission prompt with your description |
| User taps "Allow"                                        | Website can use camera                               |
| User taps "Don't Allow"                                  | Website shows access blocked                         |
| Settings → Your App → Camera → Toggle On/Off             | Changes take effect when visiting website again      |
| Website tries to open Maps or other app                  | Maps (or app) opens; can return to your app          |

### Tablet / Device Variant Testing

Test on:

- **Phone with camera** (most common)
- **Tablet without camera** (if your app supports tablets)
- **Phone with no microphone** (rare, but can happen with broken hardware)

---

## 7) What Devices & OS Versions Support This

### Android Compatibility

| Android Version         | API Level | Status          | Notes                                                                                    |
| ----------------------- | --------- | --------------- | ---------------------------------------------------------------------------------------- |
| Android 5.1 (Lollipop)  | 22        | ⚠️ Limited      | Works, but runtime permissions not available; permissions are granted at install time.   |
| Android 6 (Marshmallow) | 23        | ✅ Full Support | Runtime permissions introduced; all features work reliably.                              |
| Android 7–10            | 24–29     | ✅ Full Support | Stable, recommended for testing.                                                         |
| Android 11–15           | 30–35     | ✅ Full Support | Latest versions; all features work. Google Play requires targeting API 35+ (as of 2026). |

**Camera/Mic Hardware:**

- Works on phones with built-in camera/microphone (vast majority).
- Tablets without camera: Website will show "camera not available" (graceful fallback).

**Known Challenges:**

- **Emulator on Mac**: Audio path may have issues; use physical device for mic testing if emulator shows `NotReadableError`.
- **Android 6 (API 23)**: Older devices may have WebChromeClient bugs; update Chromium WebView if possible.

**Recommended Target:**

- Minimum: API 24 (Android 7)
- Target: API 34–35 (Android 14–15)

---

### iOS Compatibility

| iOS Version | Status          | Notes                                                  |
| ----------- | --------------- | ------------------------------------------------------ |
| iOS 11–12   | ⚠️ Limited      | WKWebView available, but permission handling is basic. |
| iOS 13–14   | ✅ Full Support | All features stable; recommended for 2025 releases.    |
| iOS 15–18   | ✅ Full Support | Latest versions; all features work, most reliable.     |

**Camera/Mic Hardware:**

- All iPhones have front & rear cameras + microphone.
- iPads: Most modern iPads have cameras; older iPad models may not.

**Known Challenges:**

- **Bluetooth audio quality**: When microphone is active, Bluetooth switches to "call mode" (lower quality audio). Use speaker or wired headphones during testing.
- **iOS 13**: Permission dialogs sometimes don't appear; reheating by restarting device usually fixes.

**Recommended Target:**

- Minimum: iOS 14
- Target: iOS 17–18 (latest)

---

### Web Browser Version (Inside WebView)

Your WebView uses the device's default browser engine:

**Android:**

- Uses Google's **Chromium** (auto-updated via Google Play Services).
- All camera/mic APIs supported in modern versions.

**iOS:**

- Uses Apple's **WebKit** (Safari engine).
- All camera/mic APIs supported in iOS 14+.

If your website uses modern JavaScript (ES6+) or newer HTML5 features, ensure users have reasonably current OS versions.

---

### Cross-Device Testing Summary

| Device Type            | Test It?        | Notes                                                                                                 |
| ---------------------- | --------------- | ----------------------------------------------------------------------------------------------------- |
| iPhone 13–15 (iOS 17+) | ✅ Yes          | Primary use case; all features work.                                                                  |
| Android Pixel (API 34) | ✅ Yes          | Primary use case; all features work.                                                                  |
| Older iPhone (iOS 12)  | ⚠️ Optional     | May work, but not guaranteed; user base shrinking (consider supporting iOS 14+).                      |
| Older Android (API 23) | ⚠️ Optional     | May work, but bugs are possible; user base shrinking.                                                 |
| Tablet (iPad)          | ✅ If Supported | Test on at least one iPad if your app supports tablets.                                               |
| Low-end Android        | ⚠️ Optional     | Older budget phones may have slow WebView performance; plan memory tests if targeting low-end market. |

---

## 8) Workarounds for Known Issues

### Issue: Android Microphone Returns `NotReadableError`

**Symptom:** User grants permission, but website shows "Microphone failed" or "Audio not available."

**Root Cause:** Android's audio routing or Chromium WebView on that specific device has an issue.

**Workaround 1 (Quick):**

- Test on a physical device (emulator audio is unreliable).
- Restart the device.

**Workaround 2 (Medium):**

- Request camera-only permission first (no audio).
- If camera works, then request mic separately.
- This can bypass audio initialization bugs on some devices.

**Workaround 3 (Code-Level, last resort):**

- Suppress audio from media stream if camera is the primary need:
   ```javascript
   // In your website's JavaScript
   navigator.mediaDevices.getUserMedia({ video: true, audio: false }).then((stream) => {
      // Use camera only
   });
   ```

### Issue: iOS Bluetooth Audio Drops Quality During Video Call

**Symptom:** User hears flat, low-quality audio when recording with mic during video.

**Root Cause:** iPhone switches Bluetooth to "call mode" (lower bandwidth) when active microphone.

**Workaround:**

- Inform users: "Use speaker or wired headphones for best audio quality."
- If voice quality is critical, disable Bluetooth mic during setup.

### Issue: Website Says "Permissions Blocked" Even After User Allowed

**Android:**

- Check: Settings → Apps → Your App → Permissions → Verify camera/mic are toggled **On**.
- Confirm WebView's `onPermissionRequest` is granting permissions (not denying).

**iOS:**

- Check: Settings → Privacy → Camera: Your App should be in the "Allowed" list.
- Toggle Off, then On again if stuck.

### Issue: Website Works on iOS but Not Android (Same Code)

**Likely Causes:**

1. Manifest permissions missing → Add all required `<uses-permission>` tags.
2. Runtime permissions not requested → Add permission request code on app startup.
3. WebView settings differ → Ensure `javaScriptEnabled`, `domStorageEnabled` are true on both platforms.

---

## 9) Troubleshooting Decision Tree

**Website can't access camera:**

1. Did user deny permission? → Check Settings and re-grant.
2. Is permission in Manifest (Android) or Info.plist (iOS)? → Add if missing.
3. Is WebView JS enabled? → Enable it.
4. Still broken? → Test on different device/OS version.

**Website works on iOS but not Android:**

1. Does Android Manifest have all permissions? → Add missing ones.
2. Does MainActivity request runtime permissions? → Implement if missing.
3. Different code on each platform? → Align config and test again.

**Bluetooth audio sounds bad:**

- Inform user to use speaker or wired headphones.
- This is expected when Bluetooth switches to call mode.

---

## 10) Quick Reference: What to Do

### For Android Developers:

1. Add permissions to `AndroidManifest.xml`
2. Add runtime permission request code in MainActivity
3. Implement `WebChromeClient.onPermissionRequest`
4. Configure WebView settings (JS, DOM storage, etc.)
5. Override `shouldOverrideUrlLoading` to handle external links
6. Test on emulator and physical device

### For iOS Developers:

1. Add `NS*UsageDescription` keys to `Info.plist`
2. Configure WKWebView with appropriate settings
3. Optionally implement `WKUIDelegate` for advanced permission handling
4. Override `decidePolicyFor navigationAction` to handle external links
5. Test on simulator and physical device
