//
//  VKYCDelegate.swift
//  VKYC
//
//  Created on 21/03/2026.
//  Copyright © 2026 VKYC. All rights reserved.
//

import Foundation

// MARK: - Delegate Protocol

/// Delegate protocol for VKYC lifecycle events
@objc public protocol VKYCDelegate: AnyObject {
    
    /// Called when VKYC flow starts
    @objc optional func vkycDidStart()
    
    /// Called when VKYC flow completes successfully
    /// - Parameter result: Verification result data
    @objc optional func vkycDidSucceed(with result: [String: Any])
    
    /// Called when VKYC flow fails
    /// - Parameter error: Error information
    @objc optional func vkycDidFail(with error: VKYCError)
    
    /// Called when user cancels VKYC flow
    @objc optional func vkycDidCancel()
    
    /// Called for tracking events during VKYC flow
    /// - Parameters:
    ///   - eventName: Name of the event
    ///   - metadata: Optional metadata associated with the event
    @objc optional func vkycDidReceiveEvent(_ eventName: String, metadata: [String: Any]?)
}

// MARK: - Completion Handler

/// Completion result for VKYC flow
public enum VKYCResult {
    /// Verification successful
    case success([String: Any])
    
    /// Verification failed
    case failure(VKYCError)
    
    /// User cancelled
    case cancelled
}

/// Completion handler type for VKYC flow
public typealias VKYCCompletionHandler = (VKYCResult) -> Void

// MARK: - Error

/// VKYC Error
@objc public class VKYCError: NSObject, Error, LocalizedError {
    
    /// Error code
    public let code: ErrorCode
    
    /// Error message
    public let message: String
    
    /// Additional error details
    public let details: [String: Any]?
    
    /// Underlying error
    public let underlyingError: Error?
    
    /// Error codes
    @objc public enum ErrorCode: Int {
        // Configuration errors
        case invalidConfig = 1000
        case missingToken = 1001
        case missingAPIKey = 1002
        
        // Network errors
        case networkError = 2000
        case apiError = 2001
        case timeout = 2002
        
        // Permission errors
        case cameraPermissionDenied = 3000
        case microphonePermissionDenied = 3001
        
        // Runtime errors
        case initializationFailed = 4000
        case reactNativeError = 4001
        
        // Verification errors
        case verificationFailed = 5000
        case livenessCheckFailed = 5001
        case documentVerificationFailed = 5002
        case faceMatchFailed = 5003
        
        // User errors
        case userCancelled = 6000
        case sessionExpired = 6001
        
        // Unknown
        case unknown = 9999
        
        var stringValue: String {
            switch self {
            case .invalidConfig: return "invalid_config"
            case .missingToken: return "missing_token"
            case .missingAPIKey: return "missing_api_key"
            case .networkError: return "network_error"
            case .apiError: return "api_error"
            case .timeout: return "timeout"
            case .cameraPermissionDenied: return "camera_permission_denied"
            case .microphonePermissionDenied: return "microphone_permission_denied"
            case .initializationFailed: return "initialization_failed"
            case .reactNativeError: return "react_native_error"
            case .verificationFailed: return "verification_failed"
            case .livenessCheckFailed: return "liveness_check_failed"
            case .documentVerificationFailed: return "document_verification_failed"
            case .faceMatchFailed: return "face_match_failed"
            case .userCancelled: return "user_cancelled"
            case .sessionExpired: return "session_expired"
            case .unknown: return "unknown"
            }
        }
        
        static func from(string: String) -> ErrorCode {
            switch string {
            case "invalid_config": return .invalidConfig
            case "missing_token": return .missingToken
            case "missing_api_key": return .missingAPIKey
            case "network_error": return .networkError
            case "api_error": return .apiError
            case "timeout": return .timeout
            case "camera_permission_denied": return .cameraPermissionDenied
            case "microphone_permission_denied": return .microphonePermissionDenied
            case "initialization_failed": return .initializationFailed
            case "react_native_error": return .reactNativeError
            case "verification_failed": return .verificationFailed
            case "liveness_check_failed": return .livenessCheckFailed
            case "document_verification_failed": return .documentVerificationFailed
            case "face_match_failed": return .faceMatchFailed
            case "user_cancelled": return .userCancelled
            case "session_expired": return .sessionExpired
            default: return .unknown
            }
        }
    }
    
    // MARK: - Initialization
    
    /// Initialize VKYC error
    /// - Parameters:
    ///   - code: Error code
    ///   - message: Error message
    ///   - details: Additional details
    ///   - underlyingError: Underlying error
    public init(
        code: ErrorCode,
        message: String,
        details: [String: Any]? = nil,
        underlyingError: Error? = nil
    ) {
        self.code = code
        self.message = message
        self.details = details
        self.underlyingError = underlyingError
        super.init()
    }
    
    // MARK: - LocalizedError
    
    public var errorDescription: String? {
        return message
    }
    
    public var failureReason: String? {
        return "VKYC Error: \(code.stringValue)"
    }
    
    public var recoverySuggestion: String? {
        switch code {
        case .cameraPermissionDenied:
            return "Please grant camera permission in Settings"
        case .microphonePermissionDenied:
            return "Please grant microphone permission in Settings"
        case .networkError:
            return "Please check your internet connection and try again"
        case .sessionExpired:
            return "Please restart the verification process"
        default:
            return nil
        }
    }
    
    // MARK: - Description
    
    public override var description: String {
        return "VKYCError(code: \(code.stringValue), message: '\(message)', details: \(details?.description ?? "nil"))"
    }
}
