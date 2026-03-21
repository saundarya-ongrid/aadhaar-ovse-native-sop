/**
 * Video Recording Screen
 * Placeholder for video recording functionality
 */

import { useNavigation } from "@react-navigation/native";
import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useDispatch } from "react-redux";
import { setVideoId } from "../store";
import ThemeManager from "../theme/ThemeManager";
import { ErrorCode } from "../types";
import NativeBridge from "../utils/NativeBridge";

const VideoRecordingScreen: React.FC = () => {
   const navigation = useNavigation();
   const dispatch = useDispatch();
   const commonStyles = ThemeManager.getCommonStyles();
   const colors = ThemeManager.getColors();
   const [isRecording, setIsRecording] = useState(false);
   const [recordingTime, setRecordingTime] = useState(0);

   React.useEffect(() => {
      NativeBridge.trackScreen("VideoRecording");
   }, []);

   React.useEffect(() => {
      let interval: number;
      if (isRecording) {
         interval = setInterval(() => {
            setRecordingTime((prev) => prev + 1);
         }, 1000) as any;
      }
      return () => clearInterval(interval);
   }, [isRecording]);

   const handleStartRecording = async () => {
      NativeBridge.trackButtonClick("start_recording", "VideoRecording");
      setIsRecording(true);
      setRecordingTime(0);
   };

   const handleStopRecording = async () => {
      NativeBridge.trackButtonClick("stop_recording", "VideoRecording");

      try {
         setIsRecording(false);

         // Simulate video upload
         await new Promise<void>((resolve) => setTimeout(resolve, 1000));

         const mockVideoId = "video_" + Date.now();
         dispatch(setVideoId(mockVideoId));

         NativeBridge.onEvent("video_recorded", {
            videoId: mockVideoId,
            duration: recordingTime,
         });

         // Navigate to processing
         (navigation as any).navigate("Processing");
      } catch (error) {
         console.error("Video recording failed:", error);
         NativeBridge.trackError(
            {
               code: ErrorCode.CAPTURE_FAILED,
               message: "Failed to record video",
            },
            "VideoRecording",
         );
      }
   };

   const handleSkip = () => {
      NativeBridge.trackButtonClick("skip_video", "VideoRecording");
      (navigation as any).navigate("Processing");
   };

   const formatTime = (seconds: number): string => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
   };

   return (
      <View style={commonStyles.centerContainer}>
         <View style={styles.content}>
            <Text style={commonStyles.title}>Record a Video</Text>
            <Text style={commonStyles.subtitle}>Record a short video saying the OTP shown on screen.</Text>

            <View style={[styles.videoFrame, { borderColor: colors.primary }]}>
               <Text style={styles.cameraText}>📹</Text>
               {isRecording ? (
                  <>
                     <View style={[styles.recordingIndicator, { backgroundColor: colors.error }]}>
                        <View style={styles.recordingDot} />
                        <Text style={styles.recordingText}>REC {formatTime(recordingTime)}</Text>
                     </View>
                     <Text style={styles.otpText}>OTP: 1234</Text>
                  </>
               ) : (
                  <Text style={styles.frameInstruction}>Tap button below to start recording</Text>
               )}
            </View>

            {isRecording ? (
               <TouchableOpacity
                  style={[commonStyles.button, { backgroundColor: colors.error }]}
                  onPress={handleStopRecording}
                  activeOpacity={0.8}
               >
                  <Text style={commonStyles.buttonText}>Stop Recording</Text>
               </TouchableOpacity>
            ) : (
               <>
                  <TouchableOpacity style={commonStyles.button} onPress={handleStartRecording} activeOpacity={0.8}>
                     <Text style={commonStyles.buttonText}>Start Recording</Text>
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
   videoFrame: {
      width: "100%",
      aspectRatio: 0.75,
      borderWidth: 3,
      borderRadius: 12,
      borderStyle: "dashed",
      justifyContent: "center",
      alignItems: "center",
      marginVertical: 32,
      backgroundColor: "#F7FAFC",
   },
   cameraText: {
      fontSize: 64,
      marginBottom: 16,
   },
   frameInstruction: {
      fontSize: 14,
      color: "#666666",
      textAlign: "center",
   },
   recordingIndicator: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      marginBottom: 16,
   },
   recordingDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: "#FFFFFF",
      marginRight: 8,
   },
   recordingText: {
      color: "#FFFFFF",
      fontSize: 14,
      fontWeight: "700",
   },
   otpText: {
      fontSize: 32,
      fontWeight: "700",
      color: "#1A202C",
      letterSpacing: 4,
   },
   skipButton: {
      marginTop: 16,
   },
});

export default VideoRecordingScreen;
