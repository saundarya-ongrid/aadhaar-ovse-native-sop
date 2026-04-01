/**
 * OVSE Processing Screen
 * Launches Aadhaar app and polls for verification status
 */

import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDispatch } from "react-redux";
import ConfigManager from "../config/ConfigManager";
import OVSEAPIService from "../services/OVSEAPIService";
import { setLoading } from "../store";
import ThemeManager from "../theme/ThemeManager";
import { ErrorCode } from "../types";
import NativeBridge from "../utils/NativeBridge";

type OVSEProcessingRouteProp = RouteProp<
   { OVSEProcessing: { apiKey: string; transactionId: string; jwtToken: string } },
   "OVSEProcessing"
>;

const OVSEProcessingScreen: React.FC = () => {
   const navigation = useNavigation();
   const route = useRoute<OVSEProcessingRouteProp>();
   const dispatch = useDispatch();
   const colors = ThemeManager.getColors();

   const { apiKey, transactionId, jwtToken } = route.params || {};
   const config = ConfigManager.getConfig();
   const ovseConfig = config.ovse;
   const maxAttempts = ovseConfig?.maxPollAttempts || 60;

   const [statusText, setStatusText] = useState("Launching Aadhaar app...");
   const [isPolling, setIsPolling] = useState(false);
   const [pollCount, setPollCount] = useState(0);

   useEffect(() => {
      NativeBridge.trackScreen("OVSEProcessing");
      launchAadhaarApp();
   }, []);

   const launchAadhaarApp = async () => {
      try {
         setStatusText("Launching Aadhaar app...");

         // Launch Aadhaar app via native bridge
         NativeBridge.onEvent("ovse_launching_aadhaar", {
            transactionId,
            hasToken: !!jwtToken,
         });

         // Call native method to launch Aadhaar app
         await NativeBridge.launchAadhaarApp(jwtToken);

         // Start polling after a short delay
         setTimeout(() => {
            startPolling();
         }, 2000);
      } catch (error: any) {
         console.error("Failed to launch Aadhaar app:", error);

         const errorObj = {
            code: ErrorCode.UNKNOWN_ERROR,
            message: error.message || "Failed to launch Aadhaar app",
            details: error,
         };

         NativeBridge.trackError(errorObj, "OVSEProcessing");

         (navigation as any).navigate("Error", { error: errorObj });
      }
   };

   const startPolling = async () => {
      try {
         setIsPolling(true);
         setStatusText("Waiting for verification...");

         dispatch(setLoading(true));

         NativeBridge.onEvent("ovse_polling_started", { transactionId });

         // Poll status every 5 seconds
         let attempt = 0;
         const intervalMs = ovseConfig?.pollingIntervalMs || 5000;

         const pollInterval = setInterval(async () => {
            try {
               attempt++;
               setPollCount(attempt);

               const status = await OVSEAPIService.checkStatus(apiKey, transactionId);

               NativeBridge.onEvent("ovse_status_checked", {
                  attempt,
                  code: status?.data?.code,
               });

               // Check if callback received
               if (status?.data?.code === "1001" || status?.data?.code === 1001) {
                  clearInterval(pollInterval);

                  // Navigate to result screen
                  (navigation as any).navigate("OVSEResult", {
                     status,
                     transactionId,
                  });
               } else if (attempt >= maxAttempts) {
                  clearInterval(pollInterval);

                  const timeoutError = {
                     code: ErrorCode.TIMEOUT,
                     message: "Verification timeout - please try again",
                  };

                  NativeBridge.trackError(timeoutError, "OVSEProcessing");

                  (navigation as any).navigate("Error", { error: timeoutError });
               }
            } catch (error: any) {
               clearInterval(pollInterval);

               const errorObj = {
                  code: ErrorCode.API_ERROR,
                  message: error.message || "Failed to check status",
                  details: error,
               };

               NativeBridge.trackError(errorObj, "OVSEProcessing");

               (navigation as any).navigate("Error", { error: errorObj });
            }
         }, intervalMs);
      } catch (error: any) {
         console.error("Polling failed:", error);

         const errorObj = {
            code: ErrorCode.UNKNOWN_ERROR,
            message: error.message || "Polling failed",
            details: error,
         };

         NativeBridge.trackError(errorObj, "OVSEProcessing");

         (navigation as any).navigate("Error", { error: errorObj });
      } finally {
         setIsPolling(false);
         dispatch(setLoading(false));
      }
   };

   const handleCancel = () => {
      NativeBridge.trackButtonClick("cancel_polling", "OVSEProcessing");
      NativeBridge.onCancel();
      navigation.goBack();
   };

   return (
      <SafeAreaView style={styles.safeArea}>
         <View style={styles.container}>
            <View style={styles.statusCard}>
               <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
               <Text style={styles.title}>Processing Verification</Text>
               <Text style={styles.statusText}>{statusText}</Text>

               {isPolling && (
                  <View style={styles.pollIndicator}>
                     <ActivityIndicator color="#4facfe" style={styles.pollSpinner} />
                     <Text style={styles.pollText}>
                        Poll {pollCount}/{maxAttempts}
                     </Text>
                  </View>
               )}
            </View>

            <View style={styles.instructionBox}>
               <Text style={styles.instructionTitle}>Instructions</Text>
               <Text style={styles.instructionText}>1. Complete the verification in the Aadhaar app</Text>
               <Text style={styles.instructionText}>2. Return to this app after completion</Text>
               <Text style={styles.instructionText}>3. We will detect success automatically</Text>
            </View>

            <TouchableOpacity style={styles.cancelButton} onPress={handleCancel} activeOpacity={0.8}>
               <Text style={styles.cancelButtonText}>Cancel Verification</Text>
            </TouchableOpacity>
         </View>
      </SafeAreaView>
   );
};

const styles = StyleSheet.create({
   safeArea: {
      flex: 1,
      backgroundColor: "#667eea",
   },
   container: {
      flex: 1,
      justifyContent: "center",
      paddingHorizontal: 20,
   },
   statusCard: {
      backgroundColor: "rgba(255, 255, 255, 0.15)",
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
   },
   loader: {
      marginBottom: 20,
   },
   title: {
      color: "#fff",
      fontSize: 22,
      fontWeight: "700",
      marginBottom: 10,
      textAlign: "center",
   },
   statusText: {
      color: "rgba(255, 255, 255, 0.9)",
      fontSize: 14,
      textAlign: "center",
   },
   pollIndicator: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      marginTop: 14,
   },
   pollSpinner: {
      marginRight: 8,
   },
   pollText: {
      color: "#4facfe",
      fontSize: 14,
      fontWeight: "600",
   },
   instructionBox: {
      backgroundColor: "rgba(255, 255, 255, 0.15)",
      borderRadius: 16,
      padding: 16,
   },
   instructionTitle: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "700",
      marginBottom: 8,
   },
   instructionText: {
      fontSize: 14,
      color: "rgba(255, 255, 255, 0.9)",
      marginBottom: 4,
   },
   cancelButton: {
      backgroundColor: "#ff6b6b",
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: "center",
      marginTop: 20,
   },
   cancelButtonText: {
      color: "#fff",
      fontWeight: "700",
      fontSize: 15,
   },
});

export default OVSEProcessingScreen;
