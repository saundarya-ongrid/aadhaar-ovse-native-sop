# VKYC iOS SDK

Native iOS wrapper for the VKYC SDK. Embeds React Native and provides a native API for iOS applications.

## 📦 Installation

### CocoaPods

```ruby
pod 'VKYC', '~> 1.0.0'
```

### Swift Package Manager

```swift
dependencies: [
    .package(url: "https://github.com/your-org/vkyc-ios-sdk.git", from: "1.0.0")
]
```

### Manual Installation

1. Download `VKYC.xcframework`
2. Drag into your Xcode project
3. Add to "Frameworks, Libraries, and Embedded Content"

## 🚀 Usage

### Basic Integration

```swift
import VKYC

class ViewController: UIViewController {

    func startVKYC() {
        // Create configuration
        let config = VKYCConfig(
            token: "your-auth-token",
            apiKey: "your-api-key",
            environment: .staging
        )

        // Optional: Customize theme
        config.theme = VKYCTheme(
            primaryColor: "#667eea",
            secondaryColor: "#764ba2",
            textColor: "#333333"
        )

        // Optional: Configure features
        config.features = VKYCFeatures(
            videoEnabled: true,
            autoCapture: true
        )

        // Start VKYC flow
        VKYCManager.start(from: self, config: config) { result in
            switch result {
            case .success(let data):
                print("VKYC Success: \(data)")
                // Handle success

            case .failure(let error):
                print("VKYC Error: \(error)")
                // Handle error

            case .cancelled:
                print("VKYC Cancelled")
                // Handle cancellation
            }
        }
    }
}
```

### With Delegate Pattern

```swift
class ViewController: UIViewController, VKYCDelegate {

    func startVKYC() {
        let config = VKYCConfig(
            token: "token",
            apiKey: "key",
            environment: .production
        )

        VKYCManager.shared.delegate = self
        VKYCManager.start(from: self, config: config)
    }

    // MARK: - VKYCDelegate

    func vkycDidStart() {
        print("VKYC Started")
    }

    func vkycDidSucceed(with result: [String: Any]) {
        print("Success: \(result)")
    }

    func vkycDidFail(with error: VKYCError) {
        print("Error: \(error)")
    }

    func vkycDidCancel() {
        print("Cancelled")
    }

    func vkycDidReceiveEvent(_ eventName: String, metadata: [String: Any]?) {
        print("Event: \(eventName)")
    }
}
```

## 📋 Requirements

- iOS 13.0 or later
- Swift 5.5+
- Xcode 14.0+

## 🔧 Permissions

Add to your `Info.plist`:

```xml
<key>NSCameraUsageDescription</key>
<string>Camera access is required for video KYC verification</string>

<key>NSMicrophoneUsageDescription</key>
<string>Microphone access is required for video KYC verification</string>
```

## 📝 License

Proprietary - See LICENSE file
