/**
 * Welcome Screen
 * Initial screen with introduction and start button
 */

import { useNavigation } from "@react-navigation/native";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import ThemeManager from "../theme/ThemeManager";
import NativeBridge from "../utils/NativeBridge";

const WelcomeScreen: React.FC = () => {
   const navigation = useNavigation();
   const commonStyles = ThemeManager.getCommonStyles();
   const colors = ThemeManager.getColors();

   React.useEffect(() => {
      NativeBridge.trackScreen("Welcome");
   }, []);

   const handleStart = () => {
      NativeBridge.trackButtonClick("start", "Welcome");
      // Navigate to next screen (DocumentCapture for now)
      (navigation as any).navigate("DocumentCapture");
   };

   const handleStartOVSE = () => {
      NativeBridge.trackButtonClick("start_ovse", "Welcome");
      // Navigate to OVSE token input screen
      (navigation as any).navigate("OVSETokenInput");
   };

   const handleCancel = () => {
      NativeBridge.trackButtonClick("cancel", "Welcome");
      NativeBridge.onCancel();
   };

   return (
      <View style={commonStyles.centerContainer}>
         <View style={styles.content}>
            <Text style={commonStyles.title}>Welcome to VKYC</Text>
            <Text style={commonStyles.subtitle}>
               We'll guide you through a quick video verification process to confirm your identity.
            </Text>

            <View style={styles.steps}>
               <View style={styles.step}>
                  <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
                     <Text style={styles.stepNumberText}>1</Text>
                  </View>
                  <Text style={styles.stepText}>Capture your ID document</Text>
               </View>

               <View style={styles.step}>
                  <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
                     <Text style={styles.stepNumberText}>2</Text>
                  </View>
                  <Text style={styles.stepText}>Take a selfie</Text>
               </View>

               <View style={styles.step}>
                  <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
                     <Text style={styles.stepNumberText}>3</Text>
                  </View>
                  <Text style={styles.stepText}>Complete liveness check</Text>
               </View>
            </View>

            <TouchableOpacity style={commonStyles.button} onPress={handleStart} activeOpacity={0.8}>
               <Text style={commonStyles.buttonText}>Get Started</Text>
            </TouchableOpacity>

            <TouchableOpacity
               style={[commonStyles.button, { backgroundColor: colors.primary, marginTop: 12 }]}
               onPress={handleStartOVSE}
               activeOpacity={0.8}
            >
               <Text style={commonStyles.buttonText}>Start OVSE Verification</Text>
            </TouchableOpacity>

            <TouchableOpacity
               style={[commonStyles.secondaryButton, styles.cancelButton]}
               onPress={handleCancel}
               activeOpacity={0.8}
            >
               <Text style={commonStyles.secondaryButtonText}>Cancel</Text>
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
   steps: {
      width: "100%",
      marginBottom: 32,
      marginTop: 16,
   },
   step: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 16,
   },
   stepNumber: {
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 12,
   },
   stepNumberText: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "bold",
   },
   stepText: {
      flex: 1,
      fontSize: 16,
      color: "#333333",
   },
   cancelButton: {
      marginTop: 16,
   },
});

export default WelcomeScreen;
