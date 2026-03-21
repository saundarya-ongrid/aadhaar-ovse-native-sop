# VKYC Android SDK

Native Android wrapper for the VKYC SDK. Embeds React Native and provides a native API for Android applications.

## 📦 Installation

### Gradle

```gradle
dependencies {
    implementation 'com.vkyc:vkyc-android-sdk:1.0.0'
}
```

### Maven

```xml
<dependency>
  <groupId>com.vkyc</groupId>
  <artifactId>vkyc-android-sdk</artifactId>
  <version>1.0.0</version>
</dependency>
```

## 🚀 Usage

### Basic Integration

```kotlin
import com.vkyc.sdk.VKYC
import com.vkyc.sdk.VKYCConfig
import com.vkyc.sdk.VKYCCallback

class MainActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Configure VKYC
        val config = VKYCConfig(
            token = "your-auth-token",
            apiKey = "your-api-key",
            environment = VKYCConfig.Environment.STAGING
        ).apply {
            theme = VKYCConfig.Theme(
                primaryColor = "#667eea",
                secondaryColor = "#764ba2",
                textColor = "#333333"
            )
            features = VKYCConfig.Features(
                videoEnabled = true,
                autoCapture = true
            )
        }

        // Start VKYC flow
        VKYC.start(this, config, object : VKYCCallback {
            override fun onStart() {
                Log.d("VKYC", "VKYC flow started")
            }

            override fun onSuccess(result: Map<String, Any>) {
                Log.d("VKYC", "Success: $result")
            }

            override fun onFailure(error: VKYCError) {
                Log.e("VKYC", "Error: ${error.message}")
            }

            override fun onCancel() {
                Log.d("VKYC", "User cancelled")
            }

            override fun onEvent(eventName: String, metadata: Map<String, Any>?) {
                Log.d("VKYC", "Event: $eventName, Data: $metadata")
            }
        })
    }
}
```

### Advanced Configuration

```kotlin
val config = VKYCConfig(
    token = "token",
    apiKey = "key",
    environment = VKYCConfig.Environment.PRODUCTION
).apply {
    // Custom theme
    theme = VKYCConfig.Theme(
        primaryColor = "#FF5722",
        secondaryColor = "#FFC107",
        textColor = "#212121",
        backgroundColor = "#FFFFFF",
        fontFamily = "Roboto"
    )

    // Feature flags
    features = VKYCConfig.Features(
        videoEnabled = true,
        autoCapture = true,
        livenessCheck = true,
        documentVerification = true,
        faceMatch = true
    )

    // Custom metadata
    metadata = mapOf(
        "userId" to "12345",
        "source" to "mobile_app"
    )
}
```

## 📋 Requirements

- Android 5.0 (API 21) or higher
- AndroidX support
- minSdkVersion: 21
- targetSdkVersion: 34

## 🔧 ProGuard Rules

If using ProGuard, add these rules:

```proguard
-keep class com.vkyc.sdk.** { *; }
-keep class com.facebook.react.** { *; }
```

## 📝 License

Proprietary - See LICENSE file
