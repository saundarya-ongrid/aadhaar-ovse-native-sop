//
//  ViewController.swift
//  VKYC Example
//
//  Created on 21/03/2026.
//  Copyright © 2026 VKYC. All rights reserved.
//

import UIKit
import VKYC

class ViewController: UIViewController {
    
    // MARK: - Properties
    
    private let startButton: UIButton = {
        let button = UIButton(type: .system)
        button.setTitle("Start VKYC", for: .normal)
        button.titleLabel?.font = .systemFont(ofSize: 18, weight: .semibold)
        button.translatesAutoresizingMaskIntoConstraints = false
        return button
    }()
    
    // MARK: - Lifecycle
    
    override func viewDidLoad() {
        super.viewDidLoad()
        setupUI()
    }
    
    private func setupUI() {
        view.backgroundColor = .white
        title = "VKYC Example"
        
        view.addSubview(startButton)
        startButton.addTarget(self, action: #selector(startVKYCTapped), for: .touchUpInside)
        
        NSLayoutConstraint.activate([
            startButton.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            startButton.centerYAnchor.constraint(equalTo: view.centerYAnchor)
        ])
    }
    
    // MARK: - Example 1: Basic Integration with Completion Handler
    
    @objc private func startVKYCTapped() {
        // Create configuration
        let config = VKYCConfig(
            token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            apiKey: "your-api-key-here",
            environment: .staging
        )
        
        // Start VKYC
        VKYCManager.start(from: self, config: config) { result in
            switch result {
            case .success(let data):
                self.handleSuccess(data)
                
            case .failure(let error):
                self.handleError(error)
                
            case .cancelled:
                self.handleCancellation()
            }
        }
    }
    
    // MARK: - Example 2: Advanced Integration with Custom Theme
    
    private func startVKYCWithCustomTheme() {
        // Create configuration
        let config = VKYCConfig(
            token: "your-token",
            apiKey: "your-api-key",
            environment: .production
        )
        
        // Customize theme
        config.theme = VKYCTheme(
            primaryColor: "#667eea",
            secondaryColor: "#764ba2",
            textColor: "#333333",
            backgroundColor: "#FFFFFF",
            fontFamily: "SF Pro Display",
            buttonRadius: 12
        )
        
        // Configure features
        config.features = VKYCFeatures(
            videoEnabled: true,
            autoCapture: true,
            livenessCheck: true,
            documentVerification: true,
            faceMatch: true,
            audioEnabled: true,
            screenRecording: false
        )
        
        // Add custom metadata
        config.metadata = [
            "userId": "12345",
            "source": "ios_app",
            "sessionType": "kyc_verification"
        ]
        
        // Start VKYC
        VKYCManager.start(from: self, config: config) { result in
            self.handleResult(result)
        }
    }
    
    // MARK: - Example 3: Using Delegate Pattern
    
    private func startVKYCWithDelegate() {
        let config = VKYCConfig(
            token: "your-token",
            apiKey: "your-api-key",
            environment: .staging
        )
        
        VKYCManager.shared.delegate = self
        VKYCManager.start(from: self, config: config)
    }
    
    // MARK: - Example 4: Validation Before Starting
    
    private func startVKYCWithValidation() {
        let config = VKYCConfig(
            token: "your-token",
            apiKey: "your-api-key",
            environment: .staging
        )
        
        // Validate configuration
        switch config.validate() {
        case .success:
            VKYCManager.start(from: self, config: config) { result in
                self.handleResult(result)
            }
            
        case .failure(let errors):
            showAlert(
                title: "Invalid Configuration",
                message: errors.joined(separator: "\n")
            )
        }
    }
    
    // MARK: - Example 5: Checking Permissions First
    
    private func startVKYCWithPermissionCheck() {
        checkPermissions { [weak self] granted in
            guard let self = self else { return }
            
            if granted {
                let config = VKYCConfig(
                    token: "your-token",
                    apiKey: "your-api-key",
                    environment: .staging
                )
                
                VKYCManager.start(from: self, config: config) { result in
                    self.handleResult(result)
                }
            } else {
                self.showPermissionDeniedAlert()
            }
        }
    }
    
    // MARK: - Helper Methods
    
    private func handleResult(_ result: VKYCResult) {
        switch result {
        case .success(let data):
            handleSuccess(data)
        case .failure(let error):
            handleError(error)
        case .cancelled:
            handleCancellation()
        }
    }
    
    private func handleSuccess(_ data: [String: Any]) {
        print("✅ VKYC Success: \(data)")
        
        let sessionId = data["sessionId"] as? String ?? "N/A"
        let status = data["status"] as? String ?? "N/A"
        
        showAlert(
            title: "Verification Successful",
            message: "Session ID: \(sessionId)\nStatus: \(status)"
        )
    }
    
    private func handleError(_ error: VKYCError) {
        print("❌ VKYC Error: \(error)")
        
        let message: String
        switch error.code {
        case .cameraPermissionDenied:
            message = "Camera permission is required. Please grant access in Settings."
        case .microphonePermissionDenied:
            message = "Microphone permission is required. Please grant access in Settings."
        case .networkError:
            message = "Network error. Please check your connection and try again."
        case .sessionExpired:
            message = "Your session has expired. Please start again."
        default:
            message = error.message
        }
        
        showAlert(title: "Verification Failed", message: message)
    }
    
    private func handleCancellation() {
        print("⚠️ VKYC Cancelled")
        showAlert(title: "Cancelled", message: "Verification was cancelled")
    }
    
    private func checkPermissions(completion: @escaping (Bool) -> Void) {
        // Check camera permission
        let cameraStatus = AVCaptureDevice.authorizationStatus(for: .video)
        
        switch cameraStatus {
        case .authorized:
            completion(true)
            
        case .notDetermined:
            AVCaptureDevice.requestAccess(for: .video) { granted in
                DispatchQueue.main.async {
                    completion(granted)
                }
            }
            
        case .denied, .restricted:
            completion(false)
            
        @unknown default:
            completion(false)
        }
    }
    
    private func showPermissionDeniedAlert() {
        let alert = UIAlertController(
            title: "Permission Required",
            message: "Camera and microphone access is required for video verification. Please grant access in Settings.",
            preferredStyle: .alert
        )
        
        alert.addAction(UIAlertAction(title: "Settings", style: .default) { _ in
            if let settingsURL = URL(string: UIApplication.openSettingsURLString) {
                UIApplication.shared.open(settingsURL)
            }
        })
        
        alert.addAction(UIAlertAction(title: "Cancel", style: .cancel))
        
        present(alert, animated: true)
    }
    
    private func showAlert(title: String, message: String) {
        let alert = UIAlertController(
            title: title,
            message: message,
            preferredStyle: .alert
        )
        alert.addAction(UIAlertAction(title: "OK", style: .default))
        present(alert, animated: true)
    }
}

// MARK: - VKYCDelegate

extension ViewController: VKYCDelegate {
    
    func vkycDidStart() {
        print("📱 VKYC Started")
    }
    
    func vkycDidSucceed(with result: [String : Any]) {
        print("✅ VKYC Success: \(result)")
        handleSuccess(result)
    }
    
    func vkycDidFail(with error: VKYCError) {
        print("❌ VKYC Error: \(error)")
        handleError(error)
    }
    
    func vkycDidCancel() {
        print("⚠️ VKYC Cancelled")
        handleCancellation()
    }
    
    func vkycDidReceiveEvent(_ eventName: String, metadata: [String : Any]?) {
        print("📊 VKYC Event: \(eventName), metadata: \(metadata ?? [:])")
        
        // Track events with your analytics service
        // Analytics.track(eventName, properties: metadata)
    }
}

// MARK: - Import for permissions
import AVFoundation
