//
//  VKYCBridgeModule.swift
//  VKYC
//
//  Created on 21/03/2026.
//  Copyright © 2026 VKYC. All rights reserved.
//

import Foundation
import UIKit
import React

/// React Native bridge module for VKYC
@objc(VKYCModule)
class VKYCBridgeModule: NSObject, RCTBridgeModule {
    
    // MARK: - Properties
    
    /// View controller reference
    private weak var viewController: VKYCViewController?
    
    // MARK: - Initialization
    
    init(viewController: VKYCViewController) {
        self.viewController = viewController
        super.init()
    }
    
    // MARK: - RCTBridgeModule
    
    static func moduleName() -> String! {
        return "VKYCModule"
    }
    
    /// Run on main queue
    static func requiresMainQueueSetup() -> Bool {
        return true
    }
    
    /// Export constants to React Native
    @objc func constantsToExport() -> [AnyHashable : Any]! {
        return [
            "SDK_VERSION": VKYCManager.version,
            "PLATFORM": "ios"
        ]
    }
    
    // MARK: - Methods exposed to React Native
    
    /// Called from React Native when VKYC flow completes successfully
    /// - Parameter result: Verification result
    @objc func onSuccess(_ result: NSDictionary) {
        print("[VKYC Bridge] onSuccess called")
        
        DispatchQueue.main.async {
            if let resultDict = result as? [String: Any] {
                self.viewController?.handleSuccess(resultDict)
            }
        }
    }
    
    /// Called from React Native when VKYC flow fails
    /// - Parameters:
    ///   - errorCode: Error code string
    ///   - errorMessage: Error message
    ///   - errorDetails: Optional error details
    @objc func onFailure(
        _ errorCode: String,
        errorMessage: String,
        errorDetails: NSDictionary?
    ) {
        print("[VKYC Bridge] onFailure called: \(errorCode) - \(errorMessage)")
        
        DispatchQueue.main.async {
            let code = VKYCError.ErrorCode.from(string: errorCode)
            let details = errorDetails as? [String: Any]
            
            let error = VKYCError(
                code: code,
                message: errorMessage,
                details: details
            )
            
            self.viewController?.handleFailure(error)
        }
    }
    
    /// Called from React Native when user cancels the flow
    @objc func onCancel() {
        print("[VKYC Bridge] onCancel called")
        
        DispatchQueue.main.async {
            self.viewController?.handleCancel()
        }
    }
    
    /// Called from React Native to send tracking events
    /// - Parameters:
    ///   - eventName: Name of the event
    ///   - metadata: Optional event metadata
    @objc func onEvent(_ eventName: String, metadata: NSDictionary?) {
        print("[VKYC Bridge] onEvent called: \(eventName)")
        
        DispatchQueue.main.async {
            let metadataDict = metadata as? [String: Any]
            self.viewController?.handleEvent(eventName, metadata: metadataDict)
        }
    }
    
    /// Called from React Native to close the VKYC view
    @objc func close() {
        print("[VKYC Bridge] close called")
        
        DispatchQueue.main.async {
            self.viewController?.handleClose()
        }
    }
    
    /// Get SDK version (accessible from React Native)
    @objc func getSDKVersion(_ callback: RCTResponseSenderBlock) {
        callback([VKYCManager.version])
    }
    
    /// Check if running in debug mode
    @objc func isDebugMode(_ callback: RCTResponseSenderBlock) {
        #if DEBUG
        callback([true])
        #else
        callback([false])
        #endif
    }
    
    /// Launch Aadhaar app for OVSE verification
    /// - Parameters:
    ///   - jwtToken: JWT token to pass to Aadhaar app
    ///   - resolve: Promise resolve callback
    ///   - reject: Promise reject callback
    @objc func launchAadhaarApp(
        _ jwtToken: String,
        resolve: @escaping RCTPromiseResolveBlock,
        reject: @escaping RCTPromiseRejectBlock
    ) {
        print("[VKYC Bridge] launchAadhaarApp called")
        
        DispatchQueue.main.async {
            // Encode JWT token for URL
            guard let encodedToken = jwtToken.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) else {
                reject("ENCODING_ERROR", "Failed to encode JWT token", nil)
                return
            }
            
            // URL scheme: pehchaan://in.gov.uidai.pehchaan?req=<jwt>
            let urlString = "pehchaan://in.gov.uidai.pehchaan?req=\(encodedToken)"
            
            guard let url = URL(string: urlString) else {
                reject("INVALID_URL", "Failed to create URL", nil)
                return
            }
            
            // Check if Aadhaar app is installed
            if UIApplication.shared.canOpenURL(url) {
                UIApplication.shared.open(url, options: [:]) { success in
                    if success {
                        resolve(nil)
                    } else {
                        reject("LAUNCH_FAILED", "Failed to launch Aadhaar app", nil)
                    }
                }
            } else {
                reject("APP_NOT_INSTALLED", "Aadhaar app is not installed", nil)
            }
        }
    }
}
