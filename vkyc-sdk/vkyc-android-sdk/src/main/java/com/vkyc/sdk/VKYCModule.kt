package com.vkyc.sdk

import android.content.Intent
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule

/**
 * React Native Module for VKYC SDK
 * 
 * This module provides methods that React Native can call to:
 * - Notify success/failure/cancel
 * - Send events
 * - Close the VKYC flow
 */
class VKYCModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    
    companion object {
        private const val TAG = "VKYCModule"
        const val MODULE_NAME = "VKYCModule"
    }
    
    override fun getName(): String = MODULE_NAME
    
    /**
     * Called from React Native when VKYC flow completes successfully
     * 
     * @param result ReadableMap containing verification results
     */
    @ReactMethod
    fun onSuccess(result: ReadableMap) {
        val resultMap = result.toHashMap()
        VKYC.triggerSuccess(resultMap)
        closeActivity()
    }
    
    /**
     * Called from React Native when VKYC flow fails
     * 
     * @param errorCode Error code string
     * @param errorMessage Error message
     * @param errorDetails Optional error details
     */
    @ReactMethod
    fun onFailure(errorCode: String, errorMessage: String, errorDetails: ReadableMap?) {
        val code = VKYCError.ErrorCode.values().find { it.value == errorCode }
            ?: VKYCError.ErrorCode.UNKNOWN
        
        val error = VKYCError(
            code = code,
            message = errorMessage,
            details = errorDetails?.toHashMap()
        )
        
        VKYC.triggerFailure(error)
        closeActivity()
    }
    
    /**
     * Called from React Native when user cancels the flow
     */
    @ReactMethod
    fun onCancel() {
        VKYC.triggerCancel()
        closeActivity()
    }
    
    /**
     * Called from React Native to send tracking events
     * 
     * @param eventName Name of the event
     * @param metadata Optional event metadata
     */
    @ReactMethod
    fun onEvent(eventName: String, metadata: ReadableMap?) {
        VKYC.triggerEvent(eventName, metadata?.toHashMap())
    }
    
    /**
     * Called from React Native to close the VKYC activity
     */
    @ReactMethod
    fun close() {
        closeActivity()
    }
    
    /**
     * Get SDK version (accessible from React Native)
     */
    @ReactMethod(isBlockingSynchronousMethod = true)
    fun getSDKVersion(): String {
        return VKYC.getVersion()
    }
    
    /**
     * Launch Aadhaar app for OVSE verification
     * 
     * @param jwtToken JWT token to pass to Aadhaar app
     * @param promise Promise to resolve/reject based on result
     */
    @ReactMethod
    fun launchAadhaarApp(jwtToken: String, promise: Promise) {
        try {
            val activity = currentActivity
            if (activity == null) {
                promise.reject("NO_ACTIVITY", "Activity not available")
                return
            }
            
            val intent = Intent().apply {
                action = "in.gov.uidai.pehchaan.INTENT_REQUEST"
                putExtra("request", jwtToken)
            }
            
            // Check if the Aadhaar app is installed
            val packageManager = activity.packageManager
            if (intent.resolveActivity(packageManager) != null) {
                activity.startActivity(intent)
                promise.resolve(null)
            } else {
                promise.reject("APP_NOT_INSTALLED", "Aadhaar app is not installed")
            }
        } catch (e: Exception) {
            promise.reject("LAUNCH_ERROR", "Failed to launch Aadhaar app: ${e.message}")
        }
    }
    
    /**
     * Helper method to close the activity
     */
    private fun closeActivity() {
        currentActivity?.runOnUiThread {
            currentActivity?.finish()
        }
    }
    
    /**
     * Send event from native to React Native
     * Useful for pushing native events to RN
     */
    fun sendEventToReactNative(eventName: String, params: WritableMap?) {
        reactApplicationContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(eventName, params)
    }
    
    /**
     * Export constants to React Native
     */
    override fun getConstants(): Map<String, Any> {
        return mapOf(
            "SDK_VERSION" to VKYC.getVersion(),
            "PLATFORM" to "android"
        )
    }
}

/**
 * React Package for VKYC SDK
 * Registers the VKYCModule with React Native
 */
class VKYCReactPackage : ReactPackage {
    
    override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
        return listOf(VKYCModule(reactContext))
    }
    
    override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> {
        return emptyList()
    }
}
