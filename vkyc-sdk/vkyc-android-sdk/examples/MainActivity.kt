package com.example.app

import android.os.Bundle
import android.util.Log
import android.widget.Button
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.vkyc.sdk.VKYC
import com.vkyc.sdk.VKYCCallback
import com.vkyc.sdk.VKYCConfig
import com.vkyc.sdk.VKYCError

/**
 * Example Activity showing how to integrate VKYC SDK
 */
class MainActivity : AppCompatActivity() {
    
    companion object {
        private const val TAG = "MainActivity"
    }
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        
        // Initialize SDK (optional - called automatically on start)
        VKYC.initialize(applicationContext)
        
        // Setup button click listener
        findViewById<Button>(R.id.btnStartVKYC).setOnClickListener {
            startOVSE()
        }
    }

    /**
     * Minimal OVSE-only integration sample
     */
    private fun startOVSE() {
        val config = VKYCConfig(
            apiKey = "YOUR_GRIDLINES_API_KEY",
            environment = VKYCConfig.Environment.STAGING,
            mode = VKYCConfig.Mode.OVSE
        ).apply {
            ovse = VKYCConfig.OVSE(
                apiBaseUrl = "https://api-dev.gridlines.io/uidai-api/ovse",
                apiKey = "YOUR_GRIDLINES_API_KEY",
                initialApiKey = "YOUR_GRIDLINES_API_KEY",
                channelType = "APP",
                templateId = "1",
                expiryTimeInSeconds = 3600,
                consent = "Y",
                appPackageId = "in.ongrid.lav",
                appSignature = "+sYXRdwJA3hvue3mKpYrOZ9zSPC7b4mbgzJmdZEDO5w=",
                pollingIntervalMs = 5000,
                maxPollAttempts = 60
            )

            texts = VKYCConfig.Texts(
                welcomeTitle = "Aadhaar OVSE",
                welcomeSubtitle = "Secure verification powered by OnGrid",
                startButtonLabel = "Start OVSE",
                ovseTitle = "Aadhaar OVSE Verification",
                ovseInputLabel = "API Key",
                ovseSubmitLabel = "Start Flow"
            )
        }

        VKYC.start(this, config, createCallback())
    }
    
    /**
     * Example 1: Basic Integration
     */
    private fun startVKYC() {
        // Create configuration
        val config = VKYCConfig(
            token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            apiKey = "your-api-key-here",
            environment = VKYCConfig.Environment.STAGING
        )
        
        // Start VKYC flow
        VKYC.start(this, config, object : VKYCCallback {
            override fun onStart() {
                Log.d(TAG, "VKYC flow started")
                showToast("VKYC Started")
            }
            
            override fun onSuccess(result: Map<String, Any>) {
                Log.d(TAG, "VKYC Success: $result")
                showToast("Verification Successful!")
                
                // Handle success
                val sessionId = result["sessionId"] as? String
                val status = result["status"] as? String
                
                // Navigate to success screen or update UI
                navigateToSuccessScreen(sessionId, status)
            }
            
            override fun onFailure(error: VKYCError) {
                Log.e(TAG, "VKYC Failed: $error")
                showToast("Verification Failed: ${error.message}")
                
                // Handle error based on error code
                when (error.code) {
                    VKYCError.ErrorCode.NETWORK_ERROR -> {
                        // Show retry option
                    }
                    VKYCError.ErrorCode.CAMERA_PERMISSION_DENIED -> {
                        // Request camera permission
                    }
                    else -> {
                        // Show generic error
                    }
                }
            }
            
            override fun onCancel() {
                Log.d(TAG, "VKYC Cancelled by user")
                showToast("Verification Cancelled")
            }
            
            override fun onEvent(eventName: String, metadata: Map<String, Any>?) {
                Log.d(TAG, "VKYC Event: $eventName, metadata: $metadata")
                
                // Track events for analytics
                // logAnalyticsEvent(eventName, metadata)
            }
        })
    }
    
    /**
     * Example 2: Advanced Integration with Custom Theme
     */
    private fun startVKYCWithCustomTheme() {
        val config = VKYCConfig(
            token = "your-token",
            apiKey = "your-api-key",
            environment = VKYCConfig.Environment.PRODUCTION
        ).apply {
            // Custom theme
            theme = VKYCConfig.Theme(
                primaryColor = "#667eea",
                secondaryColor = "#764ba2",
                textColor = "#333333",
                backgroundColor = "#FFFFFF",
                fontFamily = "Roboto",
                buttonRadius = 12
            )
            
            // Feature configuration
            features = VKYCConfig.Features(
                videoEnabled = true,
                autoCapture = true,
                livenessCheck = true,
                documentVerification = true,
                faceMatch = true,
                audioEnabled = true,
                screenRecording = false
            )
            
            // Custom metadata
            metadata = mapOf(
                "userId" to "12345",
                "source" to "mobile_app",
                "sessionType" to "kyc_verification"
            )
        }
        
        VKYC.start(this, config, createCallback())
    }
    
    /**
     * Example 3: Using VKYCCallbackAdapter for cleaner code
     */
    private fun startVKYCWithAdapter() {
        val config = VKYCConfig(
            token = "your-token",
            apiKey = "your-api-key",
            environment = VKYCConfig.Environment.STAGING
        )
        
        // Using adapter - only override methods you need
        VKYC.start(this, config, object : com.vkyc.sdk.VKYCCallbackAdapter() {
            override fun onSuccess(result: Map<String, Any>) {
                showToast("Success!")
                navigateToSuccessScreen(
                    result["sessionId"] as? String,
                    result["status"] as? String
                )
            }
            
            override fun onFailure(error: VKYCError) {
                showToast("Error: ${error.message}")
            }
        })
    }
    
    /**
     * Example 4: Validation before starting
     */
    private fun startVKYCWithValidation() {
        val config = VKYCConfig(
            token = "your-token",
            apiKey = "your-api-key",
            environment = VKYCConfig.Environment.STAGING
        )
        
        // Validate config before starting
        when (val validation = config.validate()) {
            is VKYCConfig.ValidationResult.Success -> {
                VKYC.start(this, config, createCallback())
            }
            is VKYCConfig.ValidationResult.Error -> {
                showToast("Invalid config: ${validation.errors.joinToString()}")
            }
        }
    }
    
    /**
     * Create a reusable callback
     */
    private fun createCallback(): VKYCCallback {
        return object : VKYCCallback {
            override fun onStart() {
                Log.d(TAG, "Started")
            }
            
            override fun onSuccess(result: Map<String, Any>) {
                handleSuccess(result)
            }
            
            override fun onFailure(error: VKYCError) {
                handleError(error)
            }
            
            override fun onCancel() {
                Log.d(TAG, "Cancelled")
            }
            
            override fun onEvent(eventName: String, metadata: Map<String, Any>?) {
                trackEvent(eventName, metadata)
            }
        }
    }
    
    // Helper methods
    
    private fun showToast(message: String) {
        runOnUiThread {
            Toast.makeText(this, message, Toast.LENGTH_SHORT).show()
        }
    }
    
    private fun navigateToSuccessScreen(sessionId: String?, status: String?) {
        // Navigate to success screen
        // val intent = Intent(this, SuccessActivity::class.java)
        // intent.putExtra("sessionId", sessionId)
        // intent.putExtra("status", status)
        // startActivity(intent)
    }
    
    private fun handleSuccess(result: Map<String, Any>) {
        Log.d(TAG, "Handling success: $result")
        showToast("Verification Successful!")
    }
    
    private fun handleError(error: VKYCError) {
        Log.e(TAG, "Handling error: $error")
        showToast("Error: ${error.message}")
    }
    
    private fun trackEvent(eventName: String, metadata: Map<String, Any>?) {
        // Send to analytics
        Log.d(TAG, "Analytics: $eventName - $metadata")
    }
}
