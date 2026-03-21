/**
 * Native Bridge
 * Communicates with native Android/iOS code
 * Provides callback registration and event system
 */

import { DeviceEventEmitter, NativeEventEmitter, NativeModules, Platform } from "react-native";
import { ErrorCode, VKYCError } from "../types";

const { VKYCModule } = NativeModules;

if (!VKYCModule) {
   console.warn("[NativeBridge] VKYCModule not found - running in standalone mode");
}

// Native event emitter
const eventEmitter = Platform.OS === "ios" && VKYCModule ? new NativeEventEmitter(VKYCModule) : DeviceEventEmitter;

type CallbackFunction = (...args: any[]) => void;

interface Callbacks {
   onSuccess?: CallbackFunction;
   onFailure?: CallbackFunction;
   onCancel?: CallbackFunction;
   onEvent?: CallbackFunction;
   onProgress?: CallbackFunction;
}

class NativeBridge {
   private callbacks: Callbacks = {};
   private eventListeners: any[] = [];

   /**
    * Register callbacks for native events
    */
   registerCallbacks(callbacks: Callbacks): void {
      console.log("[NativeBridge] Registering callbacks:", Object.keys(callbacks));
      this.callbacks = { ...this.callbacks, ...callbacks };

      // Set up event listeners for native-to-JS communication
      this.setupEventListeners();
   }

   /**
    * Setup event listeners for native events
    */
   private setupEventListeners(): void {
      // Clear existing listeners
      this.removeEventListeners();

      // Listen for native events
      const events = ["VKYC_SUCCESS", "VKYC_FAILURE", "VKYC_CANCEL", "VKYC_EVENT", "VKYC_PROGRESS"];

      events.forEach((eventName) => {
         const listener = eventEmitter.addListener(eventName, (data: any) => {
            console.log(`[NativeBridge] Received event: ${eventName}`, data);
            this.handleNativeEvent(eventName, data);
         });
         this.eventListeners.push(listener);
      });
   }

   /**
    * Handle events from native side
    */
   private handleNativeEvent(eventName: string, data: any): void {
      switch (eventName) {
         case "VKYC_SUCCESS":
            this.callbacks.onSuccess?.(data);
            break;
         case "VKYC_FAILURE":
            this.callbacks.onFailure?.(data);
            break;
         case "VKYC_CANCEL":
            this.callbacks.onCancel?.();
            break;
         case "VKYC_EVENT":
            this.callbacks.onEvent?.(data.event, data.metadata);
            break;
         case "VKYC_PROGRESS":
            this.callbacks.onProgress?.(data.current, data.total);
            break;
      }
   }

   /**
    * Remove all event listeners
    */
   removeEventListeners(): void {
      this.eventListeners.forEach((listener) => {
         listener.remove();
      });
      this.eventListeners = [];
   }

   /**
    * Clear all callbacks
    */
   clearCallbacks(): void {
      this.callbacks = {};
      this.removeEventListeners();
   }
   /**
    * Notify native that VKYC completed successfully
    */
   onSuccess(result: Record<string, any>): void {
      console.log("[NativeBridge] onSuccess:", result);

      try {
         if (VKYCModule && VKYCModule.onSuccess) {
            VKYCModule.onSuccess(result);
         } else {
            console.warn("[NativeBridge] VKYCModule.onSuccess not available");
         }
      } catch (error) {
         console.error("[NativeBridge] Error calling onSuccess:", error);
      }
   }

   /**
    * Notify native that VKYC failed
    */
   onFailure(error: VKYCError): void {
      console.log("[NativeBridge] onFailure:", error);

      try {
         if (VKYCModule && VKYCModule.onFailure) {
            VKYCModule.onFailure(error.code, error.message, error.details || null);
         } else {
            console.warn("[NativeBridge] VKYCModule.onFailure not available");
         }
      } catch (err) {
         console.error("[NativeBridge] Error calling onFailure:", err);
      }
   }

   /**
    * Notify native that user cancelled VKYC
    */
   onCancel(): void {
      console.log("[NativeBridge] onCancel");

      try {
         if (VKYCModule && VKYCModule.onCancel) {
            VKYCModule.onCancel();
         } else {
            console.warn("[NativeBridge] VKYCModule.onCancel not available");
         }
      } catch (error) {
         console.error("[NativeBridge] Error calling onCancel:", error);
      }
   }

   /**
    * Send tracking event to native
    */
   onEvent(eventName: string, metadata?: Record<string, any>): void {
      console.log("[NativeBridge] onEvent:", eventName, metadata);

      try {
         if (VKYCModule && VKYCModule.onEvent) {
            VKYCModule.onEvent(eventName, metadata || {});
         } else {
            // Just log if native module not available
            console.log("[NativeBridge] Event:", eventName, metadata);
         }
      } catch (error) {
         console.error("[NativeBridge] Error calling onEvent:", error);
      }
   }

   /**
    * Close VKYC flow (dismiss native view)
    */
   close(): void {
      console.log("[NativeBridge] close");

      try {
         if (VKYCModule && VKYCModule.close) {
            VKYCModule.close();
         } else {
            console.warn("[NativeBridge] VKYCModule.close not available");
         }
      } catch (error) {
         console.error("[NativeBridge] Error calling close:", error);
      }
   }

   /**
    * Send progress update to native
    */
   onProgress(current: number, total: number): void {
      console.log(`[NativeBridge] onProgress: ${current}/${total}`);

      try {
         if (VKYCModule && VKYCModule.onProgress) {
            VKYCModule.onProgress(current, total);
         }
      } catch (error) {
         console.error("[NativeBridge] Error calling onProgress:", error);
      }
   }

   /**
    * Get configuration from native
    */
   async getConfig(): Promise<any> {
      console.log("[NativeBridge] getConfig");

      try {
         if (VKYCModule && VKYCModule.getConfig) {
            return await VKYCModule.getConfig();
         }
         return null;
      } catch (error) {
         console.error("[NativeBridge] Error calling getConfig:", error);
         return null;
      }
   }

   /**
    * Get SDK version from native
    */
   async getSDKVersion(): Promise<string> {
      try {
         if (VKYCModule && VKYCModule.getSDKVersion) {
            return await VKYCModule.getSDKVersion();
         }
         return "1.0.0";
      } catch (error) {
         console.error("[NativeBridge] Error getting SDK version:", error);
         return "1.0.0";
      }
   }

   /**
    * Check if running in native context
    */
   isNativeContext(): boolean {
      return VKYCModule != null;
   }

   /**
    * Get platform
    */
   getPlatform(): "android" | "ios" | "web" {
      return Platform.OS as any;
   }

   /**
    * Track screen view event
    */
   trackScreen(screenName: string): void {
      this.onEvent("screen_viewed", {
         screenName,
         timestamp: Date.now(),
      });
   }

   /**
    * Track button click event
    */
   trackButtonClick(buttonId: string, screenName?: string): void {
      this.onEvent("button_clicked", {
         buttonId,
         screenName,
         timestamp: Date.now(),
      });
   }

   /**
    * Track error event
    */
   trackError(error: VKYCError, screenName?: string): void {
      this.onEvent("error_occurred", {
         errorCode: error.code,
         errorMessage: error.message,
         screenName,
         timestamp: Date.now(),
      });
   }

   /**
    * Create error helper
    */
   createError(code: ErrorCode, message: string, details?: any): VKYCError {
      return {
         code,
         message,
         details,
      };
   }

   /**
    * Launch Aadhaar app for OVSE verification
    * Android: Uses Intent with action "in.gov.uidai.pehchaan.INTENT_REQUEST"
    * iOS: Uses URL scheme "pehchan://in.gov.uidai.pehchan"
    */
   async launchAadhaarApp(jwtToken: string): Promise<void> {
      console.log("[NativeBridge] launchAadhaarApp");

      try {
         if (VKYCModule && VKYCModule.launchAadhaarApp) {
            await VKYCModule.launchAadhaarApp(jwtToken);
         } else {
            throw new Error("VKYCModule.launchAadhaarApp not available");
         }
      } catch (error: any) {
         console.error("[NativeBridge] Error launching Aadhaar app:", error);
         throw new Error(error.message || "Failed to launch Aadhaar app");
      }
   }
}

// Export singleton instance
export default new NativeBridge();
