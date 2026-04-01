package com.vkyc.sdk

/**
 * Configuration class for VKYC SDK
 * 
 * @property token Authentication token for VKYC session
 * @property apiKey API key for VKYC service
 * @property environment Environment (STAGING or PRODUCTION)
 */
data class VKYCConfig(
    val token: String = "",
    val apiKey: String,
    val environment: Environment = Environment.STAGING,
    val mode: Mode = Mode.VKYC
) {
    var theme: Theme? = null
    var features: Features? = null
    var ovse: OVSE? = null
    var texts: Texts? = null
    var metadata: Map<String, Any>? = null

    enum class Mode(val value: String) {
        VKYC("vkyc"),
        OVSE("ovse")
    }
    
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
     * OVSE-specific runtime options
     */
    data class OVSE(
        val apiBaseUrl: String? = null,
        val apiKey: String? = null,
        val initialApiKey: String? = null,
        val channelType: String? = "APP",
        val templateId: String? = "1",
        val expiryTimeInSeconds: Int? = 3600,
        val consent: String? = "Y",
        val appPackageId: String? = null,
        val appSignature: String? = null,
        val pollingIntervalMs: Int? = 5000,
        val maxPollAttempts: Int? = 60
    )

    /**
     * Host app text overrides for white-labeled UI
     */
    data class Texts(
        val welcomeTitle: String? = null,
        val welcomeSubtitle: String? = null,
        val startButtonLabel: String? = null,
        val startOVSEButtonLabel: String? = null,
        val cancelButtonLabel: String? = null,
        val ovseTitle: String? = null,
        val ovseSubtitle: String? = null,
        val ovseInputLabel: String? = null,
        val ovseInputPlaceholder: String? = null,
        val ovseSubmitLabel: String? = null
    )
    
    /**
     * Convert config to Bundle for passing to React Native
     */
    fun toBundle(): android.os.Bundle {
        return android.os.Bundle().apply {
            putString("token", token)
            putString("apiKey", apiKey)
            putString("environment", environment.value)
            putString("mode", mode.value)
            
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

            // OVSE
            ovse?.let { ovseConfig ->
                val ovseBundle = android.os.Bundle().apply {
                    ovseConfig.apiBaseUrl?.let { putString("apiBaseUrl", it) }
                    ovseConfig.apiKey?.let { putString("apiKey", it) }
                    ovseConfig.initialApiKey?.let { putString("initialApiKey", it) }
                    ovseConfig.channelType?.let { putString("channelType", it) }
                    ovseConfig.templateId?.let { putString("templateId", it) }
                    ovseConfig.expiryTimeInSeconds?.let { putInt("expiryTimeInSeconds", it) }
                    ovseConfig.consent?.let { putString("consent", it) }
                    ovseConfig.appPackageId?.let { putString("appPackageId", it) }
                    ovseConfig.appSignature?.let { putString("appSignature", it) }
                    ovseConfig.pollingIntervalMs?.let { putInt("pollingIntervalMs", it) }
                    ovseConfig.maxPollAttempts?.let { putInt("maxPollAttempts", it) }
                }
                putBundle("ovse", ovseBundle)
            }

            // Texts
            texts?.let { textConfig ->
                val textsBundle = android.os.Bundle().apply {
                    textConfig.welcomeTitle?.let { putString("welcomeTitle", it) }
                    textConfig.welcomeSubtitle?.let { putString("welcomeSubtitle", it) }
                    textConfig.startButtonLabel?.let { putString("startButtonLabel", it) }
                    textConfig.startOVSEButtonLabel?.let { putString("startOVSEButtonLabel", it) }
                    textConfig.cancelButtonLabel?.let { putString("cancelButtonLabel", it) }
                    textConfig.ovseTitle?.let { putString("ovseTitle", it) }
                    textConfig.ovseSubtitle?.let { putString("ovseSubtitle", it) }
                    textConfig.ovseInputLabel?.let { putString("ovseInputLabel", it) }
                    textConfig.ovseInputPlaceholder?.let { putString("ovseInputPlaceholder", it) }
                    textConfig.ovseSubmitLabel?.let { putString("ovseSubmitLabel", it) }
                }
                putBundle("texts", textsBundle)
            }
        }
    }
    
    /**
     * Validate configuration
     */
    fun validate(): ValidationResult {
        val errors = mutableListOf<String>()
        
        if (mode != Mode.OVSE && token.isBlank()) {
            errors.add("Token cannot be empty")
        }
        
        val resolvedApiKey = ovse?.apiKey ?: apiKey
        if (resolvedApiKey.isBlank()) {
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
