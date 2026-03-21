/**
 * OVSE Result Screen
 * Displays the verification result
 */

import { RouteProp, useRoute } from "@react-navigation/native";
import React, { useEffect } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import ThemeManager from "../theme/ThemeManager";
import NativeBridge from "../utils/NativeBridge";

type OVSEResultRouteProp = RouteProp<
   { OVSEResult: { status: any; sessionId: string; transactionId: string } },
   "OVSEResult"
>;

const OVSEResultScreen: React.FC = () => {
   const route = useRoute<OVSEResultRouteProp>();
   const commonStyles = ThemeManager.getCommonStyles();
   const colors = ThemeManager.getColors();

   const { status, sessionId, transactionId } = route.params || {};

   const isSuccess = status?.code && status.code !== "CALLBACK_NOT_YET_RECEIVED";
   const hasData = status?.data && Object.keys(status.data).length > 0;

   useEffect(() => {
      NativeBridge.trackScreen("OVSEResult");

      if (isSuccess) {
         NativeBridge.onSuccess({
            sessionId,
            transactionId,
            code: status.code,
            data: status.data,
         });
      } else {
         NativeBridge.onFailure({
            code: status?.code || "UNKNOWN",
            message: status?.message || "Verification failed",
         });
      }
   }, []);

   const handleDone = () => {
      NativeBridge.trackButtonClick("done", "OVSEResult");
      NativeBridge.close();
   };

   return (
      <ScrollView style={commonStyles.centerContainer} contentContainerStyle={styles.scrollContent}>
         <View style={styles.content}>
            <View
               style={[
                  styles.statusIcon,
                  {
                     backgroundColor: isSuccess ? colors.success + "20" : colors.error + "20",
                  },
               ]}
            >
               <Text style={styles.checkmark}>{isSuccess ? "✓" : "✕"}</Text>
            </View>

            <Text style={commonStyles.title}>{isSuccess ? "Verification Complete" : "Verification Status"}</Text>
            <Text style={commonStyles.subtitle}>{status?.message || "No message"}</Text>

            {/* Status Code */}
            <View style={styles.detailsContainer}>
               <Text style={styles.detailLabel}>Status Code:</Text>
               <Text style={[styles.detailValue, styles.codeText]}>{status?.code || "N/A"}</Text>
            </View>

            {/* Session ID */}
            <View style={styles.detailsContainer}>
               <Text style={styles.detailLabel}>Session ID:</Text>
               <Text style={styles.detailValue}>{sessionId}</Text>
            </View>

            {/* Transaction ID */}
            <View style={styles.detailsContainer}>
               <Text style={styles.detailLabel}>Transaction ID:</Text>
               <Text style={styles.detailValue}>{transactionId}</Text>
            </View>

            {/* Request ID */}
            {status?.request_id && (
               <View style={styles.detailsContainer}>
                  <Text style={styles.detailLabel}>Request ID:</Text>
                  <Text style={styles.detailValue}>{status.request_id}</Text>
               </View>
            )}

            {/* Response Data */}
            {hasData && (
               <View style={styles.dataContainer}>
                  <Text style={styles.dataLabel}>Response Data:</Text>
                  <View style={styles.dataBox}>
                     <Text style={styles.dataText}>{JSON.stringify(status.data, null, 2)}</Text>
                  </View>
               </View>
            )}

            <TouchableOpacity style={[commonStyles.button, styles.doneButton]} onPress={handleDone} activeOpacity={0.8}>
               <Text style={commonStyles.buttonText}>Done</Text>
            </TouchableOpacity>
         </View>
      </ScrollView>
   );
};

const styles = StyleSheet.create({
   scrollContent: {
      flexGrow: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingVertical: 40,
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
   detailsContainer: {
      marginTop: 20,
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
      fontWeight: "600",
   },
   detailValue: {
      fontSize: 14,
      color: "#1A202C",
      fontWeight: "600",
      fontFamily: "monospace",
   },
   codeText: {
      color: "#2D3748",
      fontSize: 16,
   },
   dataContainer: {
      marginTop: 20,
      width: "100%",
   },
   dataLabel: {
      fontSize: 12,
      color: "#718096",
      marginBottom: 8,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      fontWeight: "600",
   },
   dataBox: {
      padding: 16,
      backgroundColor: "#2D3748",
      borderRadius: 8,
      maxHeight: 200,
   },
   dataText: {
      fontSize: 12,
      color: "#E2E8F0",
      fontFamily: "monospace",
      lineHeight: 18,
   },
   doneButton: {
      marginTop: 32,
   },
});

export default OVSEResultScreen;
