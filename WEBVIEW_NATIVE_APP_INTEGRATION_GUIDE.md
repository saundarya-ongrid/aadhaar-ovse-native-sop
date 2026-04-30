# Web App Integration in Native Mobile Apps (Android + iOS)

## Purpose

This guide explains how to embed our Video KYC customer journey web app inside your native Android or iOS mobile app using WebView technology, with full access to device capabilities like camera, microphone, and location.

**For Technical Teams**: Step-by-step implementation guide with code requirements.  
**For Project Managers / Product Teams**: Overview of changes needed and device compatibility.

## What This Enables

Your users will be able to:

- Access their camera within the app for photo/video capture
- Use their microphone for audio recording or voice
- Share their location (mandatory for the verification flow)
- Have a seamless experience between your native app and the web-based flow

---

## 1) How It Works (The Basics)

**Traditional web browsers** (like Chrome, Safari) automatically ask users for camera/mic/location access when a website requests it.

**When a website is inside your app's WebView**, you need to:

1. Tell the operating system (Android/iOS) what permissions your app might need.
2. When your app launches, ask the user to grant those permissions.
3. Configure the WebView to pass those permissions through to the web content.
4. Handle any external links or deep-links that redirect to other apps.

The technical implementation is different for Android and iOS, so both are covered separately below.

---

## 2) Android Implementation

### Why Android is Different

Android requires explicit permission declarations at two levels:

1. **Declaration Level**: Tell Google Play Store and the user what your app might do.
2. **Runtime Level**: Ask the user to approve each permission when the app first uses it.

This two-step process protects user privacy.

### 2.1 Step 1: Declare Permissions in Manifest

In your `AndroidManifest.xml` file, add:

```xml
<!-- Declare that your app might use these features -->
<uses-feature android:name="android.hardware.camera.any" android:required="false" />
<uses-feature android:name="android.hardware.microphone" android:required="false" />

<!-- Request permissions from the user -->
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
```

**What This Means:**

- `uses-feature ... required="false"`: Your app works even if the device doesn't have a camera or microphone (good for tablets or devices without these).
- `uses-permission`: These are the actual permissions your app needs.

### 2.2 Step 2: Request Permissions at Runtime

When your app starts, before the user accesses the website, ask for permissions programmatically.

**Sample approach** (using Android's standard permission API):

```kotlin
// List of permissions needed
val requiredPermissions = arrayOf(
    Manifest.permission.CAMERA,
    Manifest.permission.RECORD_AUDIO,
    Manifest.permission.ACCESS_FINE_LOCATION,
    Manifest.permission.ACCESS_COARSE_LOCATION
)

// Check if any permission is missing
val missingPermissions = requiredPermissions.filter {
    ContextCompat.checkSelfPermission(context, it) != PackageManager.PERMISSION_GRANTED
}

// If any are missing, request them
if (missingPermissions.isNotEmpty()) {
    ActivityCompat.requestPermissions(activity, missingPermissions.toTypedArray(), requestCode = 1001)
}

// Handle user's response
override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<String>, grantResults: IntArray) {
    if (requestCode == 1001) {
        for (i in permissions.indices) {
            val granted = grantResults[i] == PackageManager.PERMISSION_GRANTED
            Log.d("Permissions", "${permissions[i]} -> $granted")
        }
    }
}
```

**What Happens:**

- User sees a system dialog asking "Allow [Your App] to access Camera?" etc.
- User taps "Allow" or "Deny".
- Your app records the choice.
- If denied, the website will show "Camera blocked" when it tries to access it.

### 2.3 Step 3: Configure WebView for Media

In your WebView configuration, enable these settings:

```kotlin
webView.settings.apply {
    javaScriptEnabled = true          // Allow JavaScript
    domStorageEnabled = true          // Allow web page to store data
    mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
}

webView.apply {
    allowsInlineMediaPlayback = true  // Play video/audio without full screen
    mediaPlaybackRequiresUserAction = false  // Auto-play if allowed
}
```

### 2.4 Step 4: Permission Mapping in WebView

When the website requests camera/mic access, Android calls your app's `WebChromeClient.onPermissionRequest` method. Map web permissions to Android permissions:

```kotlin
override fun onPermissionRequest(request: PermissionRequest) {
    val webPermissions = request.resources
    val androidPermissions = mutableListOf<String>()
    val grantedPermissions = mutableListOf<String>()

    for (permission in webPermissions) {
        when (permission) {
            PermissionRequest.RESOURCE_VIDEO_CAPTURE -> {
                // Website wants camera
                if (ContextCompat.checkSelfPermission(context, Manifest.permission.CAMERA)
                    == PackageManager.PERMISSION_GRANTED) {
                    grantedPermissions.add(PermissionRequest.RESOURCE_VIDEO_CAPTURE)
                } else {
                    androidPermissions.add(Manifest.permission.CAMERA)
                }
            }
            PermissionRequest.RESOURCE_AUDIO_CAPTURE -> {
                // Website wants microphone
                if (ContextCompat.checkSelfPermission(context, Manifest.permission.RECORD_AUDIO)
                    == PackageManager.PERMISSION_GRANTED) {
                    grantedPermissions.add(PermissionRequest.RESOURCE_AUDIO_CAPTURE)
                } else {
                    androidPermissions.add(Manifest.permission.RECORD_AUDIO)
                }
            }
        }
    }

    // Grant what's already allowed
    if (grantedPermissions.isNotEmpty()) {
        request.grant(grantedPermissions.toTypedArray())
    }

    // Request any missing permissions
    if (androidPermissions.isNotEmpty()) {
        ActivityCompat.requestPermissions(activity, androidPermissions.toTypedArray(), requestCode = 2002)
    }
}
```

**What This Does:**

- Checks if Android permissions are already granted.
- If yes, immediately grants the website access.
- If no, requests them from the user.
- Once granted, the website can access the camera/mic.

---

## 3) iOS Implementation

### Why iOS is Different

iOS is simpler than Android — there's no runtime permission dialogs in the same way. Instead, you add descriptions in your app's `Info.plist` file that explain _why_ your app needs each permission. iOS shows these descriptions when the user first tries to use camera/mic.

### 3.1 Step 1: Add Usage Descriptions

In your app's `Info.plist` file, add these keys:

```xml
<key>NSCameraUsageDescription</key>
<string>We need access to your camera to verify your identity.</string>

<key>NSMicrophoneUsageDescription</key>
<string>We need access to your microphone for audio verification.</string>

<key>NSLocationWhenInUseUsageDescription</key>
<string>We need your location for identity verification purposes.</string>
```

**What These Mean:**

- These are the messages iOS shows the user when camera/mic/location is first requested.
- **Without these keys, iOS automatically denies access** — even if the website asks.
- Write clear, user-friendly explanations (avoid jargon).

### 3.2 Step 2: Configure WebView

In your iOS WebView (WKWebView), enable:

```swift
let config = WKWebViewConfiguration()
config.allowsInlineMediaPlayback = true  // Play video inline (not full-screen)
config.mediaPlaybackRequiresUserGesture = false  // Auto-play if allowed

let webView = WKWebView(frame: .zero, configuration: config)
```

**What This Does:**

- `allowsInlineMediaPlayback`: Video/audio plays within the page, not in full-screen mode.
- `mediaPlaybackRequiresUserGesture`: Auto-play video/audio if permissions are granted (optional).

### 3.3 Step 3: Handle Permission Requests (Optional)

In modern iOS (14+), when the website requests camera/mic, iOS automatically shows the permission prompt using the descriptions from Step 1. No extra code is typically needed.

However, if you want to handle edge cases:

```swift
// Implement WKUIDelegate to handle permission requests
webView.uiDelegate = self

// Handle WebView UI callbacks (permissions, alerts, etc.)
func webView(_ webView: WKWebView, requestMediaCapturePermissionFor origin: WKSecurityOrigin,
             initiatedByFrame frame: WKFrameInfo, type: WKMediaCaptureType,
             decisionHandler: @escaping (WKPermissionDecision) -> Void) {
    decisionHandler(.grant)  // Grant camera/mic access
}
```

---

## 4) Common Mistakes to Avoid

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

## 5) Test Before Shipping

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

## 6) What Devices & OS Versions Support This

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

## 7) Workarounds for Known Issues

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

## 8) Troubleshooting Decision Tree

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

## 9) Quick Reference: What to Do

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
