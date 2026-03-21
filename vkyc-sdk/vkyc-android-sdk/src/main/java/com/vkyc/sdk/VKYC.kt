package com.vkyc.sdk

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.util.Log
import java.lang.ref.WeakReference

/**
 * Main entry point for VKYC SDK
 * 
 * Usage:
 * ```kotlin
 * VKYC.start(context, config, callback)
 * ```
 */
object VKYC {
    
    private const val TAG = "VKYC"
    private const val SDK_VERSION = "1.0.0"
    
    // Store callback reference
    internal var callbackRef: WeakReference<VKYCCallback>? = null
    
    // Track initialization state
    private var isInitialized = false
    
    /**
     * Get SDK version
     */
    fun getVersion(): String = SDK_VERSION
    
    /**
     * Initialize VKYC SDK (optional, called automatically on start)
     * 
     * @param context Application context
     */
    fun initialize(context: Context) {
        if (isInitialized) {
            Log.w(TAG, "SDK already initialized")
            return
        }
        
        try {
            // You can perform any one-time initialization here
            // For example: initialize analytics, check dependencies, etc.
            
            isInitialized = true
            Log.d(TAG, "VKYC SDK v$SDK_VERSION initialized")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to initialize SDK", e)
            throw VKYCInitializationException("SDK initialization failed", e)
        }
    }
    
    /**
     * Start VKYC flow
     * 
     * @param context Activity context
     * @param config VKYC configuration
     * @param callback Callback for VKYC lifecycle events
     * 
     * @throws VKYCInitializationException if SDK initialization fails
     * @throws IllegalArgumentException if config is invalid
     */
    fun start(
        context: Context,
        config: VKYCConfig,
        callback: VKYCCallback
    ) {
        Log.d(TAG, "Starting VKYC flow")
        
        // Validate context
        if (context !is Activity) {
            callback.onFailure(
                VKYCError(
                    code = VKYCError.ErrorCode.INVALID_CONFIG,
                    message = "Context must be an Activity"
                )
            )
            return
        }
        
        // Validate configuration
        when (val validationResult = config.validate()) {
            is VKYCConfig.ValidationResult.Error -> {
                callback.onFailure(
                    VKYCError(
                        code = VKYCError.ErrorCode.INVALID_CONFIG,
                        message = "Invalid configuration: ${validationResult.errors.joinToString(", ")}",
                        details = mapOf("errors" to validationResult.errors)
                    )
                )
                return
            }
            is VKYCConfig.ValidationResult.Success -> {
                // Configuration is valid, continue
            }
        }
        
        // Initialize SDK if not already done
        if (!isInitialized) {
            try {
                initialize(context.applicationContext)
            } catch (e: Exception) {
                callback.onFailure(
                    VKYCError(
                        code = VKYCError.ErrorCode.INITIALIZATION_FAILED,
                        message = "Failed to initialize SDK",
                        cause = e
                    )
                )
                return
            }
        }
        
        // Store callback reference
        callbackRef = WeakReference(callback)
        
        // Trigger onStart callback
        callback.onStart()
        
        // Launch VKYC Activity
        try {
            val intent = Intent(context, VKYCActivity::class.java).apply {
                putExtras(config.toBundle())
                // Add flags for better UX
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            context.startActivity(intent)
            
            Log.d(TAG, "VKYC Activity launched successfully")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to start VKYC Activity", e)
            callback.onFailure(
                VKYCError(
                    code = VKYCError.ErrorCode.INITIALIZATION_FAILED,
                    message = "Failed to start VKYC flow",
                    cause = e
                )
            )
        }
    }
    
    /**
     * Check if VKYC flow is currently active
     */
    fun isActive(): Boolean {
        return callbackRef?.get() != null
    }
    
    /**
     * Internal method to trigger success callback
     */
    internal fun triggerSuccess(result: Map<String, Any>) {
        Log.d(TAG, "VKYC Success: $result")
        callbackRef?.get()?.onSuccess(result)
        clearCallback()
    }
    
    /**
     * Internal method to trigger failure callback
     */
    internal fun triggerFailure(error: VKYCError) {
        Log.e(TAG, "VKYC Failure: $error")
        callbackRef?.get()?.onFailure(error)
        clearCallback()
    }
    
    /**
     * Internal method to trigger cancel callback
     */
    internal fun triggerCancel() {
        Log.d(TAG, "VKYC Cancelled")
        callbackRef?.get()?.onCancel()
        clearCallback()
    }
    
    /**
     * Internal method to trigger event callback
     */
    internal fun triggerEvent(eventName: String, metadata: Map<String, Any>?) {
        Log.d(TAG, "VKYC Event: $eventName, metadata: $metadata")
        callbackRef?.get()?.onEvent(eventName, metadata)
    }
    
    /**
     * Clear callback reference
     */
    private fun clearCallback() {
        callbackRef?.clear()
        callbackRef = null
    }
}

/**
 * Exception thrown when SDK initialization fails
 */
class VKYCInitializationException(
    message: String,
    cause: Throwable? = null
) : Exception(message, cause)
