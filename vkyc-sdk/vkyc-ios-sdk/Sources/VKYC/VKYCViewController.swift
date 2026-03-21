//
//  VKYCViewController.swift
//  VKYC
//
//  Created on 21/03/2026.
//  Copyright © 2026 VKYC. All rights reserved.
//

import Foundation
import UIKit
import React

/// View controller that hosts the React Native VKYC flow
class VKYCViewController: UIViewController {
    
    // MARK: - Properties
    
    /// VKYC configuration
    private let config: VKYCConfig
    
    /// React Native bridge
    private var bridge: RCTBridge?
    
    /// React Native root view
    private var rootView: RCTRootView?
    
    /// Delegate for callbacks
    weak var vkycDelegate: VKYCManager?
    
    // MARK: - Initialization
    
    /// Initialize with configuration
    /// - Parameter config: VKYC configuration
    init(config: VKYCConfig) {
        self.config = config
        super.init(nibName: nil, bundle: nil)
    }
    
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    
    // MARK: - Lifecycle
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        setupReactNative()
        setupNavigationBar()
    }
    
    private func setupNavigationBar() {
        // Hide navigation bar for full screen experience
        navigationController?.setNavigationBarHidden(true, animated: false)
        
        // Or show with close button
        // let closeButton = UIBarButtonItem(
        //     barButtonSystemItem: .close,
        //     target: self,
        //     action: #selector(closeTapped)
        // )
        // navigationItem.rightBarButtonItem = closeButton
    }
    
    private func setupReactNative() {
        do {
            print("[VKYC] Setting up React Native")
            
            // Get bundle URL
            guard let bundleURL = getBundleURL() else {
                throw VKYCError(
                    code: .reactNativeError,
                    message: "Failed to get React Native bundle URL"
                )
            }
            
            print("[VKYC] Bundle URL: \(bundleURL)")
            
            // Create bridge
            bridge = RCTBridge(
                bundleURL: bundleURL,
                moduleProvider: {
                    return [VKYCBridgeModule(viewController: self)]
                },
                launchOptions: nil
            )
            
            guard let bridge = bridge else {
                throw VKYCError(
                    code: .reactNativeError,
                    message: "Failed to create React Native bridge"
                )
            }
            
            // Create root view
            rootView = RCTRootView(
                bridge: bridge,
                moduleName: "VKYCApp",
                initialProperties: config.toDictionary()
            )
            
            guard let rootView = rootView else {
                throw VKYCError(
                    code: .reactNativeError,
                    message: "Failed to create React Native root view"
                )
            }
            
            // Setup view
            rootView.backgroundColor = .white
            rootView.frame = view.bounds
            rootView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
            
            view.addSubview(rootView)
            
            print("[VKYC] React Native setup complete")
            
        } catch let error as VKYCError {
            handleError(error)
        } catch {
            handleError(VKYCError(
                code: .reactNativeError,
                message: "Failed to setup React Native",
                underlyingError: error
            ))
        }
    }
    
    private func getBundleURL() -> URL? {
        #if DEBUG
        // In debug, use Metro bundler
        return RCTBundleURLProvider.sharedSettings().jsBundleURL(
            forBundleRoot: "index",
            fallbackExtension: nil
        )
        #else
        // In release, use pre-bundled JS from main bundle
        return Bundle.main.url(forResource: "main", withExtension: "jsbundle")
        #endif
    }
    
    // MARK: - Actions
    
    @objc private func closeTapped() {
        vkycDelegate?.handleCancel()
        dismiss(animated: true)
    }
    
    // MARK: - Callbacks from React Native
    
    func handleSuccess(_ result: [String: Any]) {
        vkycDelegate?.handleSuccess(result)
        dismiss(animated: true)
    }
    
    func handleFailure(_ error: VKYCError) {
        vkycDelegate?.handleFailure(error)
        dismiss(animated: true)
    }
    
    func handleCancel() {
        vkycDelegate?.handleCancel()
        dismiss(animated: true)
    }
    
    func handleEvent(_ eventName: String, metadata: [String: Any]?) {
        vkycDelegate?.handleEvent(eventName, metadata: metadata)
    }
    
    func handleClose() {
        dismiss(animated: true)
    }
    
    private func handleError(_ error: VKYCError) {
        print("[VKYC] Error: \(error)")
        vkycDelegate?.handleFailure(error)
        dismiss(animated: true)
    }
    
    // MARK: - Cleanup
    
    override func viewWillDisappear(_ animated: Bool) {
        super.viewWillDisappear(animated)
        
        if isBeingDismissed || isMovingFromParent {
            cleanup()
        }
    }
    
    private func cleanup() {
        print("[VKYC] Cleaning up")
        
        rootView?.removeFromSuperview()
        rootView = nil
        
        bridge?.invalidate()
        bridge = nil
    }
    
    deinit {
        print("[VKYC] VKYCViewController deallocated")
        cleanup()
    }
}
