/**
 * Success Screen
 * Displays successful verification result
 */

import { RouteProp, useRoute } from "@react-navigation/native";
import React, { useEffect } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import ThemeManager from "../theme/ThemeManager";
import type { VKYCResult } from "../types";
import NativeBridge from "../utils/NativeBridge";

type SuccessScreenRouteProp = RouteProp<{ Success: { result: VKYCResult } }, "Success">;

const SuccessScreen: React.FC = () => {
   const route = useRoute<SuccessScreenRouteProp>();
   const commonStyles = ThemeManager.getCommonStyles();
   const colors = ThemeManager.getColors();
   const result = route.params?.result;

   useEffect(() => {
      NativeBridge.trackScreen("Success");
   }, []);

   const handleDone = () => {
      NativeBridge.trackButtonClick("done", "Success");
      // The native side will handle closing the SDK
   };

   return (
      <View style={commonStyles.centerContainer}>
         <View style={styles.content}>
            <View style={[styles.successIcon, { backgroundColor: colors.success + "20" }]}>
               <Text style={styles.checkmark}>✓</Text>
            </View>

            <Text style={commonStyles.title}>Verification Successful!</Text>
            <Text style={commonStyles.subtitle}>Your identity has been successfully verified.</Text>

            {result?.sessionId && (
               <View style={styles.detailsContainer}>
                  <Text style={styles.detailLabel}>Session ID:</Text>
                  <Text style={styles.detailValue}>{result.sessionId}</Text>
               </View>
            )}

            {result?.verificationId && (
               <View style={styles.detailsContainer}>
                  <Text style={styles.detailLabel}>Verification ID:</Text>
                  <Text style={styles.detailValue}>{result.verificationId}</Text>
               </View>
            )}

            <TouchableOpacity style={[commonStyles.button, styles.doneButton]} onPress={handleDone} activeOpacity={0.8}>
               <Text style={commonStyles.buttonText}>Done</Text>
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
   successIcon: {
      width: 100,
      height: 100,
      borderRadius: 50,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 32,
   },
   checkmark: {
      fontSize: 60,
      color: "#48BB78",
      fontWeight: "700",
   },
   detailsContainer: {
      marginTop: 24,
      padding: 16,
      backgroundColor: "#F7FAFC",
      borderRadius: 8,
      width: "100%",
   },
   detailLabel: {
      fontSize: 12,
      color: "#718096",
      marginBottom: 4,
      textTransform: "uppercase",
      letterSpacing: 0.5,
   },
   detailValue: {
      fontSize: 14,
      color: "#1A202C",
      fontWeight: "600",
      fontFamily: "monospace",
   },
   doneButton: {
      marginTop: 48,
   },
});

export default SuccessScreen;
