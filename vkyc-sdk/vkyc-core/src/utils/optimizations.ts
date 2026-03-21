/**
 * Production Optimizations
 * Performance monitoring and optimization utilities
 */

import { Dimensions, Platform } from "react-native";

/**
 * Performance monitoring class
 */
class PerformanceMonitor {
   private marks: Map<string, number> = new Map();
   private measures: Map<string, number> = new Map();

   /**
    * Mark the start of a performance measurement
    */
   mark(name: string): void {
      if (__DEV__) {
         this.marks.set(name, Date.now());
      }
   }

   /**
    * Measure the time since a mark was set
    */
   measure(name: string, startMark: string): number {
      if (!__DEV__) return 0;

      const start = this.marks.get(startMark);
      if (!start) {
         console.warn(`[Performance] Start mark "${startMark}" not found`);
         return 0;
      }

      const duration = Date.now() - start;
      this.measures.set(name, duration);

      if (duration > 100) {
         console.warn(`[Performance] ${name} took ${duration.toFixed(2)}ms`);
      }

      return duration;
   }

   /**
    * Clear all marks and measures
    */
   clear(): void {
      this.marks.clear();
      this.measures.clear();
   }

   /**
    * Get all measures
    */
   getMeasures(): Map<string, number> {
      return this.measures;
   }

   /**
    * Log performance summary
    */
   logSummary(): void {
      if (!__DEV__) return;

      console.log("[Performance Summary]");
      this.measures.forEach((duration, name) => {
         console.log(`  ${name}: ${duration.toFixed(2)}ms`);
      });
   }
}

export const performanceMonitor = new PerformanceMonitor();

/**
 * Device capabilities for optimization decisions
 */
export const deviceCapabilities = {
   isLowEndDevice: () => {
      // Consider device low-end if width < 375 or Android with low memory
      const { width } = Dimensions.get("window");
      return width < 375 || (Platform.OS === "android" && Platform.Version < 28);
   },

   shouldUseReducedMotion: () => {
      // Reduce motion on low-end devices
      return deviceCapabilities.isLowEndDevice();
   },

   shouldUseReducedQuality: () => {
      // Use reduced quality images/videos on low-end devices
      return deviceCapabilities.isLowEndDevice();
   },

   getOptimalImageQuality: () => {
      return deviceCapabilities.isLowEndDevice() ? 0.7 : 0.9;
   },

   getOptimalVideoQuality: () => {
      return deviceCapabilities.isLowEndDevice() ? "720p" : "1080p";
   },
};

/**
 * Memory management utilities
 */
export const memoryManager = {
   /**
    * Clear cached data when memory is low
    */
   clearCaches: () => {
      if (__DEV__) {
         console.log("[Memory] Clearing caches");
      }
      // Clear image caches, API caches, etc.
   },

   /**
    * Monitor memory usage
    */
   monitorMemory: () => {
      if (!__DEV__) return;

      // React Native doesn't expose memory APIs directly
      // This would need native bridge implementation
      console.log("[Memory] Monitor not implemented - requires native bridge");
   },
};

/**
 * Network optimization utilities
 */
export const networkOptimizer = {
   /**
    * Determine optimal timeout based on connection
    */
   getOptimalTimeout: (): number => {
      // Default: 30 seconds
      // Could be adjusted based on NetInfo connection type
      return 30000;
   },

   /**
    * Determine if should use compression
    */
   shouldUseCompression: (): boolean => {
      // Always use compression for production
      return !__DEV__;
   },

   /**
    * Get optimal chunk size for uploads
    */
   getOptimalChunkSize: (): number => {
      // 512KB chunks for mobile
      return 512 * 1024;
   },
};

/**
 * Bundle size optimization utilities
 */
export const bundleOptimizer = {
   /**
    * Lazy load a component
    */
   lazyLoad: (importFunc: () => Promise<any>) => {
      // Would use React.lazy in proper implementation
      return importFunc;
   },

   /**
    * Check if feature should be loaded
    */
   shouldLoadFeature: (featureName: string): boolean => {
      // Could implement feature flags here
      return true;
   },
};

/**
 * Redux state optimization utilities
 */
export const stateOptimizer = {
   /**
    * Normalize data for Redux state
    */
   normalize: (data: any) => {
      // Implement normalizr pattern if needed
      return data;
   },

   /**
    * Denormalize data from Redux state
    */
   denormalize: (normalizedData: any) => {
      // Reverse of normalize
      return normalizedData;
   },

   /**
    * Check if state update is necessary
    */
   shouldUpdate: (prevState: any, nextState: any): boolean => {
      // Shallow equality check
      return prevState !== nextState;
   },
};

/**
 * Initialize production optimizations
 */
export const initializeOptimizations = () => {
   if (!__DEV__) {
      // Disable console logs in production
      console.log = () => {};
      console.debug = () => {};
      console.info = () => {};

      // Keep console.warn and console.error for critical issues
   }

   // Monitor device capabilities
   if (__DEV__) {
      console.log("[Optimizations] Device Capabilities:", {
         isLowEnd: deviceCapabilities.isLowEndDevice(),
         platform: Platform.OS,
         version: Platform.Version,
      });
   }
};
