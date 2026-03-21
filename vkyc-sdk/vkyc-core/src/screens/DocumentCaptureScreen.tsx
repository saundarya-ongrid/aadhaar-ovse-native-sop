/**
 * Document Capture Screen
 * Placeholder for document capture functionality
 */

import { useNavigation } from "@react-navigation/native";
import React, { useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useDispatch } from "react-redux";
import { setDocumentId } from "../store";
import ThemeManager from "../theme/ThemeManager";
import { ErrorCode } from "../types";
import NativeBridge from "../utils/NativeBridge";

const DocumentCaptureScreen: React.FC = () => {
   const navigation = useNavigation();
   const dispatch = useDispatch();
   const commonStyles = ThemeManager.getCommonStyles();
   const colors = ThemeManager.getColors();
   const [isUploading, setIsUploading] = useState(false);

   React.useEffect(() => {
      NativeBridge.trackScreen("DocumentCapture");
   }, []);

   const handleCapture = async () => {
      NativeBridge.trackButtonClick("capture_document", "DocumentCapture");

      try {
         setIsUploading(true);

         // Simulate document capture and upload
         // In real implementation, this would use react-native-camera
         await new Promise<void>((resolve) => setTimeout(resolve, 1500));

         const mockDocumentId = "doc_" + Date.now();
         dispatch(setDocumentId(mockDocumentId));

         NativeBridge.onEvent("document_captured", {
            documentId: mockDocumentId,
         });

         // Navigate to next screen
         (navigation as any).navigate("SelfieCapture", { documentId: mockDocumentId });
      } catch (error) {
         console.error("Document capture failed:", error);
         NativeBridge.trackError(
            {
               code: ErrorCode.CAPTURE_FAILED,
               message: "Failed to capture document",
            },
            "DocumentCapture",
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
            <Text style={commonStyles.title}>Capture Your Document</Text>
            <Text style={commonStyles.subtitle}>
               Position your ID document within the frame and take a clear photo.
            </Text>

            <View style={[styles.captureFrame, { borderColor: colors.primary }]}>
               <Text style={styles.frameText}>📄</Text>
               <Text style={styles.frameInstruction}>
                  {isUploading ? "Processing..." : "Tap button below to capture"}
               </Text>
            </View>

            {isUploading ? (
               <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
            ) : (
               <>
                  <TouchableOpacity style={commonStyles.button} onPress={handleCapture} activeOpacity={0.8}>
                     <Text style={commonStyles.buttonText}>Capture Document</Text>
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
      width: "100%",
      aspectRatio: 1.6,
      borderWidth: 3,
      borderRadius: 12,
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
   },
   loader: {
      marginVertical: 32,
   },
   backButton: {
      marginTop: 16,
   },
});

export default DocumentCaptureScreen;
