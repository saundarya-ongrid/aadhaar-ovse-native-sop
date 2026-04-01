/**
 * Configuration Manager
 * Handles VKYC configuration passed from native wrappers
 */

import { OVSEConfig, SDKTextConfig, VKYCConfig, VKYCFeatures, VKYCTheme } from "../types";

class ConfigManager {
   private config: VKYCConfig | null = null;

   /**
    * Initialize configuration from props
    */
   initialize(props: any): void {
      console.log("[ConfigManager] Initializing with props:", props);

      if (!props) {
         throw new Error("Configuration props are required");
      }

      this.config = {
         token: props.token,
         apiKey: props.apiKey,
         environment: props.environment || "staging",
         mode: props.mode || "vkyc",
         ovse: this.parseOvse(props.ovse, props),
         texts: this.parseTexts(props.texts),
         theme: this.parseTheme(props.theme),
         features: this.parseFeatures(props.features),
         metadata: props.metadata || {},
      };

      this.validate();

      console.log("[ConfigManager] Configuration initialized:", this.config);
   }

   /**
    * Get configuration from native bridge
    */
   async getConfigFromNative(): Promise<VKYCConfig | null> {
      try {
         const { NativeModules } = require("react-native");

         if (NativeModules.VKYCModule && NativeModules.VKYCModule.getConfig) {
            const config = await NativeModules.VKYCModule.getConfig();
            return config;
         }

         return null;
      } catch (error) {
         console.error("[ConfigManager] Failed to get config from native:", error);
         return null;
      }
   }

   /**
    * Get configuration
    */
   getConfig(): VKYCConfig {
      if (!this.config) {
         throw new Error("Configuration not initialized");
      }
      return this.config;
   }

   /**
    * Get specific config value
    */
   get<K extends keyof VKYCConfig>(key: K): VKYCConfig[K] {
      return this.getConfig()[key];
   }

   /**
    * Get theme configuration
    */
   getTheme(): VKYCTheme {
      return this.get("theme") || this.getDefaultTheme();
   }

   /**
    * Get features configuration
    */
   getFeatures(): VKYCFeatures {
      return this.get("features") || this.getDefaultFeatures();
   }

   /**
    * Get API base URL based on environment
    */
   getApiBaseUrl(): string {
      if (this.config?.mode === "ovse" && this.config.ovse?.apiBaseUrl) {
         return this.config.ovse.apiBaseUrl;
      }

      const environment = this.get("environment");

      if (environment === "production") {
         return "https://api.vkyc.com/v1";
      } else {
         return "https://api-staging.vkyc.com/v1";
      }
   }

   /**
    * Parse OVSE options from props
    */
   private parseOvse(ovse: any, props: any): OVSEConfig | undefined {
      if (!ovse && props.mode !== "ovse") return undefined;

      return {
         apiBaseUrl: ovse?.apiBaseUrl,
         apiKey: ovse?.apiKey || props.apiKey,
         initialApiKey: ovse?.initialApiKey,
         channelType: ovse?.channelType || "APP",
         templateId: ovse?.templateId || "1",
         expiryTimeInSeconds: ovse?.expiryTimeInSeconds || 3600,
         consent: ovse?.consent || "Y",
         appPackageId: ovse?.appPackageId,
         appSignature: ovse?.appSignature,
         pollingIntervalMs: ovse?.pollingIntervalMs || 5000,
         maxPollAttempts: ovse?.maxPollAttempts || 60,
      };
   }

   /**
    * Parse UI text customizations from props
    */
   private parseTexts(texts: any): SDKTextConfig | undefined {
      if (!texts) return undefined;

      return {
         welcomeTitle: texts.welcomeTitle,
         welcomeSubtitle: texts.welcomeSubtitle,
         startButtonLabel: texts.startButtonLabel,
         startOVSEButtonLabel: texts.startOVSEButtonLabel,
         cancelButtonLabel: texts.cancelButtonLabel,
         ovseTitle: texts.ovseTitle,
         ovseSubtitle: texts.ovseSubtitle,
         ovseInputLabel: texts.ovseInputLabel,
         ovseInputPlaceholder: texts.ovseInputPlaceholder,
         ovseSubmitLabel: texts.ovseSubmitLabel,
      };
   }

   /**
    * Check if specific feature is enabled
    */
   isFeatureEnabled(feature: keyof VKYCFeatures): boolean {
      const features = this.getFeatures();
      return features[feature] === true;
   }

   /**
    * Parse theme from props
    */
   private parseTheme(theme: any): VKYCTheme | undefined {
      if (!theme) return undefined;

      return {
         primaryColor: theme.primaryColor || "#667eea",
         secondaryColor: theme.secondaryColor,
         textColor: theme.textColor,
         backgroundColor: theme.backgroundColor,
         fontFamily: theme.fontFamily,
         buttonRadius: theme.buttonRadius,
      };
   }

   /**
    * Parse features from props
    */
   private parseFeatures(features: any): VKYCFeatures | undefined {
      if (!features) return undefined;

      return {
         videoEnabled: features.videoEnabled !== false,
         autoCapture: features.autoCapture,
         livenessCheck: features.livenessCheck,
         documentVerification: features.documentVerification,
         faceMatch: features.faceMatch,
         audioEnabled: features.audioEnabled,
         screenRecording: features.screenRecording,
      };
   }

   /**
    * Get default theme
    */
   private getDefaultTheme(): VKYCTheme {
      return {
         primaryColor: "#667eea",
         secondaryColor: "#764ba2",
         textColor: "#333333",
         backgroundColor: "#FFFFFF",
         buttonRadius: 8,
      };
   }

   /**
    * Get default features
    */
   private getDefaultFeatures(): VKYCFeatures {
      return {
         videoEnabled: true,
         autoCapture: false,
         livenessCheck: true,
         documentVerification: true,
         faceMatch: true,
         audioEnabled: true,
         screenRecording: false,
      };
   }

   /**
    * Validate configuration
    */
   private validate(): void {
      if (!this.config) {
         throw new Error("Configuration is null");
      }

      if (this.config.mode !== "ovse" && (!this.config.token || this.config.token.trim() === "")) {
         throw new Error("Token is required");
      }

      const resolvedApiKey = this.config.ovse?.apiKey || this.config.apiKey;
      if (!resolvedApiKey || resolvedApiKey.trim() === "") {
         throw new Error("API Key is required");
      }

      if (!["staging", "production"].includes(this.config.environment)) {
         throw new Error("Environment must be staging or production");
      }

      if (this.config.mode && !["vkyc", "ovse"].includes(this.config.mode)) {
         throw new Error("Mode must be vkyc or ovse");
      }

      // Validate theme colors if provided
      if (this.config.theme) {
         const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{8})$/;

         if (!colorRegex.test(this.config.theme.primaryColor)) {
            throw new Error("Invalid primary color format");
         }
      }

      console.log("[ConfigManager] Configuration validated successfully");
   }

   /**
    * Reset configuration
    */
   reset(): void {
      this.config = null;
   }
}

// Export singleton instance
export default new ConfigManager();
