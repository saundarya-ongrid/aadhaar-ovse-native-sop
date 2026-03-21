# VKYC Android SDK - Integration Guide

Complete guide for integrating VKYC SDK into your Android application.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Permissions](#permissions)
4. [Basic Integration](#basic-integration)
5. [Configuration](#configuration)
6. [Callbacks](#callbacks)
7. [Error Handling](#error-handling)
8. [Advanced Usage](#advanced-usage)
9. [Testing](#testing)
10.   [Troubleshooting](#troubleshooting)

---

## Prerequisites

- Android Studio Arctic Fox or later
- Min SDK: 21 (Android 5.0)
- Target SDK: 34 (Android 14)
- Kotlin 1.9+ or Java 8+
- AndroidX

---

## Installation

### Step 1: Add Repository

Add to your project's `settings.gradle`:

```gradle
dependencyResolutionManagement {
    repositories {
        google()
        mavenCentral()
        maven {
            url = uri("https://maven.pkg.github.com/your-org/vkyc-sdk")
            credentials {
                username = project.findProperty("gpr.user") ?: System.getenv("GITHUB_USERNAME")
                password = project.findProperty("gpr.token") ?: System.getenv("GITHUB_TOKEN")
            }
        }
    }
}
```

### Step 2: Add Dependency

Add to your app's `build.gradle`:

```gradle
dependencies {
    implementation 'com.vkyc:vkyc-android-sdk:1.0.0'
}
```

### Step 3: Sync Project

Click "Sync Now" in Android Studio.

---

## Permissions

The SDK requires the following permissions (already included in SDK manifest):

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />
```

### Request Runtime Permissions

Since Android 6.0, you must request camera and microphone permissions at runtime:

```kotlin
import android.Manifest
import android.content.pm.PackageManager
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat

class MainActivity : AppCompatActivity() {

    companion object {
        private const val PERMISSION_REQUEST_CODE = 100
    }

    private fun checkAndRequestPermissions() {
        val permissions = arrayOf(
            Manifest.permission.CAMERA,
            Manifest.permission.RECORD_AUDIO
        )

        val permissionsToRequest = permissions.filter {
            ContextCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED
        }

        if (permissionsToRequest.isNotEmpty()) {
            ActivityCompat.requestPermissions(
                this,
                permissionsToRequest.toTypedArray(),
                PERMISSION_REQUEST_CODE
            )
        } else {
            // Permissions already granted, start VKYC
            startVKYC()
        }
    }

    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<out String>,
        grantResults: IntArray
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)

        if (requestCode == PERMISSION_REQUEST_CODE) {
            if (grantResults.all { it == PackageManager.PERMISSION_GRANTED }) {
                startVKYC()
            } else {
                Toast.makeText(this, "Permissions required for VKYC", Toast.LENGTH_LONG).show()
            }
        }
    }
}
```

---

## Basic Integration

### Minimal Example

```kotlin
import com.vkyc.sdk.VKYC
import com.vkyc.sdk.VKYCConfig
import com.vkyc.sdk.VKYCCallback
import com.vkyc.sdk.VKYCError

// Create config
val config = VKYCConfig(
    token = "your-auth-token",
    apiKey = "your-api-key",
    environment = VKYCConfig.Environment.STAGING
)

// Start VKYC
VKYC.start(this, config, object : VKYCCallback {
    override fun onStart() {
        // VKYC started
    }

    override fun onSuccess(result: Map<String, Any>) {
        // Handle success
        val sessionId = result["sessionId"] as? String
        Log.d("VKYC", "Success! Session: $sessionId")
    }

    override fun onFailure(error: VKYCError) {
        // Handle error
        Log.e("VKYC", "Error: ${error.message}")
    }

    override fun onCancel() {
        // User cancelled
    }

    override fun onEvent(eventName: String, metadata: Map<String, Any>?) {
        // Track events
    }
})
```

---

## Configuration

### Full Configuration Options

```kotlin
val config = VKYCConfig(
    token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    apiKey = "your-api-key-here",
    environment = VKYCConfig.Environment.PRODUCTION
).apply {

    // UI Theme Customization
    theme = VKYCConfig.Theme(
        primaryColor = "#667eea",        // Required
        secondaryColor = "#764ba2",      // Optional
        textColor = "#333333",           // Optional
        backgroundColor = "#FFFFFF",     // Optional
        fontFamily = "Roboto",           // Optional
        buttonRadius = 12                // Optional (in dp)
    )

    // Feature Flags
    features = VKYCConfig.Features(
        videoEnabled = true,             // Required
        autoCapture = true,              // Optional
        livenessCheck = true,            // Optional
        documentVerification = true,     // Optional
        faceMatch = true,                // Optional
        audioEnabled = true,             // Optional
        screenRecording = false          // Optional
    )

    // Custom Metadata
    metadata = mapOf(
        "userId" to "12345",
        "source" to "mobile_app",
        "sessionType" to "kyc_verification",
        "customField" to "value"
    )
}
```

### Environment Options

```kotlin
VKYCConfig.Environment.STAGING      // For testing
VKYCConfig.Environment.PRODUCTION   // For production
```

### Validation

```kotlin
when (val result = config.validate()) {
    is VKYCConfig.ValidationResult.Success -> {
        // Config is valid
        VKYC.start(context, config, callback)
    }
    is VKYCConfig.ValidationResult.Error -> {
        // Config is invalid
        result.errors.forEach { error ->
            Log.e("VKYC", "Config error: $error")
        }
    }
}
```

---

## Callbacks

### VKYCCallback Interface

All callback methods:

```kotlin
interface VKYCCallback {
    fun onStart()
    fun onSuccess(result: Map<String, Any>)
    fun onFailure(error: VKYCError)
    fun onCancel()
    fun onEvent(eventName: String, metadata: Map<String, Any>?)
}
```

### Using VKYCCallbackAdapter

Override only the methods you need:

```kotlin
VKYC.start(this, config, object : VKYCCallbackAdapter() {
    override fun onSuccess(result: Map<String, Any>) {
        // Only handle success
    }

    override fun onFailure(error: VKYCError) {
        // Only handle failure
    }
})
```

### Success Result Structure

```kotlin
{
    "sessionId": "abc123xyz",
    "status": "verified",
    "timestamp": 1234567890,
    "verificationData": {
        "documentVerified": true,
        "faceMatched": true,
        "livenessCheckPassed": true
    },
    "metadata": { ... }
}
```

### Event Tracking

Common events:

- `screen_viewed` - A screen was displayed
- `button_clicked` - User clicked a button
- `document_captured` - Document was captured
- `face_captured` - Face was captured
- `verification_started` - Verification process started
- `verification_completed` - Verification completed

```kotlin
override fun onEvent(eventName: String, metadata: Map<String, Any>?) {
    when (eventName) {
        "screen_viewed" -> {
            val screenName = metadata?.get("screenName")
            logAnalytics("screen_view", screenName)
        }
        "button_clicked" -> {
            val buttonId = metadata?.get("buttonId")
            logAnalytics("button_click", buttonId)
        }
        else -> {
            logAnalytics(eventName, metadata)
        }
    }
}
```

---

## Error Handling

### Error Codes

```kotlin
enum class ErrorCode {
    // Configuration
    INVALID_CONFIG
    MISSING_TOKEN
    MISSING_API_KEY

    // Network
    NETWORK_ERROR
    API_ERROR
    TIMEOUT

    // Permissions
    CAMERA_PERMISSION_DENIED
    MICROPHONE_PERMISSION_DENIED

    // Runtime
    INITIALIZATION_FAILED
    REACT_NATIVE_ERROR

    // Verification
    VERIFICATION_FAILED
    LIVENESS_CHECK_FAILED
    DOCUMENT_VERIFICATION_FAILED
    FACE_MATCH_FAILED

    // User
    USER_CANCELLED
    SESSION_EXPIRED

    UNKNOWN
}
```

### Error Handling Example

```kotlin
override fun onFailure(error: VKYCError) {
    when (error.code) {
        VKYCError.ErrorCode.CAMERA_PERMISSION_DENIED -> {
            showDialog(
                "Camera Permission Required",
                "Please grant camera permission to continue"
            )
            requestCameraPermission()
        }

        VKYCError.ErrorCode.NETWORK_ERROR -> {
            showDialog(
                "Network Error",
                "Please check your internet connection and try again"
            )
            showRetryButton()
        }

        VKYCError.ErrorCode.SESSION_EXPIRED -> {
            showDialog(
                "Session Expired",
                "Your session has expired. Please start again."
            )
            refreshToken()
        }

        VKYCError.ErrorCode.VERIFICATION_FAILED -> {
            showDialog(
                "Verification Failed",
                "We couldn't verify your identity. Please try again."
            )
        }

        else -> {
            showDialog(
                "Error",
                error.message
            )
        }
    }
}
```

---

## Advanced Usage

### Reusable Callback

```kotlin
class VKYCManager(private val context: Context) {

    fun start(token: String, onComplete: (Boolean, String?) -> Unit) {
        val config = VKYCConfig(
            token = token,
            apiKey = BuildConfig.VKYC_API_KEY,
            environment = if (BuildConfig.DEBUG) {
                VKYCConfig.Environment.STAGING
            } else {
                VKYCConfig.Environment.PRODUCTION
            }
        )

        VKYC.start(context, config, object : VKYCCallback {
            override fun onStart() {}

            override fun onSuccess(result: Map<String, Any>) {
                val sessionId = result["sessionId"] as? String
                onComplete(true, sessionId)
            }

            override fun onFailure(error: VKYCError) {
                onComplete(false, error.message)
            }

            override fun onCancel() {
                onComplete(false, "User cancelled")
            }

            override fun onEvent(eventName: String, metadata: Map<String, Any>?) {
                // Log events
            }
        })
    }
}

// Usage
val vkycManager = VKYCManager(this)
vkycManager.start(authToken) { success, message ->
    if (success) {
        navigateToSuccessScreen(message)
    } else {
        showError(message)
    }
}
```

### Initialize on App Start

```kotlin
class MyApplication : Application() {
    override fun onCreate() {
        super.onCreate()

        // Initialize SDK once at app start
        VKYC.initialize(this)

        // Optional: Set up crash reporting, analytics, etc.
    }
}
```

---

## Testing

### Unit Testing

```kotlin
@Test
fun testConfigValidation() {
    // Valid config
    val validConfig = VKYCConfig(
        token = "valid-token",
        apiKey = "valid-key",
        environment = VKYCConfig.Environment.STAGING
    )

    assert(validConfig.validate() is VKYCConfig.ValidationResult.Success)

    // Invalid config
    val invalidConfig = VKYCConfig(
        token = "",
        apiKey = "",
        environment = VKYCConfig.Environment.STAGING
    )

    assert(invalidConfig.validate() is VKYCConfig.ValidationResult.Error)
}
```

### Integration Testing

Use mock VKYC tokens in test environment.

---

## Troubleshooting

### SDK not starting

1. Check permissions are granted
2. Validate configuration
3. Check logs for errors
4. Ensure React Native dependencies are included

### Black screen on launch

1. Ensure `index.android.bundle` is included in assets
2. Check React Native initialization
3. Verify ProGuard rules

### Callbacks not firing

1. Ensure Activity context is used (not Application context)
2. Check callback is not garbage collected
3. Verify React Native bridge is working

### ProGuard issues

Ensure ProGuard rules are included:

```gradle
android {
    buildTypes {
        release {
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

---

## Support

For issues and questions:

- Email: sdk-support@vkyc.com
- Documentation: https://docs.vkyc.com
- GitHub: https://github.com/your-org/vkyc-sdk

---

## Changelog

### v1.0.0 (2026-03-21)

- Initial release
- Basic VKYC flow
- Configuration support
- Callback system
- Error handling
