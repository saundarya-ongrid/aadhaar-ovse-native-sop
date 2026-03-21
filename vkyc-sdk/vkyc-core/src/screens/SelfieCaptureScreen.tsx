/**
 * Selfie Capture Screen
 * Placeholder for selfie capture functionality
 */

import { useNavigation } from "@react-navigation/native";
import React, { useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { selectConfig, setSelfieId } from "../store";
import ThemeManager from "../theme/ThemeManager";
import { ErrorCode } from "../types";
import NativeBridge from "../utils/NativeBridge";

const SelfieCaptureScreen: React.FC = () => {
   const navigation = useNavigation();
   const dispatch = useDispatch();
   const config = useSelector(selectConfig);
   const commonStyles = ThemeManager.getCommonStyles();
   const colors = ThemeManager.getColors();
   const [isUploading, setIsUploading] = useState(false);

   React.useEffect(() => {
      NativeBridge.trackScreen("SelfieCapture");
   }, []);

   const handleCapture = async () => {
      NativeBridge.trackButtonClick("capture_selfie", "SelfieCapture");

      try {
         setIsUploading(true);

         // Simulate selfie capture and upload
         await new Promise<void>((resolve) => setTimeout(resolve, 1500));

         const mockSelfieId = "selfie_" + Date.now();
         dispatch(setSelfieId(mockSelfieId));

         NativeBridge.onEvent("selfie_captured", {
            selfieId: mockSelfieId,
         });

         // Navigate to liveness check or video (if enabled) or processing
         if (config?.features?.liveness) {
            (navigation as any).navigate("LivenessCheck");
         } else if (config?.features?.videoRecording) {
            (navigation as any).navigate("VideoRecording");
         } else {
            (navigation as any).navigate("Processing");
         }
      } catch (error) {
         console.error("Selfie capture failed:", error);
         NativeBridge.trackError(
            {
               code: ErrorCode.CAPTURE_FAILED,
               message: "Failed to capture selfie",
            },
            "SelfieCapture",
         );
      } finally {
         setIsUploading(false);
      }
   };

   const handleBack = () => {
      navigation.goBack();
   };

   return (
      <View style={commonStyles.centerContainer}>
         <View style={styles.content}>
            <Text style={commonStyles.title}>Take a Selfie</Text>
            <Text style={commonStyles.subtitle}>Position your face within the frame and capture a clear photo.</Text>

            <View style={[styles.captureFrame, { borderColor: colors.primary }]}>
               <Text style={styles.frameText}>🤳</Text>
               <Text style={styles.frameInstruction}>
                  {isUploading ? "Processing..." : "Tap button below to capture"}
               </Text>
            </View>

            {isUploading ? (
               <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
            ) : (
               <>
                  <TouchableOpacity style={commonStyles.button} onPress={handleCapture} activeOpacity={0.8}>
                     <Text style={commonStyles.buttonText}>Capture Selfie</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                     style={[commonStyles.secondaryButton, styles.backButton]}
                     onPress={handleBack}
                     activeOpacity={0.8}
                  >
                     <Text style={commonStyles.secondaryButtonText}>Back</Text>
                  </TouchableOpacity>
               </>
            )}
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
   captureFrame: {
      width: 280,
      height: 350,
      borderWidth: 3,
      borderRadius: 200,
      borderStyle: "dashed",
      justifyContent: "center",
      alignItems: "center",
      marginVertical: 32,
      backgroundColor: "#F7FAFC",
   },
   frameText: {
      fontSize: 64,
      marginBottom: 16,
   },
   frameInstruction: {
      fontSize: 14,
      color: "#666666",
      textAlign: "center",
      paddingHorizontal: 16,
   },
   loader: {
      marginVertical: 32,
   },
   backButton: {
      marginTop: 16,
   },
});

export default SelfieCaptureScreen;
