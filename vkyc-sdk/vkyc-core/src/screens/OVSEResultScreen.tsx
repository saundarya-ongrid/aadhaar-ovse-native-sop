/**
 * OVSE Result Screen
 * Displays the verification result
 */

import { RouteProp, useRoute } from "@react-navigation/native";
import React, { useEffect } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import NativeBridge from "../utils/NativeBridge";

type OVSEResultRouteProp = RouteProp<{ OVSEResult: { status: any; transactionId: string } }, "OVSEResult">;

const OVSEResultScreen: React.FC = () => {
   const route = useRoute<OVSEResultRouteProp>();
   const { status, transactionId } = route.params || {};

   const responseCode = status?.data?.code;
   const responseMessage = status?.data?.message || status?.message;
   const isSuccess = responseCode === "1001" || responseCode === 1001;
   const resultData = status?.data?.ovse_data || status?.data;
   const hasData = resultData && Object.keys(resultData).length > 0;

   useEffect(() => {
      NativeBridge.trackScreen("OVSEResult");

      if (isSuccess) {
         NativeBridge.onSuccess({
            transactionId,
            code: responseCode,
            data: resultData,
         });
      } else {
         NativeBridge.onFailure({
            code: responseCode || "UNKNOWN",
            message: responseMessage || "Verification failed",
         });
      }
   }, []);

   const handleDone = () => {
      NativeBridge.trackButtonClick("done", "OVSEResult");
      NativeBridge.close();
   };

   return (
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
         <View style={styles.content}>
            <View
               style={[
                  styles.statusIcon,
                  {
                     backgroundColor: isSuccess ? "rgba(81, 207, 102, 0.2)" : "rgba(255, 107, 107, 0.2)",
                  },
               ]}
            >
               <Text style={[styles.checkmark, !isSuccess && styles.checkmarkError]}>{isSuccess ? "✓" : "✕"}</Text>
            </View>

            <Text style={styles.title}>{isSuccess ? "Verification Complete" : "Verification Status"}</Text>
            <Text style={styles.subtitle}>{responseMessage || "No message"}</Text>

            <View style={styles.detailsContainer}>
               <Text style={styles.detailLabel}>Status Code:</Text>
               <Text style={[styles.detailValue, styles.codeText]}>{responseCode || "N/A"}</Text>
            </View>

            <View style={styles.detailsContainer}>
               <Text style={styles.detailLabel}>Transaction ID:</Text>
               <Text style={styles.detailValue}>{transactionId}</Text>
            </View>

            {status?.request_id && (
               <View style={styles.detailsContainer}>
                  <Text style={styles.detailLabel}>Request ID:</Text>
                  <Text style={styles.detailValue}>{status.request_id}</Text>
               </View>
            )}

            {hasData && (
               <View style={styles.dataContainer}>
                  <Text style={styles.dataLabel}>Response Data:</Text>
                  <View style={styles.dataBox}>
                     <Text style={styles.dataText}>{JSON.stringify(resultData, null, 2)}</Text>
                  </View>
               </View>
            )}

            <TouchableOpacity style={styles.doneButton} onPress={handleDone} activeOpacity={0.8}>
               <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
         </View>
      </ScrollView>
   );
};

const styles = StyleSheet.create({
   container: {
      flex: 1,
      backgroundColor: "#667eea",
   },
   scrollContent: {
      flexGrow: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingVertical: 24,
   },
   content: {
      width: "100%",
      maxWidth: 400,
      alignItems: "center",
      paddingHorizontal: 20,
   },
   statusIcon: {
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
   checkmarkError: {
      color: "#ff6b6b",
   },
   title: {
      color: "#fff",
      fontSize: 24,
      fontWeight: "700",
      textAlign: "center",
      marginBottom: 8,
   },
   subtitle: {
      color: "rgba(255, 255, 255, 0.9)",
      textAlign: "center",
      marginBottom: 10,
   },
   detailsContainer: {
      marginTop: 20,
      padding: 16,
      backgroundColor: "rgba(255, 255, 255, 0.15)",
      borderRadius: 12,
      width: "100%",
   },
   detailLabel: {
      fontSize: 12,
      color: "rgba(255, 255, 255, 0.7)",
      marginBottom: 4,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      fontWeight: "600",
   },
   detailValue: {
      fontSize: 14,
      color: "#fff",
      fontWeight: "600",
      fontFamily: "monospace",
   },
   codeText: {
      color: "#ffd43b",
      fontSize: 16,
   },
   dataContainer: {
      marginTop: 20,
      width: "100%",
   },
   dataLabel: {
      fontSize: 12,
      color: "rgba(255, 255, 255, 0.7)",
      marginBottom: 8,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      fontWeight: "600",
   },
   dataBox: {
      padding: 16,
      backgroundColor: "rgba(0, 0, 0, 0.65)",
      borderRadius: 12,
      maxHeight: 220,
   },
   dataText: {
      fontSize: 12,
      color: "#E2E8F0",
      fontFamily: "monospace",
      lineHeight: 18,
   },
   doneButton: {
      marginTop: 32,
      backgroundColor: "#4facfe",
      borderRadius: 12,
      paddingVertical: 14,
      paddingHorizontal: 36,
   },
   doneButtonText: {
      color: "#fff",
      fontWeight: "700",
      fontSize: 16,
   },
});

export default OVSEResultScreen;
