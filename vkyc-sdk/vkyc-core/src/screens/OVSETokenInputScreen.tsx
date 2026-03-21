/**
 * OVSE Token Input Screen
 * Screen for entering the OVSE token
 */

import { useNavigation } from "@react-navigation/native";
import React, { useState } from "react";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useDispatch } from "react-redux";
import OVSEAPIService from "../services/OVSEAPIService";
import { setError, setLoading } from "../store";
import ThemeManager from "../theme/ThemeManager";
import { ErrorCode } from "../types";
import NativeBridge from "../utils/NativeBridge";

const OVSETokenInputScreen: React.FC = () => {
   const navigation = useNavigation();
   const dispatch = useDispatch();
   const commonStyles = ThemeManager.getCommonStyles();
   const colors = ThemeManager.getColors();

   const [token, setToken] = useState("");
   const [isSubmitting, setIsSubmitting] = useState(false);

   React.useEffect(() => {
      NativeBridge.trackScreen("OVSETokenInput");
   }, []);

   const handleSubmit = async () => {
      if (!token.trim()) {
         dispatch(
            setError({
               code: ErrorCode.INVALID_CONFIG,
               message: "Please enter a valid token",
            }),
         );
         return;
      }

      NativeBridge.trackButtonClick("submit_token", "OVSETokenInput");

      try {
         setIsSubmitting(true);
         dispatch(setLoading(true));

         // Step 1: Initiate session
         NativeBridge.onEvent("ovse_session_initiating", { token });
         const sessionResponse = await OVSEAPIService.initiateSession(token);

         if (!sessionResponse.data?.sessionId) {
            throw new Error("Session ID not received");
         }

         const { sessionId, authorization } = sessionResponse.data;

         NativeBridge.onEvent("ovse_session_initiated", {
            sessionId,
            hasAuthorization: !!authorization,
         });

         // Step 2: Set KYC method
         NativeBridge.onEvent("ovse_kyc_method_setting", { sessionId });
         await OVSEAPIService.setKYCMethod(sessionId);

         NativeBridge.onEvent("ovse_kyc_method_set", { sessionId });

         // Step 3: Generate intent
         NativeBridge.onEvent("ovse_intent_generating", { sessionId });
         const intentResponse = await OVSEAPIService.generateIntent(sessionId);

         if (!intentResponse.data?.jwt_token || !intentResponse.data?.transaction_id) {
            throw new Error("JWT token or transaction ID not received");
         }

         const { jwt_token, transaction_id } = intentResponse.data;

         NativeBridge.onEvent("ovse_intent_generated", {
            transactionId: transaction_id,
         });

         // Navigate to processing screen with data
         (navigation as any).navigate("OVSEProcessing", {
            sessionId,
            transactionId: transaction_id,
            jwtToken: jwt_token,
         });
      } catch (error: any) {
         console.error("OVSE token submission failed:", error);

         const errorObj = {
            code: ErrorCode.API_ERROR,
            message: error.message || "Failed to process token",
            details: error,
         };

         dispatch(setError(errorObj));
         NativeBridge.trackError(errorObj, "OVSETokenInput");
      } finally {
         setIsSubmitting(false);
         dispatch(setLoading(false));
      }
   };

   const handleCancel = () => {
      NativeBridge.trackButtonClick("cancel", "OVSETokenInput");
      NativeBridge.onCancel();
   };

   return (
      <KeyboardAvoidingView
         style={commonStyles.centerContainer}
         behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
         <View style={styles.content}>
            <Text style={commonStyles.title}>Aadhaar OVSE Verification</Text>
            <Text style={commonStyles.subtitle}>Enter your verification token to begin the process</Text>

            <View style={styles.inputContainer}>
               <Text style={styles.inputLabel}>Verification Token</Text>
               <TextInput
                  style={[styles.input, { borderColor: colors.primary }]}
                  value={token}
                  onChangeText={setToken}
                  placeholder="Enter token (e.g., DPYmAX)"
                  placeholderTextColor="#999999"
                  autoCapitalize="characters"
                  autoCorrect={false}
                  editable={!isSubmitting}
               />
            </View>

            {isSubmitting ? (
               <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={styles.loadingText}>Processing token...</Text>
               </View>
            ) : (
               <>
                  <TouchableOpacity
                     style={[commonStyles.button, !token.trim() && styles.buttonDisabled]}
                     onPress={handleSubmit}
                     disabled={!token.trim()}
                     activeOpacity={0.8}
                  >
                     <Text style={commonStyles.buttonText}>Continue</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                     style={[commonStyles.secondaryButton, styles.cancelButton]}
                     onPress={handleCancel}
                     activeOpacity={0.8}
                  >
                     <Text style={commonStyles.secondaryButtonText}>Cancel</Text>
                  </TouchableOpacity>
               </>
            )}
         </View>
      </KeyboardAvoidingView>
   );
};

const styles = StyleSheet.create({
   content: {
      width: "100%",
      maxWidth: 400,
      alignItems: "center",
      paddingHorizontal: 20,
   },
   inputContainer: {
      width: "100%",
      marginVertical: 32,
   },
   inputLabel: {
      fontSize: 14,
      fontWeight: "600",
      color: "#1A202C",
      marginBottom: 8,
   },
   input: {
      width: "100%",
      height: 56,
      borderWidth: 2,
      borderRadius: 8,
      paddingHorizontal: 16,
      fontSize: 16,
      color: "#1A202C",
      backgroundColor: "#FFFFFF",
   },
   buttonDisabled: {
      opacity: 0.5,
   },
   loadingContainer: {
      alignItems: "center",
      marginVertical: 32,
   },
   loadingText: {
      marginTop: 16,
      fontSize: 16,
      color: "#4A5568",
   },
   cancelButton: {
      marginTop: 16,
   },
});

export default OVSETokenInputScreen;
