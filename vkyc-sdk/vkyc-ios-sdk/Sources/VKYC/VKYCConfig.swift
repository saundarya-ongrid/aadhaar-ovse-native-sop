//
//  VKYCConfig.swift
//  VKYC
//
//  Created on 21/03/2026.
//  Copyright © 2026 VKYC. All rights reserved.
//

import Foundation

/// Configuration for VKYC SDK
@objc public class VKYCConfig: NSObject {
    
    // MARK: - Properties
    
    /// Authentication token for VKYC session
    public let token: String
    
    /// API key for VKYC service
    public let apiKey: String
    
    /// Environment (staging or production)
    public let environment: Environment
    
    /// Theme configuration for UI customization
    public var theme: VKYCTheme?
    
    /// Feature flags configuration
    public var features: VKYCFeatures?
    
    /// Custom metadata to pass to VKYC flow
    public var metadata: [String: Any]?
    
    // MARK: - Environment
    
    /// VKYC environment
    @objc public enum Environment: Int {
        case staging
        case production
        
        var stringValue: String {
            switch self {
            case .staging: return "staging"
            case .production: return "production"
            }
        }
    }
    
    // MARK: - Initialization
    
    /// Initialize VKYC configuration
    /// - Parameters:
    ///   - token: Authentication token
    ///   - apiKey: API key
    ///   - environment: Environment (default: staging)
    public init(token: String, apiKey: String, environment: Environment = .staging) {
        self.token = token
        self.apiKey = apiKey
        self.environment = environment
        super.init()
    }
    
    // MARK: - Validation
    
    /// Validate configuration
    /// - Returns: Validation result
    public func validate() -> ValidationResult {
        var errors: [String] = []
        
        if token.isEmpty {
            errors.append("Token cannot be empty")
        }
        
        if apiKey.isEmpty {
            errors.append("API Key cannot be empty")
        }
        
        if let theme = theme {
            if !isValidColor(theme.primaryColor) {
                errors.append("Invalid primary color format")
            }
        }
        
        return errors.isEmpty ? .success : .failure(errors)
    }
    
    /// Validation result
    public enum ValidationResult {
        case success
        case failure([String])
    }
    
    // MARK: - Conversion
    
    /// Convert config to dictionary for React Native
    /// - Returns: Dictionary representation
    func toDictionary() -> [String: Any] {
        var dict: [String: Any] = [
            "token": token,
            "apiKey": apiKey,
            "environment": environment.stringValue
        ]
        
        // Theme
        if let theme = theme {
            var themeDict: [String: Any] = [
                "primaryColor": theme.primaryColor
            ]
            if let secondaryColor = theme.secondaryColor {
                themeDict["secondaryColor"] = secondaryColor
            }
            if let textColor = theme.textColor {
                themeDict["textColor"] = textColor
            }
            if let backgroundColor = theme.backgroundColor {
                themeDict["backgroundColor"] = backgroundColor
            }
            if let fontFamily = theme.fontFamily {
                themeDict["fontFamily"] = fontFamily
            }
            if let buttonRadius = theme.buttonRadius {
                themeDict["buttonRadius"] = buttonRadius
            }
            dict["theme"] = themeDict
        }
        
        // Features
        if let features = features {
            var featuresDict: [String: Any] = [
                "videoEnabled": features.videoEnabled
            ]
            if let autoCapture = features.autoCapture {
                featuresDict["autoCapture"] = autoCapture
            }
            if let livenessCheck = features.livenessCheck {
                featuresDict["livenessCheck"] = livenessCheck
            }
            if let documentVerification = features.documentVerification {
                featuresDict["documentVerification"] = documentVerification
            }
            if let faceMatch = features.faceMatch {
                featuresDict["faceMatch"] = faceMatch
            }
            if let audioEnabled = features.audioEnabled {
                featuresDict["audioEnabled"] = audioEnabled
            }
            if let screenRecording = features.screenRecording {
                featuresDict["screenRecording"] = screenRecording
            }
            dict["features"] = featuresDict
        }
        
        // Metadata
        if let metadata = metadata {
            dict["metadata"] = metadata
        }
        
        return dict
    }
    
    // MARK: - Helpers
    
    private func isValidColor(_ color: String) -> Bool {
        let pattern = "^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{8})$"
        let regex = try? NSRegularExpression(pattern: pattern, options: [])
        let range = NSRange(location: 0, length: color.utf16.count)
        return regex?.firstMatch(in: color, options: [], range: range) != nil
    }
}

// MARK: - Theme Configuration

/// Theme configuration for VKYC UI
@objc public class VKYCTheme: NSObject {
    
    /// Primary color (hex format: #RRGGBB or #AARRGGBB)
    public let primaryColor: String
    
    /// Secondary color (optional)
    public let secondaryColor: String?
    
    /// Text color (optional)
    public let textColor: String?
    
    /// Background color (optional)
    public let backgroundColor: String?
    
    /// Font family name (optional)
    public let fontFamily: String?
    
    /// Button corner radius in points (optional)
    public let buttonRadius: Int?
    
    /// Initialize theme
    /// - Parameters:
    ///   - primaryColor: Primary color (required)
    ///   - secondaryColor: Secondary color
    ///   - textColor: Text color
    ///   - backgroundColor: Background color
    ///   - fontFamily: Font family name
    ///   - buttonRadius: Button corner radius
    public init(
        primaryColor: String,
        secondaryColor: String? = nil,
        textColor: String? = nil,
        backgroundColor: String? = nil,
        fontFamily: String? = nil,
        buttonRadius: Int? = nil
    ) {
        self.primaryColor = primaryColor
        self.secondaryColor = secondaryColor
        self.textColor = textColor
        self.backgroundColor = backgroundColor
        self.fontFamily = fontFamily
        self.buttonRadius = buttonRadius
        super.init()
    }
}

// MARK: - Features Configuration

/// Feature flags for VKYC
@objc public class VKYCFeatures: NSObject {
    
    /// Enable video recording
    public let videoEnabled: Bool
    
    /// Auto-capture documents/face
    public let autoCapture: Bool?
    
    /// Enable liveness check
    public let livenessCheck: Bool?
    
    /// Enable document verification
    public let documentVerification: Bool?
    
    /// Enable face matching
    public let faceMatch: Bool?
    
    /// Enable audio recording
    public let audioEnabled: Bool?
    
    /// Allow screen recording during session
    public let screenRecording: Bool?
    
    /// Initialize features
    /// - Parameters:
    ///   - videoEnabled: Video enabled (required)
    ///   - autoCapture: Auto-capture enabled
    ///   - livenessCheck: Liveness check enabled
    ///   - documentVerification: Document verification enabled
    ///   - faceMatch: Face matching enabled
    ///   - audioEnabled: Audio enabled
    ///   - screenRecording: Screen recording allowed
    public init(
        videoEnabled: Bool,
        autoCapture: Bool? = nil,
        livenessCheck: Bool? = nil,
        documentVerification: Bool? = nil,
        faceMatch: Bool? = nil,
        audioEnabled: Bool? = nil,
        screenRecording: Bool? = nil
    ) {
        self.videoEnabled = videoEnabled
        self.autoCapture = autoCapture
        self.livenessCheck = livenessCheck
        self.documentVerification = documentVerification
        self.faceMatch = faceMatch
        self.audioEnabled = audioEnabled
        self.screenRecording = screenRecording
        super.init()
    }
}
