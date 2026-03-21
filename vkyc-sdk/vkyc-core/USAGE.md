# VKYC Core - Usage Examples

This document shows how to integrate VKYC Core into native Android and iOS wrappers.

## React Native Setup

### 1. Bundle Generation

**Android:**

```bash
# Generate Android bundle
npx react-native bundle \
  --platform android \
  --dev false \
  --entry-file index.js \
  --bundle-output android-bundle/index.android.bundle \
  --assets-dest android-bundle/
```

**iOS:**

```bash
# Generate iOS bundle
npx react-native bundle \
  --platform ios \
  --dev false \
  --entry-file index.js \
  --bundle-output ios-bundle/main.jsbundle \
  --assets-dest ios-bundle/
```

### 2. Native Integration

## Android Integration

```kotlin
// Initialize VKYC with configuration
val config = VKYCConfig.Builder()
    .setToken("your-token")
    .setApiKey("your-api-key")
    .setEnvironment("staging")
    .setTheme(
        VKYCTheme(
            primaryColor = "#667eea",
            secondaryColor = "#764ba2"
        )
    )
    .setFeatures(
        VKYCFeatures(
            videoRecording = true,
            liveness = true
        )
    )
    .build()

// Launch VKYC
VKYC.launch(this, config, object : VKYCCallback {
    override fun onSuccess(result: VKYCResult) {
        // Handle success
        println("Verification successful: ${result.sessionId}")
    }

    override fun onFailure(error: VKYCError) {
        // Handle failure
        println("Verification failed: ${error.message}")
    }

    override fun onCancel() {
        // Handle cancellation
        println("User cancelled verification")
    }

    override fun onEvent(event: String, data: Map<String, Any>) {
        // Handle events
        println("Event: $event, Data: $data")
    }
})
```

## iOS Integration

```swift
// Initialize VKYC with configuration
let config = VKYCConfig(
    token: "your-token",
    apiKey: "your-api-key",
    environment: .staging,
    theme: VKYCTheme(
        primaryColor: "#667eea",
        secondaryColor: "#764ba2"
    ),
    features: VKYCFeatures(
        videoRecording: true,
        liveness: true
    )
)

// Launch VKYC with delegate pattern
VKYCManager.shared.launch(
    from: self,
    config: config,
    delegate: self
)

// Or with completion handler
VKYCManager.shared.launch(
    from: self,
    config: config
) { result in
    switch result {
    case .success(let vkycResult):
        print("Verification successful: \\(vkycResult.sessionId)")
    case .failure(let error):
        print("Verification failed: \\(error.message)")
    }
}

// Implement VKYCDelegate
extension MyViewController: VKYCDelegate {
    func vkycDidSucceed(_ result: VKYCResult) {
        print("Success: \\(result.sessionId)")
    }

    func vkycDidFail(_ error: VKYCError) {
        print("Failed: \\(error.message)")
    }

    func vkycDidCancel() {
        print("Cancelled")
    }

    func vkycDidEmitEvent(_ event: String, data: [String: Any]) {
        print("Event: \\(event)")
    }
}
```

## Configuration Options

### VKYCConfig

| Property    | Type         | Required | Description                |
| ----------- | ------------ | -------- | -------------------------- |
| token       | String       | Yes      | Authentication token       |
| apiKey      | String       | Yes      | API key                    |
| environment | String       | Yes      | "staging" or "production"  |
| theme       | VKYCTheme    | No       | Custom theme configuration |
| features    | VKYCFeatures | No       | Feature flags              |
| metadata    | Map          | No       | Custom metadata            |

### VKYCTheme

| Property        | Type   | Description                 |
| --------------- | ------ | --------------------------- |
| primaryColor    | String | Primary brand color (hex)   |
| secondaryColor  | String | Secondary brand color (hex) |
| textColor       | String | Text color (hex)            |
| backgroundColor | String | Background color (hex)      |
| fontFamily      | String | Custom font family          |
| buttonRadius    | Number | Button border radius        |

### VKYCFeatures

| Property             | Type    | Default | Description                  |
| -------------------- | ------- | ------- | ---------------------------- |
| videoRecording       | Boolean | true    | Enable video recording       |
| liveness             | Boolean | true    | Enable liveness detection    |
| autoCapture          | Boolean | false   | Auto-capture documents       |
| documentVerification | Boolean | true    | Verify document authenticity |
| faceMatch            | Boolean | true    | Match face with document     |
| audioEnabled         | Boolean | true    | Enable audio in videos       |

## Callbacks/Events

### Success Callback

Called when verification completes successfully.

**Payload:**

```json
{
   "success": true,
   "sessionId": "sess_123456",
   "verificationId": "ver_789012",
   "data": {
      "documentType": "passport",
      "verified": true,
      "confidence": 0.98
   }
}
```

### Failure Callback

Called when verification fails.

**Payload:**

```json
{
  "code": "VERIFICATION_FAILED",
  "message": "Document verification failed",
  "details": {...}
}
```

### Event Callback

Called for various events during the flow.

**Event Types:**

- `screen_changed`: User navigated to new screen
- `button_clicked`: User clicked a button
- `document_captured`: Document photo captured
- `selfie_captured`: Selfie photo captured
- `video_recorded`: Video recording completed
- `liveness_check_completed`: Liveness check passed
- `session_created`: Verification session created
- `document_uploaded`: Document uploaded to server
- `selfie_uploaded`: Selfie uploaded to server
- `video_uploaded`: Video uploaded to server

## Error Codes

| Code                  | Description            |
| --------------------- | ---------------------- |
| `INVALID_CONFIG`      | Invalid configuration  |
| `NETWORK_ERROR`       | Network request failed |
| `API_ERROR`           | API returned error     |
| `CAPTURE_FAILED`      | Camera capture failed  |
| `UPLOAD_FAILED`       | File upload failed     |
| `VERIFICATION_FAILED` | Verification failed    |
| `LIVENESS_FAILED`     | Liveness check failed  |
| `TIMEOUT`             | Operation timed out    |
| `UNKNOWN_ERROR`       | Unknown error occurred |

## Testing

### Test Token

For testing purposes, use the following test token:

```
test_token_Kk3m8dJ2nQ9pL7rS5tV1xW4yC6
```

This token will simulate successful verification in the staging environment.

### Test Mode

Enable test mode by setting environment to "staging" and using test credentials. All API calls will use mock data.

## Troubleshooting

### Bundle Not Found

**Error:** "Could not load bundle"

**Android Solution:**

1. Ensure bundle is placed in `src/main/assets/`
2. Verify bundle path in `VKYCActivity.kt`
3. Check ProGuard rules don't strip React Native

**iOS Solution:**

1. Ensure bundle is added to Xcode project
2. Verify bundle is marked for target
3. Check bundle path in `VKYCViewController.swift`

### Native Module Not Found

**Error:** "VKYCModule native module not found"

**Solution:**

1. Ensure `VKYCModule` (Android) or `VKYCBridgeModule` (iOS) is registered
2. Rebuild native projects
3. Check module is not stripped by ProGuard/optimization

### Configuration Validation Failed

**Error:** "Token is required" or "API Key is required"

**Solution:**
Ensure you're passing all required configuration parameters:

```kotlin
// Android
val config = VKYCConfig.Builder()
    .setToken("your-token")      // Required
    .setApiKey("your-api-key")   // Required
    .setEnvironment("staging")   // Required
    .build()
```

## Best Practices

1. **Bundle Size**: Keep bundle optimized by using production builds
2. **Error Handling**: Always implement all callback methods
3. **Network**: Ensure proper network connectivity before launching
4. **Permissions**: Request camera permissions before launching SDK
5. **Memory**: Release SDK references when done to prevent leaks
6. **Testing**: Test with various devices and network conditions
7. **Updates**: Keep React Native bundle updated with latest fixes

## Support

For issues or questions:

- GitHub Issues: [vkyc-sdk/issues](https://github.com/vkyc/sdk/issues)
- Email: support@vkyc.com
- Documentation: [docs.vkyc.com](https://docs.vkyc.com)
