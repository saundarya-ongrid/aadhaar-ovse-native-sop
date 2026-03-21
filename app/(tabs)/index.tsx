import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

const { height, width } = Dimensions.get("window");

export default function HomeScreen() {
   const [selectedMode, setSelectedMode] = useState<"landing" | "webview" | "native">("landing");
   const [url, setUrl] = useState("");
   const [webViewUrl, setWebViewUrl] = useState("");
   const [loadingError, setLoadingError] = useState("");
   const [isLoading, setIsLoading] = useState(false);
   const webViewRef = useRef<WebView>(null);

   const handleWebViewPress = () => {
      setSelectedMode("webview");
   };

   const handleNativePress = () => {
      router.push("/ovse-test" as any);
   };

   const handleGoPress = () => {
      let formattedUrl = url.trim();
      if (formattedUrl && !formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
         formattedUrl = "https://" + formattedUrl;
      }
      // Add cache-busting timestamp for iOS
      const separator = formattedUrl.includes("?") ? "&" : "?";
      const cacheBustedUrl = formattedUrl + separator + "_t=" + Date.now();
      setWebViewUrl(cacheBustedUrl);
      setLoadingError("");
      setIsLoading(true);
   };

   const handleRefresh = () => {
      if (webViewRef.current) {
         webViewRef.current.reload();
         setLoadingError("");
         setIsLoading(true);
      }
   };

   const handleClearAndReload = () => {
      // Force complete reload by resetting the URL with new timestamp
      let formattedUrl = url.trim();
      if (formattedUrl && !formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
         formattedUrl = "https://" + formattedUrl;
      }
      const separator = formattedUrl.includes("?") ? "&" : "?";
      const cacheBustedUrl = formattedUrl + separator + "_t=" + Date.now();
      setWebViewUrl("");
      setTimeout(() => {
         setWebViewUrl(cacheBustedUrl);
         setLoadingError("");
         setIsLoading(true);
      }, 100);
   };

   const handleBack = () => {
      setSelectedMode("landing");
      setUrl("");
      setWebViewUrl("");
      setLoadingError("");
      setIsLoading(false);
   };

   // Landing Page
   if (selectedMode === "landing") {
      return (
         <LinearGradient
            colors={["#667eea", "#764ba2", "#f093fb"]}
            style={styles.gradientContainer}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
         >
            <StatusBar barStyle="light-content" />
            <SafeAreaView style={styles.safeArea}>
               <View style={styles.landingContainer}>
                  <View style={styles.headerSection}>
                     <Text style={styles.title}>Aadhaar OVSE</Text>
                     <Text style={styles.subtitle}>Choose your viewing mode</Text>
                  </View>

                  <View style={styles.buttonContainer}>
                     <TouchableOpacity style={styles.modeButton} onPress={handleWebViewPress} activeOpacity={0.8}>
                        <LinearGradient
                           colors={["#4facfe", "#00f2fe"]}
                           style={styles.buttonGradient}
                           start={{ x: 0, y: 0 }}
                           end={{ x: 1, y: 1 }}
                        >
                           <Text style={styles.buttonIcon}>🌐</Text>
                           <Text style={styles.buttonTitle}>Web View</Text>
                           <Text style={styles.buttonDescription}>Browse any website within the app</Text>
                        </LinearGradient>
                     </TouchableOpacity>

                     <TouchableOpacity style={styles.modeButton} onPress={handleNativePress} activeOpacity={0.8}>
                        <LinearGradient
                           colors={["#a8edea", "#fed6e3"]}
                           style={styles.buttonGradient}
                           start={{ x: 0, y: 0 }}
                           end={{ x: 1, y: 1 }}
                        >
                           <Text style={styles.buttonIcon}>📱</Text>
                           <Text style={styles.buttonTitle}>Native</Text>
                           <Text style={styles.buttonDescription}>Test OVSE Flow</Text>
                        </LinearGradient>
                     </TouchableOpacity>
                  </View>

                  <View style={styles.footerSection}>
                     <Text style={styles.footerText}>Powered by React Native</Text>
                  </View>
               </View>
            </SafeAreaView>
         </LinearGradient>
      );
   }

   // Web View Mode
   if (selectedMode === "webview") {
      return (
         <SafeAreaView style={styles.webViewContainer}>
            <StatusBar barStyle="dark-content" />
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.flex1}>
               <View style={styles.webViewHeader}>
                  <View style={styles.topRow}>
                     <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                        <Text style={styles.backButtonText}>← Back</Text>
                     </TouchableOpacity>

                     {webViewUrl && (
                        <View style={styles.actionButtons}>
                           <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
                              <Text style={styles.refreshButtonText}>🔄</Text>
                           </TouchableOpacity>
                           <TouchableOpacity onPress={handleClearAndReload} style={styles.clearButton}>
                              <Text style={styles.clearButtonText}>🗑️</Text>
                           </TouchableOpacity>
                        </View>
                     )}
                  </View>

                  <View style={styles.urlInputContainer}>
                     <TextInput
                        style={styles.urlInput}
                        placeholder="Enter URL (e.g., google.com)"
                        placeholderTextColor="#999"
                        value={url}
                        onChangeText={setUrl}
                        autoCapitalize="none"
                        autoCorrect={false}
                        keyboardType="url"
                        returnKeyType="go"
                        onSubmitEditing={handleGoPress}
                     />
                     <TouchableOpacity onPress={handleGoPress} style={styles.goButton}>
                        <Text style={styles.goButtonText}>Go</Text>
                     </TouchableOpacity>
                  </View>

                  {isLoading && (
                     <View style={styles.loadingBar}>
                        <ActivityIndicator size="small" color="#667eea" />
                        <Text style={styles.loadingText}>Loading...</Text>
                     </View>
                  )}
               </View>

               {webViewUrl ? (
                  <>
                     {loadingError ? (
                        <View style={styles.errorView}>
                           <Text style={styles.errorIcon}>⚠️</Text>
                           <Text style={styles.errorText}>Failed to load page</Text>
                           <Text style={styles.errorSubtext}>{loadingError}</Text>
                           <TouchableOpacity
                              onPress={() => {
                                 setWebViewUrl("");
                                 setLoadingError("");
                              }}
                              style={styles.retryButton}
                           >
                              <Text style={styles.retryButtonText}>Try Another URL</Text>
                           </TouchableOpacity>
                        </View>
                     ) : (
                        <WebView
                           ref={webViewRef}
                           source={{ uri: webViewUrl }}
                           style={styles.webView}
                           startInLoadingState={true}
                           scalesPageToFit={true}
                           javaScriptEnabled={true}
                           domStorageEnabled={true}
                           allowsInlineMediaPlayback={true}
                           mediaPlaybackRequiresUserAction={false}
                           mixedContentMode="always"
                           thirdPartyCookiesEnabled={true}
                           sharedCookiesEnabled={true}
                           incognito={true}
                           originWhitelist={["*"]}
                           allowFileAccess={true}
                           allowUniversalAccessFromFileURLs={true}
                           allowFileAccessFromFileURLs={true}
                           setSupportMultipleWindows={false}
                           userAgent="Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1"
                           onLoadStart={() => {
                              console.log("WebView started loading:", webViewUrl);
                              setIsLoading(true);
                           }}
                           onLoadProgress={({ nativeEvent }) => {
                              console.log("Loading progress:", nativeEvent.progress);
                           }}
                           onError={(syntheticEvent) => {
                              const { nativeEvent } = syntheticEvent;
                              console.log("WebView error:", nativeEvent);
                              setLoadingError(nativeEvent.description || "Unknown error occurred");
                              setIsLoading(false);
                           }}
                           onHttpError={(syntheticEvent) => {
                              const { nativeEvent } = syntheticEvent;
                              console.log("HTTP error:", nativeEvent.statusCode, nativeEvent.description);
                              setLoadingError(`HTTP Error: ${nativeEvent.statusCode}`);
                              setIsLoading(false);
                           }}
                           onLoadEnd={() => {
                              console.log("WebView loaded successfully");
                              setIsLoading(false);
                           }}
                           onMessage={(event) => {
                              console.log("Message from WebView:", event.nativeEvent.data);
                           }}
                           renderError={(errorName) => (
                              <View style={styles.errorView}>
                                 <Text style={styles.errorIcon}>⚠️</Text>
                                 <Text style={styles.errorText}>Render Error</Text>
                                 <Text style={styles.errorSubtext}>{errorName}</Text>
                              </View>
                           )}
                        />
                     )}
                  </>
               ) : (
                  <View style={styles.emptyWebView}>
                     <Text style={styles.emptyWebViewIcon}>🌐</Text>
                     <Text style={styles.emptyWebViewText}>Enter a URL above to start browsing</Text>
                     <Text style={styles.emptyWebViewSubtext}>Try: google.com, github.com, or any website</Text>
                  </View>
               )}
            </KeyboardAvoidingView>
         </SafeAreaView>
      );
   }

   // Native Mode (placeholder)
   return (
      <SafeAreaView style={styles.nativeContainer}>
         <StatusBar barStyle="dark-content" />
         <View style={styles.nativeContent}>
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
               <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.nativeTitle}>Native Mode</Text>
            <Text style={styles.nativeText}>Coming soon...</Text>
         </View>
      </SafeAreaView>
   );
}

const styles = StyleSheet.create({
   gradientContainer: {
      flex: 1,
   },
   safeArea: {
      flex: 1,
   },
   landingContainer: {
      flex: 1,
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingVertical: 40,
   },
   headerSection: {
      alignItems: "center",
      marginTop: 40,
   },
   title: {
      fontSize: 42,
      fontWeight: "bold",
      color: "#ffffff",
      marginBottom: 10,
      textShadowColor: "rgba(0, 0, 0, 0.3)",
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 4,
   },
   subtitle: {
      fontSize: 18,
      color: "#ffffff",
      opacity: 0.9,
      textAlign: "center",
   },
   buttonContainer: {
      gap: 20,
      paddingHorizontal: 10,
   },
   modeButton: {
      borderRadius: 20,
      overflow: "hidden",
      elevation: 8,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
   },
   buttonGradient: {
      padding: 30,
      alignItems: "center",
      minHeight: 180,
      justifyContent: "center",
   },
   buttonIcon: {
      fontSize: 50,
      marginBottom: 15,
   },
   buttonTitle: {
      fontSize: 28,
      fontWeight: "bold",
      color: "#fff",
      marginBottom: 8,
      textShadowColor: "rgba(0, 0, 0, 0.2)",
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 3,
   },
   buttonDescription: {
      fontSize: 14,
      color: "#fff",
      opacity: 0.9,
      textAlign: "center",
   },
   footerSection: {
      alignItems: "center",
      marginBottom: 20,
   },
   footerText: {
      fontSize: 12,
      color: "#ffffff",
      opacity: 0.7,
   },
   webViewContainer: {
      flex: 1,
      backgroundColor: "#fff",
   },
   flex1: {
      flex: 1,
   },
   webViewHeader: {
      backgroundColor: "#f8f9fa",
      paddingHorizontal: 15,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: "#e0e0e0",
   },
   topRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 10,
   },
   backButton: {
      paddingVertical: 8,
      paddingHorizontal: 12,
   },
   backButtonText: {
      fontSize: 16,
      color: "#667eea",
      fontWeight: "600",
   },
   actionButtons: {
      flexDirection: "row",
      gap: 10,
   },
   refreshButton: {
      padding: 8,
      backgroundColor: "#fff",
      borderRadius: 8,
      borderWidth: 1,
      borderColor: "#667eea",
   },
   refreshButtonText: {
      fontSize: 18,
   },
   clearButton: {
      padding: 8,
      backgroundColor: "#fff",
      borderRadius: 8,
      borderWidth: 1,
      borderColor: "#e53e3e",
   },
   clearButtonText: {
      fontSize: 18,
   },
   loadingBar: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingVertical: 8,
   },
   loadingText: {
      fontSize: 12,
      color: "#667eea",
      fontWeight: "500",
   },
   urlInputContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#fff",
      borderRadius: 12,
      paddingHorizontal: 15,
      elevation: 2,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
   },
   urlInput: {
      flex: 1,
      height: 45,
      fontSize: 16,
      color: "#333",
   },
   goButton: {
      backgroundColor: "#667eea",
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 8,
      marginLeft: 8,
   },
   goButtonText: {
      color: "#fff",
      fontWeight: "600",
      fontSize: 16,
   },
   webView: {
      flex: 1,
   },
   emptyWebView: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#f8f9fa",
      paddingHorizontal: 40,
   },
   emptyWebViewIcon: {
      fontSize: 80,
      marginBottom: 20,
   },
   emptyWebViewText: {
      fontSize: 20,
      fontWeight: "600",
      color: "#333",
      textAlign: "center",
      marginBottom: 10,
   },
   emptyWebViewSubtext: {
      fontSize: 14,
      color: "#666",
      textAlign: "center",
   },
   nativeContainer: {
      flex: 1,
      backgroundColor: "#fff",
   },
   nativeContent: {
      flex: 1,
      padding: 20,
   },
   nativeTitle: {
      fontSize: 32,
      fontWeight: "bold",
      color: "#333",
      marginBottom: 10,
      marginTop: 40,
   },
   nativeText: {
      fontSize: 18,
      color: "#666",
   },
   errorView: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#fff5f5",
      paddingHorizontal: 40,
   },
   errorIcon: {
      fontSize: 80,
      marginBottom: 20,
   },
   errorText: {
      fontSize: 20,
      fontWeight: "600",
      color: "#e53e3e",
      textAlign: "center",
      marginBottom: 10,
   },
   errorSubtext: {
      fontSize: 14,
      color: "#666",
      textAlign: "center",
      marginBottom: 20,
   },
   retryButton: {
      backgroundColor: "#667eea",
      paddingHorizontal: 30,
      paddingVertical: 12,
      borderRadius: 8,
      marginTop: 10,
   },
   retryButtonText: {
      color: "#fff",
      fontWeight: "600",
      fontSize: 16,
   },
});
