/**
 * OVSE Test Screen
 * Simple test harness for the OVSE flow
 */

import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
   ActivityIndicator,
   Alert,
   KeyboardAvoidingView,
   Linking,
   Platform,
   ScrollView,
   StatusBar,
   StyleSheet,
   Text,
   TextInput,
   TouchableOpacity,
   View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Mock API Service for testing
class OVSEAPIService {
   private static BASE_URL = "https://d29vza544ghj85.cloudfront.net/api/integration";

   private static async parseResponse(response: Response) {
      const text = await response.text();
      if (!text || text.trim() === "") {
         throw new Error(`Empty response from server (Status: ${response.status})`);
      }
      try {
         return JSON.parse(text);
      } catch (error) {
         console.error("Failed to parse JSON:", text);
         throw new Error(`Invalid JSON response: ${text.substring(0, 100)}`);
      }
   }

   static async initiateSession(token: string) {
      const response = await fetch(`${this.BASE_URL}/initiate/session`, {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ token }),
      });
      return this.parseResponse(response);
   }

   static async setKYCMethod(sessionId: string, authorization: string, method: string = "aadhaarovse") {
      const response = await fetch(`${this.BASE_URL}/customer/kyc/method`, {
         method: "POST",
         headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authorization}`,
         },
         body: JSON.stringify({ sessionId, method }),
      });
      return this.parseResponse(response);
   }

   static async generateIntent(customerSessionId: string, authorization: string, channel: string = "WEB") {
      const response = await fetch(`${this.BASE_URL}/ovse/generate-intent`, {
         method: "POST",
         headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authorization}`,
         },
         body: JSON.stringify({ customer_session_id: customerSessionId, channel }),
      });
      return this.parseResponse(response);
   }

   static async checkStatus(customerSessionId: string, transactionId: string, authorization: string) {
      const response = await fetch(`${this.BASE_URL}/ovse/status`, {
         method: "POST",
         headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authorization}`,
         },
         body: JSON.stringify({
            customer_session_id: customerSessionId,
            transaction_id: transactionId,
         }),
      });
      return this.parseResponse(response);
   }
}

export default function OVSETestScreen() {
   const [token, setToken] = useState("");
   const [isLoading, setIsLoading] = useState(false);
   const [status, setStatus] = useState("");
   const [sessionData, setSessionData] = useState<any>(null);
   const [pollingActive, setPollingActive] = useState(false);
   const [pollCount, setPollCount] = useState(0);

   const handleBack = () => {
      router.back();
   };

   const handleSubmit = async () => {
      if (!token.trim()) {
         Alert.alert("Error", "Please enter a token");
         return;
      }

      setIsLoading(true);
      setStatus("Initiating session...");

      try {
         // Step 1: Initiate session
         const sessionResponse = await OVSEAPIService.initiateSession(token);
         console.log("Session Response:", sessionResponse);

         if (
            sessionResponse.status !== "success" ||
            !sessionResponse.data?.sessionId ||
            !sessionResponse.data?.authorization
         ) {
            throw new Error(sessionResponse.message || "Failed to initiate session");
         }

         const sessionId = sessionResponse.data.sessionId;
         const authToken = sessionResponse.data.authorization;
         console.log("Authorization token received:", authToken.substring(0, 50) + "...");
         setStatus(`Session created: ${sessionId}`);
         await new Promise((resolve) => setTimeout(resolve, 500));

         // Step 2: Set KYC method
         setStatus("Setting KYC method...");
         console.log("Calling KYC method with sessionId:", sessionId);
         const kycResponse = await OVSEAPIService.setKYCMethod(sessionId, authToken, "aadhaarovse");
         console.log("KYC Response:", kycResponse);

         if (kycResponse.status !== "success") {
            throw new Error(kycResponse.message || "Failed to set KYC method");
         }

         setStatus(`KYC method set successfully`);
         await new Promise((resolve) => setTimeout(resolve, 500));

         // Step 3: Generate intent
         setStatus("Generating intent...");
         const intentResponse = await OVSEAPIService.generateIntent(sessionId, authToken, "WEB");
         console.log("Intent Response:", intentResponse);

         if (
            intentResponse.status !== "success" ||
            !intentResponse.data?.transaction_id ||
            !intentResponse.data?.jwt_token
         ) {
            throw new Error(intentResponse.message || "Failed to generate intent");
         }

         const transactionId = intentResponse.data.transaction_id;
         const jwtToken = intentResponse.data.jwt_token;

         setStatus("JWT generated! Launching Aadhaar app...");
         setSessionData({
            sessionId,
            customerSessionId: sessionId,
            transactionId,
            jwt: jwtToken,
            authToken,
         });

         // Launch Aadhaar app with JWT token
         console.log("Launching Aadhaar app on", Platform.OS);
         console.log("JWT Token length:", jwtToken.length);
         console.log("JWT Token first 50 chars:", jwtToken.substring(0, 50));

         try {
            if (Platform.OS === "ios") {
               // iOS: App to App URL scheme launch
               // Trying multiple possible URL schemes for mAadhaar app

               const urlVariations = [
                  `pehchan://in.gov.uidai.pehchan?req=${jwtToken}`, // From docs
                  `pehchaan://in.gov.uidai.pehchaan?req=${jwtToken}`, // Double 'a' variation
                  `maadhaar://in.gov.uidai.pehchan?req=${jwtToken}`, // mAadhaar scheme
                  `aadhaar://in.gov.uidai.pehchan?req=${jwtToken}`, // Aadhaar scheme
                  `pehchan://?req=${jwtToken}`, // Simplified
                  `in.gov.uidai.mAadhaar://?req=${jwtToken}`, // Bundle ID based
               ];

               console.log("\n=== iOS App Launch Attempt ===");
               console.log("JWT length:", jwtToken.length);
               console.log("Trying", urlVariations.length, "different URL schemes...\n");

               let launched = false;

               for (let i = 0; i < urlVariations.length; i++) {
                  const url = urlVariations[i];
                  const schemeName = url.split("://")[0];

                  try {
                     console.log(`${i + 1}/${urlVariations.length} Trying: ${schemeName}://...`);
                     await Linking.openURL(url);
                     launched = true;
                     console.log(`✅ SUCCESS! Aadhaar app launched with scheme: ${schemeName}://`);
                     setStatus(`Aadhaar app launched via ${schemeName}://`);
                     break;
                  } catch (err: any) {
                     console.log(`❌ Failed with ${schemeName}://`);
                  }
               }

               if (!launched) {
                  console.log("\n❌ All URL schemes failed");
                  console.log(
                     "The mAadhaar app may not be installed or doesn't support app-to-app on this iOS version.",
                  );
                  throw new Error("Cannot launch Aadhaar app. All URL schemes failed.");
               }

               if (launched) {
                  // Start polling after a 2-second delay
                  setTimeout(() => {
                     startPolling(sessionId, transactionId, authToken);
                  }, 2000);
               }
            } else {
               // Android: Use Intent with action
               console.log("Android Intent with JWT (length:", jwtToken.length, ")");
               await Linking.sendIntent("in.gov.uidai.pehchaan.INTENT_REQUEST", [{ key: "request", value: jwtToken }]);
               setStatus("Aadhaar app launched. Complete authentication there...");

               // Start polling after a 2-second delay
               setTimeout(() => {
                  startPolling(sessionId, transactionId, authToken);
               }, 2000);
            }
         } catch (error: any) {
            console.error("Failed to launch Aadhaar app:", error);
            const errorMessage = error.message || error.toString();

            Alert.alert(
               "Aadhaar App Not Found",
               "Unable to launch Aadhaar app. Please ensure:\n\n1. Aadhaar app is installed on your device\n2. Try again or continue with polling",
               [
                  {
                     text: "Start Polling",
                     onPress: () => startPolling(sessionId, transactionId, authToken),
                  },
                  { text: "Cancel", style: "cancel" },
               ],
            );
         }
      } catch (error: any) {
         console.error("OVSE Error:", error);
         const errorMsg = error.message || error.toString() || "Failed to complete OVSE flow";
         Alert.alert("Error", errorMsg);
         setStatus(`Error: ${errorMsg}`);
      } finally {
         setIsLoading(false);
      }
   };

   const startPolling = async (customerSessionId: string, transactionId: string, authToken: string) => {
      setPollingActive(true);
      setPollCount(0);
      setStatus("Polling for status...");

      let attempts = 0;
      const maxAttempts = 60;

      const pollInterval = setInterval(async () => {
         attempts++;
         setPollCount(attempts);

         try {
            const statusResponse = await OVSEAPIService.checkStatus(customerSessionId, transactionId, authToken);
            console.log(`Poll ${attempts}/${maxAttempts}:`, statusResponse);

            if (statusResponse.code !== "CALLBACK_NOT_YET_RECEIVED") {
               clearInterval(pollInterval);
               setPollingActive(false);
               setStatus(`Complete! Status: ${statusResponse.code}`);

               Alert.alert(
                  "Verification Complete",
                  `Status: ${statusResponse.code}\nMessage: ${statusResponse.message}`,
                  [{ text: "OK", onPress: () => console.log("Result:", statusResponse) }],
               );
            } else {
               setStatus(`Polling (${attempts}/${maxAttempts})... Status: ${statusResponse.code}`);
            }
         } catch (error: any) {
            console.error(`Poll ${attempts} error:`, error);
         }

         if (attempts >= maxAttempts) {
            clearInterval(pollInterval);
            setPollingActive(false);
            setStatus("Polling timeout after 5 minutes");
            Alert.alert("Timeout", "Verification did not complete within 5 minutes");
         }
      }, 5000);
   };

   const handleClearState = () => {
      setToken("");
      setStatus("");
      setSessionData(null);
      setPollingActive(false);
      setPollCount(0);
   };

   return (
      <LinearGradient
         colors={["#667eea", "#764ba2", "#f093fb"]}
         style={styles.container}
         start={{ x: 0, y: 0 }}
         end={{ x: 1, y: 1 }}
      >
         <StatusBar barStyle="light-content" />
         <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.flex1}>
               <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                  {/* Header */}
                  <View style={styles.header}>
                     <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                        <Text style={styles.backText}>← Back</Text>
                     </TouchableOpacity>
                     <Text style={styles.title}>OVSE Test</Text>
                     <TouchableOpacity onPress={handleClearState} style={styles.clearButton}>
                        <Text style={styles.clearText}>Clear</Text>
                     </TouchableOpacity>
                  </View>

                  {/* Info Card */}
                  <View style={styles.infoCard}>
                     <Text style={styles.infoTitle}>🧪 Test Environment</Text>
                     <Text style={styles.infoText}>API: d29vza544ghj85.cloudfront.net</Text>
                     <Text style={styles.infoText}>Polling: 5s interval, 60 max attempts</Text>
                  </View>

                  {/* Token Input */}
                  <View style={styles.inputCard}>
                     <Text style={styles.label}>Enter Token</Text>
                     <TextInput
                        style={styles.input}
                        value={token}
                        onChangeText={setToken}
                        placeholder="e.g., DPYmAX"
                        placeholderTextColor="rgba(255, 255, 255, 0.5)"
                        autoCapitalize="characters"
                        editable={!isLoading && !pollingActive}
                     />
                  </View>

                  {/* Action Button */}
                  <TouchableOpacity
                     style={[styles.button, (isLoading || pollingActive) && styles.buttonDisabled]}
                     onPress={handleSubmit}
                     disabled={isLoading || pollingActive}
                     activeOpacity={0.8}
                  >
                     {isLoading ? (
                        <ActivityIndicator color="#fff" />
                     ) : (
                        <Text style={styles.buttonText}>{pollingActive ? "Polling..." : "Start OVSE Flow"}</Text>
                     )}
                  </TouchableOpacity>

                  {/* Status Display */}
                  {status ? (
                     <View style={styles.statusCard}>
                        <Text style={styles.statusTitle}>Status</Text>
                        <Text style={styles.statusText}>{status}</Text>
                        {pollingActive && (
                           <View style={styles.pollIndicator}>
                              <ActivityIndicator color="#4facfe" style={styles.pollSpinner} />
                              <Text style={styles.pollText}>Poll {pollCount}/60</Text>
                           </View>
                        )}
                     </View>
                  ) : null}

                  {/* Session Data Display */}
                  {sessionData && (
                     <View style={styles.dataCard}>
                        <Text style={styles.dataTitle}>Session Data</Text>
                        <Text style={styles.dataLabel}>Session ID:</Text>
                        <Text style={styles.dataValue}>{sessionData.sessionId}</Text>
                        <Text style={styles.dataLabel}>Customer Session ID:</Text>
                        <Text style={styles.dataValue}>{sessionData.customerSessionId}</Text>
                        <Text style={styles.dataLabel}>Transaction ID:</Text>
                        <Text style={styles.dataValue}>{sessionData.transactionId}</Text>
                        <Text style={styles.dataLabel}>JWT (first 50 chars):</Text>
                        <Text style={styles.dataValue}>{sessionData.jwt?.substring(0, 50)}...</Text>
                     </View>
                  )}

                  {/* Instructions */}
                  <View style={styles.instructionsCard}>
                     <Text style={styles.instructionsTitle}>📋 Instructions</Text>
                     <Text style={styles.instructionsText}>1. Enter a valid token from backend</Text>
                     <Text style={styles.instructionsText}>2. Tap "Start OVSE Flow"</Text>
                     <Text style={styles.instructionsText}>3. Wait for intent generation</Text>
                     <Text style={styles.instructionsText}>4. Start polling for status</Text>
                     <Text style={styles.instructionsText}>5. Complete auth in Aadhaar app</Text>
                  </View>
               </ScrollView>
            </KeyboardAvoidingView>
         </SafeAreaView>
      </LinearGradient>
   );
}

const styles = StyleSheet.create({
   container: {
      flex: 1,
   },
   safeArea: {
      flex: 1,
   },
   flex1: {
      flex: 1,
   },
   scrollContent: {
      padding: 20,
      paddingBottom: 40,
   },
   header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 20,
   },
   backButton: {
      padding: 8,
   },
   backText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "600",
   },
   title: {
      color: "#fff",
      fontSize: 24,
      fontWeight: "bold",
   },
   clearButton: {
      padding: 8,
   },
   clearText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "600",
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
      fontWeight: "bold",
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
   label: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "600",
      marginBottom: 8,
   },
   input: {
      backgroundColor: "rgba(255, 255, 255, 0.2)",
      borderRadius: 12,
      padding: 16,
      color: "#fff",
      fontSize: 16,
      fontWeight: "600",
   },
   button: {
      backgroundColor: "#4facfe",
      borderRadius: 16,
      padding: 18,
      alignItems: "center",
      marginBottom: 20,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
   },
   buttonDisabled: {
      opacity: 0.6,
   },
   buttonText: {
      color: "#fff",
      fontSize: 18,
      fontWeight: "bold",
   },
   statusCard: {
      backgroundColor: "rgba(255, 255, 255, 0.15)",
      borderRadius: 16,
      padding: 16,
      marginBottom: 20,
   },
   statusTitle: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "bold",
      marginBottom: 8,
   },
   statusText: {
      color: "rgba(255, 255, 255, 0.9)",
      fontSize: 14,
      lineHeight: 20,
   },
   pollIndicator: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 12,
   },
   pollSpinner: {
      marginRight: 8,
   },
   pollText: {
      color: "#4facfe",
      fontSize: 14,
      fontWeight: "600",
   },
   dataCard: {
      backgroundColor: "rgba(255, 255, 255, 0.15)",
      borderRadius: 16,
      padding: 16,
      marginBottom: 20,
   },
   dataTitle: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "bold",
      marginBottom: 12,
   },
   dataLabel: {
      color: "rgba(255, 255, 255, 0.7)",
      fontSize: 12,
      marginTop: 8,
      marginBottom: 4,
   },
   dataValue: {
      color: "#fff",
      fontSize: 14,
      fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
   },
   instructionsCard: {
      backgroundColor: "rgba(255, 255, 255, 0.15)",
      borderRadius: 16,
      padding: 16,
   },
   instructionsTitle: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "bold",
      marginBottom: 8,
   },
   instructionsText: {
      color: "rgba(255, 255, 255, 0.9)",
      fontSize: 14,
      marginBottom: 4,
   },
});
