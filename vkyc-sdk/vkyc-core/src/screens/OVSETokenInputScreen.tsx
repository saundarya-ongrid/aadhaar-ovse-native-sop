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
import { SafeAreaView } from "react-native-safe-area-context";
import { useDispatch } from "react-redux";
import ConfigManager from "../config/ConfigManager";
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

   const config = ConfigManager.getConfig();
   const ovseConfig = config.ovse;
   const texts = config.texts || {};
   const [apiKey, setApiKey] = useState(ovseConfig?.initialApiKey || ovseConfig?.apiKey || config.apiKey || "");
   const [isSubmitting, setIsSubmitting] = useState(false);

   React.useEffect(() => {
      NativeBridge.trackScreen("OVSETokenInput");
   }, []);

   const handleSubmit = async () => {
      if (!apiKey.trim()) {
         dispatch(
            setError({
               code: ErrorCode.INVALID_CONFIG,
               message: "Please enter a valid API key",
            }),
         );
         return;
      }

      NativeBridge.trackButtonClick("submit_ovse", "OVSETokenInput");

      try {
         setIsSubmitting(true);
         dispatch(setLoading(true));

         const channelType = ovseConfig?.channelType || "APP";
         NativeBridge.onEvent("ovse_generate_token", { channelType });

         const tokenResponse = await OVSEAPIService.generateToken(apiKey.trim(), channelType);
         const transaction_id = tokenResponse.data?.transaction_id;
         const jwt_token = tokenResponse.data?.scan_uri || tokenResponse.data?.jwt_token;

         if (!jwt_token || !transaction_id) {
            throw new Error("JWT token or transaction ID not received");
         }

         NativeBridge.onEvent("ovse_intent_generated", {
            transactionId: transaction_id,
         });

         // Navigate to processing screen with data
         (navigation as any).navigate("OVSEProcessing", {
            apiKey: apiKey.trim(),
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
      <SafeAreaView style={styles.safeArea}>
         <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
            <View style={styles.content}>
               <View style={styles.infoCard}>
                  <Text style={styles.infoTitle}>Test Environment</Text>
                  <Text style={styles.infoText}>API: api-dev.gridlines.io/uidai-api/ovse</Text>
                  <Text style={styles.infoText}>Channel: APP (app-to-app)</Text>
                  <Text style={styles.infoText}>Polling: 5s interval, 60 max attempts</Text>
               </View>

               <View style={styles.inputCard}>
                  <Text style={styles.inputTitle}>{texts.ovseTitle || "Aadhaar OVSE Verification"}</Text>
                  <Text style={styles.inputSubtitle}>
                     {texts.ovseSubtitle || "Enter your API key to begin the verification process"}
                  </Text>
                  <Text style={styles.inputLabel}>{texts.ovseInputLabel || "API Key"}</Text>
                  <TextInput
                     style={styles.input}
                     value={apiKey}
                     onChangeText={setApiKey}
                     placeholder={texts.ovseInputPlaceholder || "Enter API key"}
                     placeholderTextColor="rgba(255, 255, 255, 0.5)"
                     autoCapitalize="none"
                     autoCorrect={false}
                     editable={!isSubmitting}
                  /> 
               </View>

               {isSubmitting ? (
                  <View style={styles.loadingContainer}>
                     <ActivityIndicator size="large" color={colors.primary} />
                     <Text style={styles.loadingText}>Generating OVSE session...</Text>
                  </View>
               ) : (
                  <>
                     <TouchableOpacity
                        style={[styles.primaryButton, !apiKey.trim() && styles.buttonDisabled]}
                        onPress={handleSubmit}
                        disabled={!apiKey.trim()}
                        activeOpacity={0.8}
                     >
                        <Text style={styles.primaryButtonText}>{texts.ovseSubmitLabel || "Continue"}</Text>
                     </TouchableOpacity>

                     <TouchableOpacity style={styles.cancelButton} onPress={handleCancel} activeOpacity={0.8}>
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                     </TouchableOpacity>
                  </>
               )}
            </View>
         </KeyboardAvoidingView>
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
      backgroundColor: "#667eea",
      justifyContent: "center",
      paddingHorizontal: 20,
   },
   content: {
      width: "100%",
   },
   infoCard: {
      backgroundColor: "rgba(255, 255, 255, 0.15)",
      borderRadius: 16,
      padding: 16,
      marginBottom: 20,
   },
   infoTitle: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "700",
      marginBottom: 8,
   },
   infoText: {
      color: "rgba(255, 255, 255, 0.9)",
      fontSize: 14,
      marginBottom: 4,
   },
   inputCard: {
      backgroundColor: "rgba(255, 255, 255, 0.15)",
      borderRadius: 16,
      padding: 16,
      marginBottom: 20,
   },
   inputTitle: {
      color: "#fff",
      fontSize: 22,
      fontWeight: "700",
      marginBottom: 8,
   },
   inputSubtitle: {
      color: "rgba(255, 255, 255, 0.9)",
      fontSize: 14,
      marginBottom: 16,
   },
   inputLabel: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "600",
      marginBottom: 8,
   },
   input: {
      width: "100%",
      backgroundColor: "rgba(255, 255, 255, 0.2)",
      borderRadius: 12,
      paddingHorizontal: 16,
      fontSize: 16,
      color: "#fff",
      fontWeight: "600",
      height: 56,
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
      color: "#fff",
   },
   primaryButton: {
      backgroundColor: "#4facfe",
      borderRadius: 16,
      padding: 18,
      alignItems: "center",
   },
   primaryButtonText: {
      color: "#fff",
      fontSize: 18,
      fontWeight: "700",
   },
   cancelButton: {
      marginTop: 16,
      alignItems: "center",
      padding: 12,
   },
   cancelButtonText: {
      color: "#fff",
      fontSize: 14,
      fontWeight: "600",
   },
});

export default OVSETokenInputScreen;
