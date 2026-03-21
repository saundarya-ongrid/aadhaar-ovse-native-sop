/**
 * Main App Component
 * Entry point for the VKYC React Native core
 */

import { NavigationContainer } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { Provider, useDispatch } from "react-redux";
import ConfigManager from "./config/ConfigManager";
import AppNavigator from "./navigation/AppNavigator";
import { setConfig, store } from "./store";
import { VKYCConfig } from "./types";
import NativeBridge from "./utils/NativeBridge";
import { initializeOptimizations, performanceMonitor } from "./utils/optimizations";

// Initialize production optimizations
initializeOptimizations();

interface AppProps {
   // Props passed from native side via initialProperties
   initialProps?: VKYCConfig;
}

const AppContent: React.FC<AppProps> = ({ initialProps }) => {
   const [isReady, setIsReady] = useState(false);
   const [error, setError] = useState<string | null>(null);
   const dispatch = useDispatch();

   useEffect(() => {
      initializeApp();

      // Cleanup on unmount
      return () => {
         NativeBridge.clearCallbacks();
         performanceMonitor.clear();
      };
   }, [initialProps]);

   const initializeApp = async () => {
      performanceMonitor.mark("app-init-start");

      try {
         // Initialize ConfigManager with props from native
         if (initialProps) {
            ConfigManager.initialize(initialProps);
         } else {
            // Try to get config from native bridge if not passed as props
            const nativeConfig = await ConfigManager.getConfigFromNative();
            if (nativeConfig) {
               ConfigManager.initialize(nativeConfig);
            } else {
               throw new Error("No configuration provided from native side");
            }
         }

         // Get the validated config
         const config = ConfigManager.getConfig();
         if (!config) {
            throw new Error("Failed to initialize configuration");
         }

         // Store config in Redux store
         dispatch(setConfig(config));

         performanceMonitor.measure("app-init-complete", "app-init-start");
         performanceMonitor.logSummary();

         // Mark app as ready
         setIsReady(true);
      } catch (err: any) {
         console.error("App initialization failed:", err);
         setError(err.message || "Initialization failed");
      }
   };

   // Show loading state
   if (!isReady && !error) {
      return (
         <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4299E1" />
            <Text style={styles.loadingText}>Initializing VKYC...</Text>
         </View>
      );
   }

   // Show error state
   if (error) {
      return (
         <View style={styles.errorContainer}>
            <Text style={styles.errorTitle}>Initialization Error</Text>
            <Text style={styles.errorMessage}>{error}</Text>
         </View>
      );
   }

   // Show main app with navigation
   return (
      <NavigationContainer>
         <AppNavigator />
      </NavigationContainer>
   );
};

const App: React.FC<AppProps> = (props) => {
   return (
      <Provider store={store}>
         <AppContent {...props} />
      </Provider>
   );
};

const styles = StyleSheet.create({
   loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#FFFFFF",
   },
   loadingText: {
      marginTop: 16,
      fontSize: 16,
      color: "#4A5568",
   },
   errorContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#FFFFFF",
      padding: 24,
   },
   errorTitle: {
      fontSize: 24,
      fontWeight: "700",
      color: "#F56565",
      marginBottom: 16,
   },
   errorMessage: {
      fontSize: 16,
      color: "#4A5568",
      textAlign: "center",
      lineHeight: 24,
   },
});

export default App;
