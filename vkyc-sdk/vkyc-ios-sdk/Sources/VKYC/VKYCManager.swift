//
//  VKYCManager.swift
//  VKYC
//
//  Created on 21/03/2026.
//  Copyright © 2026 VKYC. All rights reserved.
//

import Foundation
import UIKit

/// Main entry point for VKYC SDK
@objc public class VKYCManager: NSObject {
    
    // MARK: - Properties
    
    /// Shared instance
    @objc public static let shared = VKYCManager()
    
    /// SDK version
    @objc public static let version = "1.0.0"
    
    /// Delegate for VKYC events
    @objc public weak var delegate: VKYCDelegate?
    
    /// Current completion handler
    private var completionHandler: VKYCCompletionHandler?
    
    /// Currently presented view controller
    private weak var presentedViewController: VKYCViewController?
    
    /// Initialization state
    private var isInitialized = false
    
    // MARK: - Initialization
    
    private override init() {
        super.init()
    }
    
    /// Initialize VKYC SDK (optional, called automatically on start)
    @objc public static func initialize() {
        shared.performInitialization()
    }
    
    private func performInitialization() {
        guard !isInitialized else {
            print("[VKYC] SDK already initialized")
            return
        }
        
        // Perform any one-time initialization
        // e.g., setup analytics, check dependencies, etc.
        
        isInitialized = true
        print("[VKYC] SDK v\(VKYCManager.version) initialized")
    }
    
    // MARK: - Start VKYC
    
    /// Start VKYC flow with completion handler
    /// - Parameters:
    ///   - viewController: View controller to present from
    ///   - config: VKYC configuration
    ///   - completion: Completion handler
    @objc public static func start(
        from viewController: UIViewController,
        config: VKYCConfig,
        completion: @escaping VKYCCompletionHandler
    ) {
        shared.startVKYC(from: viewController, config: config, completion: completion)
    }
    
    /// Start VKYC flow with delegate
    /// - Parameters:
    ///   - viewController: View controller to present from
    ///   - config: VKYC configuration
    @objc public static func start(
        from viewController: UIViewController,
        config: VKYCConfig
    ) {
        shared.startVKYC(from: viewController, config: config, completion: nil)
    }
    
    private func startVKYC(
        from viewController: UIViewController,
        config: VKYCConfig,
        completion: VKYCCompletionHandler?
    ) {
        print("[VKYC] Starting VKYC flow")
        
        // Validate configuration
        switch config.validate() {
        case .success:
            break
        case .failure(let errors):
            let error = VKYCError(
                code: .invalidConfig,
                message: "Invalid configuration: \(errors.joined(separator: ", "))",
                details: ["errors": errors]
            )
            handleFailure(error, completion: completion)
            return
        }
        
        // Initialize SDK if needed
        if !isInitialized {
            performInitialization()
        }
        
        // Store completion handler
        self.completionHandler = completion
        
        // Notify start
        DispatchQueue.main.async {
            self.delegate?.vkycDidStart?()
            self.completionHandler = completion // Store after delegate call
        }
        
        // Create and present VKYC view controller
        DispatchQueue.main.async {
            let vkycViewController = VKYCViewController(config: config)
            vkycViewController.vkycDelegate = self
            
            let navigationController = UINavigationController(rootViewController: vkycViewController)
            navigationController.modalPresentationStyle = .fullScreen
            
            self.presentedViewController = vkycViewController
            
            viewController.present(navigationController, animated: true) {
                print("[VKYC] View controller presented")
            }
        }
    }
    
    // MARK: - Callbacks
    
    /// Check if VKYC is currently active
    @objc public static func isActive() -> Bool {
        return shared.presentedViewController != nil
    }
    
    /// Dismiss VKYC flow programmatically
    @objc public static func dismiss(animated: Bool = true, completion: (() -> Void)? = nil) {
        shared.dismissVKYC(animated: animated, completion: completion)
    }
    
    private func dismissVKYC(animated: Bool, completion: (() -> Void)?) {
        DispatchQueue.main.async {
            self.presentedViewController?.dismiss(animated: animated) {
                self.presentedViewController = nil
                completion?()
            }
        }
    }
    
    // MARK: - Internal Callbacks
    
    internal func handleSuccess(_ result: [String: Any]) {
        print("[VKYC] Success: \(result)")
        
        DispatchQueue.main.async {
            self.delegate?.vkycDidSucceed?(with: result)
            self.completionHandler?(.success(result))
            self.cleanup()
        }
    }
    
    internal func handleFailure(_ error: VKYCError, completion: VKYCCompletionHandler? = nil) {
        print("[VKYC] Failure: \(error)")
        
        DispatchQueue.main.async {
            self.delegate?.vkycDidFail?(with: error)
            (completion ?? self.completionHandler)?(.failure(error))
            self.cleanup()
        }
    }
    
    internal func handleCancel() {
        print("[VKYC] Cancelled")
        
        DispatchQueue.main.async {
            self.delegate?.vkycDidCancel?()
            self.completionHandler?(.cancelled)
            self.cleanup()
        }
    }
    
    internal func handleEvent(_ eventName: String, metadata: [String: Any]?) {
        print("[VKYC] Event: \(eventName), metadata: \(metadata?.description ?? "nil")")
        
        DispatchQueue.main.async {
            self.delegate?.vkycDidReceiveEvent?(eventName, metadata: metadata)
        }
    }
    
    private func cleanup() {
        completionHandler = nil
    }
}

// MARK: - Objective-C Compatibility

extension VKYCManager {
    
    /// Start VKYC flow (Objective-C compatible)
    /// - Parameters:
    ///   - viewController: View controller to present from
    ///   - config: VKYC configuration
    ///   - successBlock: Success callback
    ///   - failureBlock: Failure callback
    ///   - cancelBlock: Cancel callback
    @objc public static func start(
        from viewController: UIViewController,
        config: VKYCConfig,
        success successBlock: @escaping ([String: Any]) -> Void,
        failure failureBlock: @escaping (VKYCError) -> Void,
        cancel cancelBlock: @escaping () -> Void
    ) {
        start(from: viewController, config: config) { result in
            switch result {
            case .success(let data):
                successBlock(data)
            case .failure(let error):
                failureBlock(error)
            case .cancelled:
                cancelBlock()
            }
        }
    }
}
