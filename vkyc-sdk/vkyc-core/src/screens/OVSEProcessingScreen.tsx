/**
 * OVSE Processing Screen
 * Launches Aadhaar app and polls for verification status
 */

import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useDispatch } from "react-redux";
import OVSEAPIService from "../services/OVSEAPIService";
import { setLoading } from "../store";
import ThemeManager from "../theme/ThemeManager";
import { ErrorCode } from "../types";
import NativeBridge from "../utils/NativeBridge";

type OVSEProcessingRouteProp = RouteProp<
   { OVSEProcessing: { sessionId: string; transactionId: string; jwtToken: string } },
   "OVSEProcessing"
>;

const OVSEProcessingScreen: React.FC = () => {
   const navigation = useNavigation();
   const route = useRoute<OVSEProcessingRouteProp>();
   const dispatch = useDispatch();
   const commonStyles = ThemeManager.getCommonStyles();
   const colors = ThemeManager.getColors();

   const { sessionId, transactionId, jwtToken } = route.params || {};

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

         NativeBridge.onEvent("ovse_polling_started", {
            sessionId,
            transactionId,
         });

         // Poll status every 5 seconds
         let attempt = 0;
         const maxAttempts = 60; // 5 minutes
         const intervalMs = 5000;

         const pollInterval = setInterval(async () => {
            try {
               attempt++;
               setPollCount(attempt);

               const status = await OVSEAPIService.checkStatus(sessionId, transactionId);

               NativeBridge.onEvent("ovse_status_checked", {
                  attempt,
                  code: status.code,
               });

               // Check if callback received
               if (status.code !== "CALLBACK_NOT_YET_RECEIVED") {
                  clearInterval(pollInterval);

                  // Navigate to result screen
                  (navigation as any).navigate("OVSEResult", {
                     status,
                     sessionId,
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
      <View style={commonStyles.centerContainer}>
         <View style={styles.content}>
            <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />

            <Text style={commonStyles.title}>Processing Verification</Text>
            <Text style={[commonStyles.subtitle, styles.statusText]}>{statusText}</Text>

            {isPolling && (
               <View style={styles.pollingInfo}>
                  <Text style={styles.pollingText}>Checking status... (Attempt {pollCount}/60)</Text>
                  <Text style={styles.pollingNote}>
                     This may take a few moments. Please complete the verification in the Aadhaar app.
                  </Text>
               </View>
            )}

            <View style={styles.instructionBox}>
               <Text style={styles.instructionTitle}>📱 Instructions:</Text>
               <Text style={styles.instructionText}>1. Complete the verification in the Aadhaar app</Text>
               <Text style={styles.instructionText}>2. Return to this app after completion</Text>
               <Text style={styles.instructionText}>3. We'll automatically detect when you're done</Text>
            </View>

            <TouchableOpacity
               style={[commonStyles.secondaryButton, styles.cancelButton]}
               onPress={handleCancel}
               activeOpacity={0.8}
            >
               <Text style={commonStyles.secondaryButtonText}>Cancel Verification</Text>
            </TouchableOpacity>
         </View>
      </View>
   );
};

const styles = StyleSheet.create({
   content: {
      width: "100%",
      maxWidth: 400,
      alignItems: "center",
      paddingHorizontal: 20,
   },
   loader: {
      marginBottom: 32,
   },
   statusText: {
      marginTop: 16,
      fontStyle: "italic",
   },
   pollingInfo: {
      marginTop: 32,
      width: "100%",
      alignItems: "center",
   },
   pollingText: {
      fontSize: 14,
      color: "#4A5568",
      fontWeight: "600",
      marginBottom: 8,
   },
   pollingNote: {
      fontSize: 12,
      color: "#718096",
      textAlign: "center",
      lineHeight: 18,
   },
   instructionBox: {
      marginTop: 32,
      padding: 20,
      backgroundColor: "#F7FAFC",
      borderRadius: 12,
      borderWidth: 1,
      borderColor: "#E2E8F0",
      width: "100%",
   },
   instructionTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: "#1A202C",
      marginBottom: 16,
   },
   instructionText: {
      fontSize: 14,
      color: "#4A5568",
      lineHeight: 22,
      marginBottom: 8,
   },
   cancelButton: {
      marginTop: 32,
   },
});

export default OVSEProcessingScreen;
