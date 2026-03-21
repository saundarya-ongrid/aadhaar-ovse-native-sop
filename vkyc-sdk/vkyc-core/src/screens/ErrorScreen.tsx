/**
 * Error Screen
 * Displays error information and retry options
 */

import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import React, { useEffect } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import ThemeManager from "../theme/ThemeManager";
import { VKYCError } from "../types";
import NativeBridge from "../utils/NativeBridge";

type ErrorScreenRouteProp = RouteProp<{ Error: { error: VKYCError } }, "Error">;

const ErrorScreen: React.FC = () => {
   const route = useRoute<ErrorScreenRouteProp>();
   const navigation = useNavigation();
   const commonStyles = ThemeManager.getCommonStyles();
   const colors = ThemeManager.getColors();
   const error = route.params?.error;

   useEffect(() => {
      NativeBridge.trackScreen("Error");
      if (error) {
         NativeBridge.onFailure(error);
      }
   }, [error]);

   const handleRetry = () => {
      NativeBridge.trackButtonClick("retry", "Error");
      // Reset to welcome screen
      (navigation as any).reset({
         index: 0,
         routes: [{ name: "Welcome" }],
      });
   };

   const handleClose = () => {
      NativeBridge.trackButtonClick("close", "Error");
      NativeBridge.onCancel();
   };

   return (
      <View style={commonStyles.centerContainer}>
         <View style={styles.content}>
            <View style={[styles.errorIcon, { backgroundColor: colors.error + "20" }]}>
               <Text style={styles.errorSymbol}>✕</Text>
            </View>

            <Text style={commonStyles.title}>Verification Failed</Text>
            <Text style={commonStyles.subtitle}>{error?.message || "An error occurred during verification."}</Text>

            {error?.code && (
               <View style={styles.errorCodeContainer}>
                  <Text style={styles.errorCodeLabel}>Error Code:</Text>
                  <Text style={styles.errorCodeValue}>{error.code}</Text>
               </View>
            )}

            {error?.details && (
               <View style={styles.detailsContainer}>
                  <Text style={styles.detailsLabel}>Details:</Text>
                  <Text style={styles.detailsText}>
                     {typeof error.details === "string" ? error.details : JSON.stringify(error.details, null, 2)}
                  </Text>
               </View>
            )}

            <TouchableOpacity style={commonStyles.button} onPress={handleRetry} activeOpacity={0.8}>
               <Text style={commonStyles.buttonText}>Try Again</Text>
            </TouchableOpacity>

            <TouchableOpacity
               style={[commonStyles.secondaryButton, styles.closeButton]}
               onPress={handleClose}
               activeOpacity={0.8}
            >
               <Text style={commonStyles.secondaryButtonText}>Close</Text>
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
   },
   errorIcon: {
      width: 100,
      height: 100,
      borderRadius: 50,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 32,
   },
   errorSymbol: {
      fontSize: 60,
      color: "#F56565",
      fontWeight: "700",
   },
   errorCodeContainer: {
      marginTop: 24,
      padding: 12,
      backgroundColor: "#FFF5F5",
      borderRadius: 8,
      borderWidth: 1,
      borderColor: "#FEB2B2",
   },
   errorCodeLabel: {
      fontSize: 12,
      color: "#C53030",
      marginBottom: 4,
      fontWeight: "600",
   },
   errorCodeValue: {
      fontSize: 14,
      color: "#742A2A",
      fontFamily: "monospace",
   },
   detailsContainer: {
      marginTop: 16,
      padding: 12,
      backgroundColor: "#F7FAFC",
      borderRadius: 8,
      width: "100%",
      maxHeight: 150,
   },
   detailsLabel: {
      fontSize: 12,
      color: "#718096",
      marginBottom: 8,
      fontWeight: "600",
   },
   detailsText: {
      fontSize: 12,
      color: "#4A5568",
      fontFamily: "monospace",
   },
   closeButton: {
      marginTop: 16,
   },
});

export default ErrorScreen;
