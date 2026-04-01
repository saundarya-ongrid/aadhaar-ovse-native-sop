import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

// Minimal host sample for clients embedding the SDK flow.
export default function App() {
   const startOVSE = () => {
      const config = {
         token: "",
         apiKey: "YOUR_GRIDLINES_API_KEY",
         environment: "staging",
         mode: "ovse",
         ovse: {
            apiBaseUrl: "https://api-dev.gridlines.io/uidai-api/ovse",
            apiKey: "YOUR_GRIDLINES_API_KEY",
            initialApiKey: "YOUR_GRIDLINES_API_KEY",
            channelType: "APP",
            templateId: "1",
            expiryTimeInSeconds: 3600,
            consent: "Y",
            appPackageId: "in.ongrid.lav",
            appSignature: "REPLACE_WITH_REGISTERED_SIGNATURE",
            pollingIntervalMs: 5000,
            maxPollAttempts: 60,
         },
         texts: {
            welcomeTitle: "Aadhaar OVSE",
            startButtonLabel: "Start OVSE",
            ovseInputLabel: "API Key",
            ovseSubmitLabel: "Start Flow",
         },
      };

      // Example only: pass this config to SDK launcher in your host app wrapper.
      console.log("Launch SDK with config", config);
   };

   return (
      <SafeAreaView style={styles.container}>
         <View style={styles.card}>
            <Text style={styles.title}>OVSE SDK Host Sample</Text>
            <Text style={styles.subtitle}>Use this screen as the client-side handoff point.</Text>
            <TouchableOpacity style={styles.button} onPress={startOVSE}>
               <Text style={styles.buttonText}>Build Config + Launch SDK</Text>
            </TouchableOpacity>
         </View>
      </SafeAreaView>
   );
}

const styles = StyleSheet.create({
   container: {
      flex: 1,
      backgroundColor: "#f3f4f6",
      justifyContent: "center",
      padding: 24,
   },
   card: {
      backgroundColor: "#ffffff",
      borderRadius: 12,
      padding: 20,
   },
   title: {
      fontSize: 20,
      fontWeight: "700",
      color: "#111827",
      marginBottom: 8,
   },
   subtitle: {
      fontSize: 14,
      color: "#4b5563",
      marginBottom: 20,
   },
   button: {
      backgroundColor: "#2563eb",
      borderRadius: 10,
      paddingVertical: 14,
      alignItems: "center",
   },
   buttonText: {
      color: "#ffffff",
      fontWeight: "600",
   },
});
