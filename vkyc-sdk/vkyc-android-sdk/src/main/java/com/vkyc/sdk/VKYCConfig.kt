package com.vkyc.sdk

/**
 * Configuration class for VKYC SDK
 * 
 * @property token Authentication token for VKYC session
 * @property apiKey API key for VKYC service
 * @property environment Environment (STAGING or PRODUCTION)
 */
data class VKYCConfig(
    val token: String,
    val apiKey: String,
    val environment: Environment = Environment.STAGING
) {
    var theme: Theme? = null
    var features: Features? = null
    var metadata: Map<String, Any>? = null
    
    /**
     * Environment configuration
     */
    enum class Environment(val value: String) {
        STAGING("staging"),
        PRODUCTION("production")
    }
    
    /**
     * Theme configuration for UI customization
     */
    data class Theme(
        val primaryColor: String,
        val secondaryColor: String? = null,
        val textColor: String? = null,
        val backgroundColor: String? = null,
        val fontFamily: String? = null,
        val buttonRadius: Int? = null
    )
    
    /**
     * Feature flags configuration
     */
    data class Features(
        val videoEnabled: Boolean = true,
        val autoCapture: Boolean? = false,
        val livenessCheck: Boolean? = true,
        val documentVerification: Boolean? = true,
        val faceMatch: Boolean? = true,
        val audioEnabled: Boolean? = true,
        val screenRecording: Boolean? = false
    )
    
    /**
     * Convert config to Bundle for passing to React Native
     */
    fun toBundle(): android.os.Bundle {
        return android.os.Bundle().apply {
            putString("token", token)
            putString("apiKey", apiKey)
            putString("environment", environment.value)
            
            // Theme
            theme?.let { themeConfig ->
                val themeBundle = android.os.Bundle().apply {
                    putString("primaryColor", themeConfig.primaryColor)
                    themeConfig.secondaryColor?.let { putString("secondaryColor", it) }
                    themeConfig.textColor?.let { putString("textColor", it) }
                    themeConfig.backgroundColor?.let { putString("backgroundColor", it) }
                    themeConfig.fontFamily?.let { putString("fontFamily", it) }
                    themeConfig.buttonRadius?.let { putInt("buttonRadius", it) }
                }
                putBundle("theme", themeBundle)
            }
            
            // Features
            features?.let { featuresConfig ->
                val featuresBundle = android.os.Bundle().apply {
                    putBoolean("videoEnabled", featuresConfig.videoEnabled)
                    featuresConfig.autoCapture?.let { putBoolean("autoCapture", it) }
                    featuresConfig.livenessCheck?.let { putBoolean("livenessCheck", it) }
                    featuresConfig.documentVerification?.let { putBoolean("documentVerification", it) }
                    featuresConfig.faceMatch?.let { putBoolean("faceMatch", it) }
                    featuresConfig.audioEnabled?.let { putBoolean("audioEnabled", it) }
                    featuresConfig.screenRecording?.let { putBoolean("screenRecording", it) }
                }
                putBundle("features", featuresBundle)
            }
            
            // Metadata
            metadata?.let { meta ->
                val metadataBundle = android.os.Bundle()
                meta.forEach { (key, value) ->
                    when (value) {
                        is String -> metadataBundle.putString(key, value)
                        is Int -> metadataBundle.putInt(key, value)
                        is Boolean -> metadataBundle.putBoolean(key, value)
                        is Double -> metadataBundle.putDouble(key, value)
                        is Float -> metadataBundle.putFloat(key, value)
                        is Long -> metadataBundle.putLong(key, value)
                    }
                }
                putBundle("metadata", metadataBundle)
            }
        }
    }
    
    /**
     * Validate configuration
     */
    fun validate(): ValidationResult {
        val errors = mutableListOf<String>()
        
        if (token.isBlank()) {
            errors.add("Token cannot be empty")
        }
        
        if (apiKey.isBlank()) {
            errors.add("API Key cannot be empty")
        }
        
        theme?.let {
            if (!isValidColor(it.primaryColor)) {
                errors.add("Invalid primary color format")
            }
        }
        
        return if (errors.isEmpty()) {
            ValidationResult.Success
        } else {
            ValidationResult.Error(errors)
        }
    }
    
    private fun isValidColor(color: String): Boolean {
        return color.matches(Regex("^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{8})$"))
    }
    
    sealed class ValidationResult {
        object Success : ValidationResult()
        data class Error(val errors: List<String>) : ValidationResult()
    }
}
