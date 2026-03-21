/**
 * Navigation Configuration
 * Defines the navigation stack for the VKYC flow
 */

import { createStackNavigator } from "@react-navigation/stack";
import React from "react";
import DocumentCaptureScreen from "../screens/DocumentCaptureScreen";
import ErrorScreen from "../screens/ErrorScreen";
import LivenessCheckScreen from "../screens/LivenessCheckScreen";
import OVSEProcessingScreen from "../screens/OVSEProcessingScreen";
import OVSEResultScreen from "../screens/OVSEResultScreen";
import OVSETokenInputScreen from "../screens/OVSETokenInputScreen";
import ProcessingScreen from "../screens/ProcessingScreen";
import SelfieCaptureScreen from "../screens/SelfieCaptureScreen";
import SuccessScreen from "../screens/SuccessScreen";
import VideoRecordingScreen from "../screens/VideoRecordingScreen";
import WelcomeScreen from "../screens/WelcomeScreen";

export type RootStackParamList = {
   Welcome: undefined;
   DocumentCapture: undefined;
   SelfieCapture: { documentId?: string };
   LivenessCheck: undefined;
   VideoRecording: undefined;
   Processing: undefined;
   Success: { result: any };
   Error: { error: any };
   OVSETokenInput: undefined;
   OVSEProcessing: { sessionId: string; transactionId: string; jwtToken: string };
   OVSEResult: { status: any; sessionId: string; transactionId: string };
};

const Stack = createStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
   return (
      <Stack.Navigator
         initialRouteName="Welcome"
         screenOptions={{
            headerShown: false,
            cardStyle: { backgroundColor: "#FFFFFF" },
            animationEnabled: true,
            gestureEnabled: false, // Disable swipe back to prevent navigation bypass
         }}
      >
         <Stack.Screen name="Welcome" component={WelcomeScreen} />
         <Stack.Screen name="DocumentCapture" component={DocumentCaptureScreen} />
         <Stack.Screen name="SelfieCapture" component={SelfieCaptureScreen} />
         <Stack.Screen name="LivenessCheck" component={LivenessCheckScreen} />
         <Stack.Screen name="VideoRecording" component={VideoRecordingScreen} />
         <Stack.Screen name="Processing" component={ProcessingScreen} />
         <Stack.Screen name="Success" component={SuccessScreen} />
         <Stack.Screen name="Error" component={ErrorScreen} />
         <Stack.Screen name="OVSETokenInput" component={OVSETokenInputScreen} />
         <Stack.Screen name="OVSEProcessing" component={OVSEProcessingScreen} />
         <Stack.Screen name="OVSEResult" component={OVSEResultScreen} />
      </Stack.Navigator>
   );
};

export default AppNavigator;
