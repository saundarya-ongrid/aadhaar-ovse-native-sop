package com.vkyc.sdk

/**
 * Callback interface for VKYC SDK lifecycle events
 */
interface VKYCCallback {
    
    /**
     * Called when VKYC flow starts
     */
    fun onStart()
    
    /**
     * Called when VKYC flow completes successfully
     * 
     * @param result Map containing verification results
     *               Example: {
     *                 "sessionId": "abc123",
     *                 "status": "verified",
     *                 "timestamp": 1234567890,
     *                 "verificationData": {...}
     *               }
     */
    fun onSuccess(result: Map<String, Any>)
    
    /**
     * Called when VKYC flow fails
     * 
     * @param error VKYCError containing error details
     */
    fun onFailure(error: VKYCError)
    
    /**
     * Called when user cancels the VKYC flow
     */
    fun onCancel()
    
    /**
     * Called for tracking events during VKYC flow
     * 
     * @param eventName Name of the event (e.g., "screen_viewed", "button_clicked")
     * @param metadata Optional metadata associated with the event
     */
    fun onEvent(eventName: String, metadata: Map<String, Any>? = null)
}

/**
 * Error class for VKYC SDK
 */
data class VKYCError(
    val code: ErrorCode,
    val message: String,
    val details: Map<String, Any>? = null,
    val cause: Throwable? = null
) {
    
    enum class ErrorCode(val value: String) {
        // Configuration errors
        INVALID_CONFIG("invalid_config"),
        MISSING_TOKEN("missing_token"),
        MISSING_API_KEY("missing_api_key"),
        
        // Network errors
        NETWORK_ERROR("network_error"),
        API_ERROR("api_error"),
        TIMEOUT("timeout"),
        
        // Permission errors
        CAMERA_PERMISSION_DENIED("camera_permission_denied"),
        MICROPHONE_PERMISSION_DENIED("microphone_permission_denied"),
        
        // Runtime errors
        INITIALIZATION_FAILED("initialization_failed"),
        REACT_NATIVE_ERROR("react_native_error"),
        
        // Verification errors
        VERIFICATION_FAILED("verification_failed"),
        LIVENESS_CHECK_FAILED("liveness_check_failed"),
        DOCUMENT_VERIFICATION_FAILED("document_verification_failed"),
        FACE_MATCH_FAILED("face_match_failed"),
        
        // User errors
        USER_CANCELLED("user_cancelled"),
        SESSION_EXPIRED("session_expired"),
        
        // Unknown
        UNKNOWN("unknown")
    }
    
    override fun toString(): String {
        return "VKYCError(code=${code.value}, message='$message', details=$details)"
    }
}

/**
 * Abstract base callback with default no-op implementations
 * Useful for Kotlin users who only want to override specific methods
 */
abstract class VKYCCallbackAdapter : VKYCCallback {
    override fun onStart() {}
    override fun onSuccess(result: Map<String, Any>) {}
    override fun onFailure(error: VKYCError) {}
    override fun onCancel() {}
    override fun onEvent(eventName: String, metadata: Map<String, Any>?) {}
}
