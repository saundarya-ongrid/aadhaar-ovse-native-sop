/**
 * Processing Screen
 * Handles upload and verification of captured documents
 */

import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import APIService from "../services/APIService";
import { selectConfig, selectDocumentId, selectSelfieId, selectSessionId, selectVideoId, setSessionId } from "../store";
import ThemeManager from "../theme/ThemeManager";
import { ErrorCode, VKYCResult } from "../types";
import NativeBridge from "../utils/NativeBridge";

const ProcessingScreen: React.FC = () => {
   const navigation = useNavigation();
   const dispatch = useDispatch();
   const documentId = useSelector(selectDocumentId);
   const selfieId = useSelector(selectSelfieId);
   const videoId = useSelector(selectVideoId);
   const sessionId = useSelector(selectSessionId);
   const config = useSelector(selectConfig);
   const commonStyles = ThemeManager.getCommonStyles();
   const colors = ThemeManager.getColors();
   const [statusText, setStatusText] = useState("Initializing verification...");

   useEffect(() => {
      NativeBridge.trackScreen("Processing");
      processVerification();
   }, []);

   const processVerification = async () => {
      try {
         // Step 1: Create session
         setStatusText("Creating verification session...");
         const session = await APIService.createSession({
            documentId: documentId || undefined,
            selfieId: selfieId || undefined,
            videoId: videoId || undefined,
         });
         dispatch(setSessionId(session.sessionId));

         NativeBridge.onEvent("session_created", {
            sessionId: session.sessionId,
         });

         // Step 2: Upload document (if exists)
         if (documentId) {
            setStatusText("Uploading document...");
            await new Promise<void>((resolve) => setTimeout(resolve, 1500));
            NativeBridge.onEvent("document_uploaded", { documentId });
         }

         // Step 3: Upload selfie (if exists)
         if (selfieId) {
            setStatusText("Uploading selfie...");
            await new Promise<void>((resolve) => setTimeout(resolve, 1500));
            NativeBridge.onEvent("selfie_uploaded", { selfieId });
         }

         // Step 4: Upload video (if exists)
         if (videoId) {
            setStatusText("Uploading video...");
            await new Promise<void>((resolve) => setTimeout(resolve, 1500));
            NativeBridge.onEvent("video_uploaded", { videoId });
         }

         // Step 5: Verify documents
         setStatusText("Verifying your documents...");
         await new Promise<void>((resolve) => setTimeout(resolve, 2000));

         // Step 6: Poll for results
         setStatusText("Processing verification results...");
         const result = await APIService.pollSessionStatus(session.sessionId);

         if (result.status === "completed" || result.status === "verified") {
            // Success
            const successResult: VKYCResult = {
               success: true,
               sessionId: session.sessionId,
               verificationId: result.verificationId || session.sessionId,
               data: result.data || result.verificationData,
            };

            NativeBridge.onSuccess(successResult);
            (navigation as any).navigate("Success", { result: successResult });
         } else if (result.status === "failed") {
            // Verification failed
            (navigation as any).navigate("Error", {
               error: {
                  code: ErrorCode.VERIFICATION_FAILED,
                  message: result.message || "Verification failed",
                  details: result.data || result.verificationData,
               },
            });
         }
      } catch (error: any) {
         console.error("Processing failed:", error);

         const errorObj = {
            code: ErrorCode.API_ERROR,
            message: error.message || "Processing failed",
            details: error,
         };

         NativeBridge.trackError(errorObj, "Processing");

         (navigation as any).navigate("Error", { error: errorObj });
      }
   };

   return (
      <View style={commonStyles.centerContainer}>
         <View style={styles.content}>
            <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />

            <Text style={commonStyles.title}>Processing</Text>
            <Text style={[commonStyles.subtitle, styles.statusText]}>{statusText}</Text>

            <View style={styles.progressContainer}>
               <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { backgroundColor: colors.primary }]} />
               </View>
               <Text style={styles.progressNote}>This may take a few moments...</Text>
            </View>
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
   loader: {
      marginBottom: 32,
   },
   statusText: {
      marginTop: 16,
      fontStyle: "italic",
   },
   progressContainer: {
      marginTop: 48,
      width: "100%",
   },
   progressBar: {
      width: "100%",
      height: 6,
      backgroundColor: "#E2E8F0",
      borderRadius: 3,
      overflow: "hidden",
   },
   progressFill: {
      height: "100%",
      width: "100%",
      borderRadius: 3,
   },
   progressNote: {
      marginTop: 12,
      fontSize: 14,
      color: "#718096",
      textAlign: "center",
   },
});

export default ProcessingScreen;
