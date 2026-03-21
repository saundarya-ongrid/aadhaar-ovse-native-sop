# VKYC iOS SDK - Integration Guide

Complete guide for integrating VKYC SDK into your iOS application.

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

- iOS 13.0 or later
- Xcode 14.0 or later
- Swift 5.5+ or Objective-C
- CocoaPods or Swift Package Manager

---

## Installation

### Option 1: CocoaPods

Add to your `Podfile`:

```ruby
platform :ios, '13.0'
use_frameworks!

target 'YourApp' do
  pod 'VKYC', '~> 1.0.0'
end
```

Then run:

```bash
pod install
```

### Option 2: Swift Package Manager

In Xcode:

1. File → Add Packages...
2. Enter repository URL: `https://github.com/your-org/vkyc-ios-sdk.git`
3. Select version: `1.0.0`
4. Add to project

Or in `Package.swift`:

```swift
dependencies: [
    .package(url: "https://github.com/your-org/vkyc-ios-sdk.git", from: "1.0.0")
]
```

### Option 3: Manual Installation

1. Download `VKYC.xcframework`
2. Drag into your Xcode project
3. Add to "Frameworks, Libraries, and Embedded Content"
4. Set "Embed & Sign"

---

## Permissions

### Required Permissions

Add to your `Info.plist`:

```xml
<key>NSCameraUsageDescription</key>
<string>Camera access is required for video KYC verification</string>

<key>NSMicrophoneUsageDescription</key>
<string>Microphone access is required for video KYC verification</string>
```

### Request Permissions at Runtime

```swift
import AVFoundation

func checkPermissions(completion: @escaping (Bool) -> Void) {
    let cameraStatus = AVCaptureDevice.authorizationStatus(for: .video)
    let micStatus = AVCaptureDevice.authorizationStatus(for: .audio)

    switch (cameraStatus, micStatus) {
    case (.authorized, .authorized):
        completion(true)

    case (.notDetermined, _), (_, .notDetermined):
        AVCaptureDevice.requestAccess(for: .video) { videoGranted in
            AVCaptureDevice.requestAccess(for: .audio) { audioGranted in
                DispatchQueue.main.async {
                    completion(videoGranted && audioGranted)
                }
            }
        }

    default:
        completion(false)
    }
}
```

---

## Basic Integration

### Swift

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

        // Start VKYC
        VKYCManager.start(from: self, config: config) { result in
            switch result {
            case .success(let data):
                print("Success: \(data)")

            case .failure(let error):
                print("Error: \(error)")

            case .cancelled:
                print("Cancelled")
            }
        }
    }
}
```

### Objective-C

```objc
#import <VKYC/VKYC-Swift.h>

- (void)startVKYC {
    VKYCConfig *config = [[VKYCConfig alloc] initWithToken:@"your-token"
                                                    apiKey:@"your-api-key"
                                               environment:VKYCConfigEnvironmentStaging];

    [VKYCManager startFrom:self
                    config:config
                   success:^(NSDictionary *result) {
        NSLog(@"Success: %@", result);
    }
                   failure:^(VKYCError *error) {
        NSLog(@"Error: %@", error);
    }
                    cancel:^{
        NSLog(@"Cancelled");
    }];
}
```

---

## Configuration

### Full Configuration Options

```swift
let config = VKYCConfig(
    token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    apiKey: "your-api-key-here",
    environment: .production
)

// UI Theme Customization
config.theme = VKYCTheme(
    primaryColor: "#667eea",        // Required
    secondaryColor: "#764ba2",      // Optional
    textColor: "#333333",           // Optional
    backgroundColor: "#FFFFFF",     // Optional
    fontFamily: "SF Pro Display",   // Optional
    buttonRadius: 12                // Optional (in points)
)

// Feature Flags
config.features = VKYCFeatures(
    videoEnabled: true,             // Required
    autoCapture: true,              // Optional
    livenessCheck: true,            // Optional
    documentVerification: true,     // Optional
    faceMatch: true,                // Optional
    audioEnabled: true,             // Optional
    screenRecording: false          // Optional
)

// Custom Metadata
config.metadata = [
    "userId": "12345",
    "source": "ios_app",
    "sessionType": "kyc_verification"
]
```

### Environment Options

```swift
.staging      // For testing
.production   // For production
```

### Validation

```swift
switch config.validate() {
case .success:
    // Config is valid
    VKYCManager.start(from: self, config: config) { result in
        // Handle result
    }

case .failure(let errors):
    // Config is invalid
    print("Errors: \(errors)")
}
```

---

## Callbacks

### Completion Handler Pattern

```swift
VKYCManager.start(from: self, config: config) { result in
    switch result {
    case .success(let data):
        // Handle success
        let sessionId = data["sessionId"] as? String
        let status = data["status"] as? String

    case .failure(let error):
        // Handle error
        print("Error: \(error.message)")

    case .cancelled:
        // User cancelled
    }
}
```

### Delegate Pattern

```swift
class ViewController: UIViewController, VKYCDelegate {

    func startVKYC() {
        let config = VKYCConfig(token: "...", apiKey: "...", environment: .staging)
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

### Success Result Structure

```swift
{
    "sessionId": "abc123xyz",
    "status": "verified",
    "timestamp": 1234567890,
    "verificationData": {
        "documentVerified": true,
        "faceMatched": true,
        "livenessCheckPassed": true
    }
}
```

### Event Tracking

Common events:

- `screen_viewed` - A screen was displayed
- `button_clicked` - User clicked a button
- `document_captured` - Document was captured
- `face_captured` - Face was captured
- `verification_started` - Verification started
- `verification_completed` - Verification completed

```swift
func vkycDidReceiveEvent(_ eventName: String, metadata: [String: Any]?) {
    switch eventName {
    case "screen_viewed":
        if let screenName = metadata?["screenName"] as? String {
            Analytics.track("screen_view", properties: ["screen": screenName])
        }

    case "button_clicked":
        if let buttonId = metadata?["buttonId"] as? String {
            Analytics.track("button_click", properties: ["button": buttonId])
        }

    default:
        Analytics.track(eventName, properties: metadata)
    }
}
```

---

## Error Handling

### Error Codes

```swift
public enum ErrorCode: Int {
    // Configuration
    case invalidConfig = 1000
    case missingToken = 1001
    case missingAPIKey = 1002

    // Network
    case networkError = 2000
    case apiError = 2001
    case timeout = 2002

    // Permissions
    case cameraPermissionDenied = 3000
    case microphonePermissionDenied = 3001

    // Runtime
    case initializationFailed = 4000
    case reactNativeError = 4001

    // Verification
    case verificationFailed = 5000
    case livenessCheckFailed = 5001
    case documentVerificationFailed = 5002
    case faceMatchFailed = 5003

    // User
    case userCancelled = 6000
    case sessionExpired = 6001

    case unknown = 9999
}
```

### Error Handling Example

```swift
func handleError(_ error: VKYCError) {
    switch error.code {
    case .cameraPermissionDenied:
        showAlert(
            title: "Camera Permission Required",
            message: "Please grant camera permission in Settings",
            action: openSettings
        )

    case .microphonePermissionDenied:
        showAlert(
            title: "Microphone Permission Required",
            message: "Please grant microphone permission in Settings",
            action: openSettings
        )

    case .networkError:
        showAlert(
            title: "Network Error",
            message: "Please check your internet connection and try again",
            action: retry
        )

    case .sessionExpired:
        showAlert(
            title: "Session Expired",
            message: "Your session has expired. Please start again.",
            action: refreshToken
        )

    case .verificationFailed:
        showAlert(
            title: "Verification Failed",
            message: "We couldn't verify your identity. Please try again."
        )

    default:
        showAlert(
            title: "Error",
            message: error.message
        )
    }
}

private func openSettings() {
    if let settingsURL = URL(string: UIApplication.openSettingsURLString) {
        UIApplication.shared.open(settingsURL)
    }
}
```

---

## Advanced Usage

### Reusable VKYC Manager

```swift
class VKYCService {

    static let shared = VKYCService()

    func verify(
        from viewController: UIViewController,
        token: String,
        completion: @escaping (Result<String, Error>) -> Void
    ) {
        let config = VKYCConfig(
            token: token,
            apiKey: AppConfig.vkycAPIKey,
            environment: AppConfig.isProduction ? .production : .staging
        )

        VKYCManager.start(from: viewController, config: config) { result in
            switch result {
            case .success(let data):
                if let sessionId = data["sessionId"] as? String {
                    completion(.success(sessionId))
                }

            case .failure(let error):
                completion(.failure(error))

            case .cancelled:
                completion(.failure(VKYCError(
                    code: .userCancelled,
                    message: "User cancelled verification"
                )))
            }
        }
    }
}

// Usage
VKYCService.shared.verify(from: self, token: authToken) { result in
    switch result {
    case .success(let sessionId):
        self.proceedWithSessionId(sessionId)
    case .failure(let error):
        self.handleError(error)
    }
}
```

### SwiftUI Integration

```swift
import SwiftUI
import VKYC

struct ContentView: View {
    @State private var showVKYC = false
    @State private var result: String?

    var body: some View {
        VStack {
            Button("Start VKYC") {
                showVKYC = true
            }

            if let result = result {
                Text("Result: \(result)")
            }
        }
        .sheet(isPresented: $showVKYC) {
            VKYCHostingController(
                config: createConfig(),
                onResult: handleResult
            )
        }
    }

    private func createConfig() -> VKYCConfig {
        VKYCConfig(
            token: "your-token",
            apiKey: "your-api-key",
            environment: .staging
        )
    }

    private func handleResult(_ vkycResult: VKYCResult) {
        showVKYC = false

        switch vkycResult {
        case .success(let data):
            result = "Success: \(data["sessionId"] ?? "")"
        case .failure(let error):
            result = "Error: \(error.message)"
        case .cancelled:
            result = "Cancelled"
        }
    }
}

// Hosting Controller
struct VKYCHostingController: UIViewControllerRepresentable {
    let config: VKYCConfig
    let onResult: (VKYCResult) -> Void

    func makeUIViewController(context: Context) -> UIViewController {
        let vc = UIViewController()

        DispatchQueue.main.async {
            VKYCManager.start(from: vc, config: config) { result in
                onResult(result)
            }
        }

        return vc
    }

    func updateUIViewController(_ uiViewController: UIViewController, context: Context) {}
}
```

---

## Testing

### Unit Testing

```swift
import XCTest
@testable import VKYC

class VKYCConfigTests: XCTestCase {

    func testValidConfiguration() {
        let config = VKYCConfig(
            token: "valid-token",
            apiKey: "valid-key",
            environment: .staging
        )

        XCTAssertEqual(config.validate(), .success)
    }

    func testInvalidConfiguration() {
        let config = VKYCConfig(
            token: "",
            apiKey: "",
            environment: .staging
        )

        if case .failure(let errors) = config.validate() {
            XCTAssertTrue(errors.contains("Token cannot be empty"))
            XCTAssertTrue(errors.contains("API Key cannot be empty"))
        } else {
            XCTFail("Expected validation to fail")
        }
    }
}
```

### UI Testing

Use mock VKYC tokens in test environment.

---

## Troubleshooting

### SDK not starting

1. Check permissions are granted
2. Validate configuration
3. Check logs for errors
4. Ensure React Native bundle is included

### Black screen on launch

1. Ensure `main.jsbundle` is in app bundle (Release) or Metro is running (Debug)
2. Check React Native initialization
3. Verify module paths

### Callbacks not firing

1. Ensure delegate is set before starting
2. Check delegate is not nil/deallocated
3. Verify React Native bridge is working

### Build Issues

#### Swift/Objective-C Mixing

Ensure bridging header is configured:

```objc
// YourApp-Bridging-Header.h
#import <React/RCTBridgeModule.h>
#import <React/RCTViewManager.h>
```

#### Module Not Found

Clean build folder: `Shift + Cmd + K`

Rebuild: `Cmd + B`

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
- Delegate and completion handler support
- Error handling
- Swift and Objective-C support
