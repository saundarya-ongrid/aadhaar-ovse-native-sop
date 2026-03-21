/**
 * Liveness Check Screen
 * Placeholder for liveness detection functionality
 */

import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSelector } from "react-redux";
import { selectConfig } from "../store";
import ThemeManager from "../theme/ThemeManager";
import { ErrorCode } from "../types";
import NativeBridge from "../utils/NativeBridge";

const LivenessCheckScreen: React.FC = () => {
   const navigation = useNavigation();
   const config = useSelector(selectConfig);
   const commonStyles = ThemeManager.getCommonStyles();
   const colors = ThemeManager.getColors();
   const [isChecking, setIsChecking] = useState(false);
   const [instruction, setInstruction] = useState("Blink your eyes");

   useEffect(() => {
      NativeBridge.trackScreen("LivenessCheck");
   }, []);

   const handleStartCheck = async () => {
      NativeBridge.trackButtonClick("start_liveness_check", "LivenessCheck");

      try {
         setIsChecking(true);

         // Simulate liveness check steps
         const instructions = ["Blink your eyes", "Turn your head left", "Turn your head right", "Smile"];

         for (let i = 0; i < instructions.length; i++) {
            setInstruction(instructions[i]);
            await new Promise<void>((resolve) => setTimeout(resolve, 1500));
         }

         NativeBridge.onEvent("liveness_check_completed", {
            success: true,
         });

         // Navigate to video or processing
         if (config?.features?.videoRecording) {
            (navigation as any).navigate("VideoRecording");
         } else {
            (navigation as any).navigate("Processing");
         }
      } catch (error) {
         console.error("Liveness check failed:", error);
         NativeBridge.trackError(
            {
               code: ErrorCode.LIVENESS_FAILED,
               message: "Liveness check failed",
            },
            "LivenessCheck",
         );
      } finally {
         setIsChecking(false);
      }
   };

   const handleSkip = () => {
      NativeBridge.trackButtonClick("skip_liveness", "LivenessCheck");
      if (config?.features?.videoRecording) {
         (navigation as any).navigate("VideoRecording");
      } else {
         (navigation as any).navigate("Processing");
      }
   };

   return (
      <View style={commonStyles.centerContainer}>
         <View style={styles.content}>
            <Text style={commonStyles.title}>Liveness Check</Text>
            <Text style={commonStyles.subtitle}>Follow the on-screen instructions to verify you're a real person.</Text>

            <View style={[styles.livenessFrame, { borderColor: colors.primary }]}>
               <Text style={styles.faceText}>😊</Text>
               {isChecking && (
                  <View style={styles.instructionBox}>
                     <Text style={styles.instructionText}>{instruction}</Text>
                  </View>
               )}
            </View>

            {isChecking ? (
               <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
            ) : (
               <>
                  <TouchableOpacity style={commonStyles.button} onPress={handleStartCheck} activeOpacity={0.8}>
                     <Text style={commonStyles.buttonText}>Start Liveness Check</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                     style={[commonStyles.secondaryButton, styles.skipButton]}
                     onPress={handleSkip}
                     activeOpacity={0.8}
                  >
                     <Text style={commonStyles.secondaryButtonText}>Skip</Text>
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
   livenessFrame: {
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
   faceText: {
      fontSize: 80,
   },
   instructionBox: {
      marginTop: 24,
      paddingHorizontal: 20,
      paddingVertical: 12,
      backgroundColor: "#FFFFFF",
      borderRadius: 8,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
   },
   instructionText: {
      fontSize: 16,
      fontWeight: "600",
      color: "#1A202C",
      textAlign: "center",
   },
   loader: {
      marginVertical: 32,
   },
   skipButton: {
      marginTop: 16,
   },
});

export default LivenessCheckScreen;
