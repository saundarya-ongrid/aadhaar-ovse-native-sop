/**
 * OVSE Test Screen
 * Simple test harness for the OVSE flow with new API contracts
 *
 * IMPORTANT: App Package ID and Signature
 * ========================================
 *
 * Android:
 * - app_package_id: Get from android/app/build.gradle -> applicationId (e.g., "com.yourcompany.app")
 * - app_signature: SHA-256 certificate fingerprint
 *   Get via: cd android && ./gradlew signingReport
 *   Look for: SHA-256: AA:BB:CC:DD:EE:FF:... (64 hex characters)
 *
 * iOS:
 * - app_package_id: Get from Info.plist -> CFBundleIdentifier (e.g., "com.yourcompany.app")
 * - app_signature: Team ID from Apple Developer account (e.g., "ABC123XYZ4")
 *   Get via: Xcode -> Project -> Signing & Capabilities -> Team ID
 *   Or leave as placeholder if UIDAI doesn't strictly validate iOS signatures
 *
 * Update OVSEAPIService.getAppIdentifiers() method below with your actual values
 */

import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
   ActivityIndicator,
   Alert,
   AppState,
   DeviceEventEmitter,
   Image,
   KeyboardAvoidingView,
   Linking,
   Modal,
   NativeModules,
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

const { OvseModule } = NativeModules;

// Storage key for runtime persistence
const OVSE_RUNTIME_KEY = "ovse:runtime";

// Runtime persistence interface
interface OVSERuntime {
   apiKey: string;
   transactionId: string;
   expiresAt: number;
   scanUri: string; // For launching Aadhaar app
}

const extractXmlTagValue = (xmlPayload: string, tagName: string): string => {
   const tagRegex = new RegExp(`<${tagName}>([\\s\\S]*?)<\\/${tagName}>`, "i");
   const match = xmlPayload.match(tagRegex);
   return match?.[1]?.trim() || "";
};

const buildCallbackXmlPayload = (xmlCandidates: string[], transactionId: string, rawPayload: string): string | null => {
   // 1. Look for <Credential> tag inside any XML candidate
   for (const candidate of xmlCandidates) {
      const trimmedCandidate = candidate.trim();
      const callbackTxnId = extractXmlTagValue(trimmedCandidate, "TxnID") || transactionId;
      const callbackCredential = extractXmlTagValue(trimmedCandidate, "Credential");
      if (callbackCredential) {
         return `<Request><TxnID>${callbackTxnId}</TxnID><Credential>${callbackCredential}</Credential></Request>`;
      }
   }

   // 2. Check JSON extras for the response payload that Aadhaar returns.
   //    Aadhaar typically uses key "response" or "Response"; Gridlines may use "Credential".
   //    We use the raw value from those keys directly as <Credential>.
   try {
      const parsed = JSON.parse(rawPayload);
      const extras = parsed?.extras ?? {};

      // Priority-ordered keys that Aadhaar / UIDAI return credentials under
      const candidateKeys = [
         "Credential",
         "credential",
         "response",
         "Response",
         "authResponse",
         "authRes",
         "authresp",
         "data",
         "result",
         "payload",
      ];

      for (const key of candidateKeys) {
         const val = extras[key];
         if (typeof val === "string" && val.trim() && val !== "null" && val !== "undefined") {
            return `<Request><TxnID>${transactionId}</TxnID><Credential>${val.trim()}</Credential></Request>`;
         }
      }

      // Fallback: any extra value long enough to be a real credential (not a short status code)
      for (const [key, val] of Object.entries(extras)) {
         if (key === "resultCode" || key === "resultcode") continue;
         if (typeof val === "string" && val.trim().length > 30) {
            return `<Request><TxnID>${transactionId}</TxnID><Credential>${val.trim()}</Credential></Request>`;
         }
      }
   } catch {
      // rawPayload is not JSON
   }

   return null;
};

const extractXmlCandidates = (payload: string): string[] => {
   const candidates = new Set<string>();

   if (!payload) {
      return [];
   }

   if (payload.includes("<") && payload.includes(">")) {
      candidates.add(payload);
   }

   try {
      const parsed = JSON.parse(payload);
      const walk = (value: unknown) => {
         if (typeof value === "string") {
            if (value.includes("<") && value.includes(">")) {
               candidates.add(value);
            }
            return;
         }

         if (Array.isArray(value)) {
            value.forEach(walk);
            return;
         }

         if (value && typeof value === "object") {
            Object.values(value).forEach(walk);
         }
      };

      walk(parsed);
   } catch {
      // Raw string payload only.
   }

   return [...candidates];
};

const summarizeXmlPayload = (xmlPayload: string): string[] => {
   const summaries: string[] = [];
   const trimmedXml = xmlPayload.trim();
   const tagRegex = /<([A-Za-z0-9_:-]+)>([^<]{1,200})<\/\1>/g;
   let match: RegExpExecArray | null;

   while ((match = tagRegex.exec(trimmedXml)) !== null && summaries.length < 8) {
      const [, tagName, tagValue] = match;
      const cleanValue = tagValue.trim();
      if (cleanValue) {
         summaries.push(`${tagName}: ${cleanValue}`);
      }
   }

   if (summaries.length === 0) {
      summaries.push(`XML payload detected (${trimmedXml.substring(0, 180)}...)`);
   }

   return summaries;
};

// API Service for OVSE Integration
class OVSEAPIService {
   private static BASE_URL = "https://api-dev.gridlines.io/uidai-api/ovse";

   static getDefaultCallbackUrl() {
      return `${this.BASE_URL}/callback`;
   }

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

   /**
    * Get app package ID and signature
    * For Android: package name and SHA-256 certificate fingerprint
    * For iOS: bundle identifier and Team ID (or leave empty as not required by UIDAI)
    */
   private static async getAppIdentifiers() {
      if (Platform.OS === "android") {
         let runtimeSignature = "";
         let runtimePackageId = "";

         try {
            if (OvseModule?.getAppSignatureBase64) {
               runtimeSignature = await OvseModule.getAppSignatureBase64();
               console.log("[OVSE] Android runtime app_signature (Base64 SHA-256):", runtimeSignature);
            }
         } catch (error) {
            console.warn("[OVSE] Failed to fetch runtime Android signature, using fallback:", error);
         }

         try {
            if (OvseModule?.getAppPackageId) {
               runtimePackageId = await OvseModule.getAppPackageId();
               console.log("[OVSE] Android runtime app_package_id:", runtimePackageId);
            }
         } catch (error) {
            console.warn("[OVSE] Failed to fetch runtime Android package id, using fallback:", error);
         }

         // Android: Package name and SHA-256 certificate fingerprint
         // Package must match the installed app's applicationId
         // app_signature must be Base64(SHA-256(cert bytes))
         return {
            app_package_id: runtimePackageId || "in.ongrid.lav",
            // Fallback value retained for safety if native retrieval fails
            app_signature: runtimeSignature || "+sYXRdwJA3hvue3mKpYrOZ9zSPC7b4mbgzJmdZEDO5w=",
         };
      } else {
         // iOS: MUST match actual Bundle ID in Xcode
         // Set in Xcode: Target → General → Bundle Identifier = in.ongrid.lav
         return {
            app_package_id: "in.ongrid.lav", // Registered with UIDAI
            app_signature: "DZ54P8HK5D", // Team ID
         };
      }
   }

   /**
    * NEW: Generate Token for App-to-App flow
    * POST /ovse/generate-token
    * Channel: APP (for mobile app-to-app), WEB (for browser redirect)
    */
   static async generateToken(apiKey: string, channelType: "APP" | "WEB" = "APP") {
      const { app_package_id, app_signature } = await this.getAppIdentifiers();

      const body: any = {
         channel_type: channelType,
         template_id: "1",
         expiry_time_in_seconds: 3600,
         consent: "Y",
      };

      // Add app identifiers only for APP channel
      if (channelType === "APP") {
         body.app_package_id = app_package_id;
         body.app_signature = app_signature;
      }

      const response = await fetch(`${this.BASE_URL}/generate-token`, {
         method: "POST",
         headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "X-API-Key": apiKey,
            "X-Auth-Type": "Api-Key",
            "X-GLN-Source": "API",
         },
         body: JSON.stringify(body),
      });
      return this.parseResponse(response);
   }

   /**
    * NEW: Generate QR Code
    * POST /ovse/generate-qr
    * For desktop/web QR code based verification
    */
   static async generateQR(apiKey: string) {
      const response = await fetch(`${this.BASE_URL}/generate-qr`, {
         method: "POST",
         headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "X-API-Key": apiKey,
            "X-Auth-Type": "Api-Key",
            "X-GLN-Source": "API",
         },
         body: JSON.stringify({
            template_id: "1",
            expiry_time_in_seconds: 3600,
            consent: "Y",
         }),
      });
      return this.parseResponse(response);
   }

   /**
    * NEW: Check Status (GET with transaction ID in header)
    * GET /ovse/status
    * X-Transaction-ID: {transaction_id}
    */
   static async checkStatus(apiKey: string, transactionId: string) {
      const response = await fetch(`${this.BASE_URL}/status`, {
         method: "GET",
         headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "X-API-Key": apiKey,
            "X-Auth-Type": "Api-Key",
            "X-GLN-Source": "API",
            "X-Transaction-ID": transactionId,
         },
      });
      return this.parseResponse(response);
   }

   static async sendCallback(apiKey: string, callbackXml: string, callbackUrl?: string) {
      const targetUrl = callbackUrl || `${this.BASE_URL}/callback`;
      const response = await fetch(targetUrl, {
         method: "POST",
         headers: {
            "Content-Type": "application/xml",
            Accept: "application/json, application/xml, text/plain, */*",
            "X-API-Key": apiKey,
            "X-Auth-Type": "Api-Key",
            "X-GLN-Source": "API",
         },
         body: callbackXml,
      });

      const responseText = await response.text();
      if (!response.ok) {
         throw new Error(`Callback API failed (${response.status}): ${responseText.substring(0, 200)}`);
      }

      if (!responseText.trim()) {
         return { status: response.status, data: null };
      }

      try {
         return JSON.parse(responseText);
      } catch {
         return { status: response.status, data: responseText };
      }
   }
}

export default function OVSETestScreen() {
   const [apiKey, setApiKey] = useState("WtTd78f6ALkaRIsy1e0nI2YMnC2im0MX");
   const [isLoading, setIsLoading] = useState(false);
   const [status, setStatus] = useState("");
   const [sessionData, setSessionData] = useState<any>(null);
   const [pollingActive, setPollingActive] = useState(false);
   const [pollCount, setPollCount] = useState(0);
   const [ovseResult, setOvseResult] = useState<any>(null);
   const [showResultModal, setShowResultModal] = useState(false);
   const [debugLogs, setDebugLogs] = useState<Array<{ time: string; type: string; message: string }>>([]);
   const [showDebugPanel, setShowDebugPanel] = useState(true);
   const [autoScrollLogs, setAutoScrollLogs] = useState(true);
   const debugScrollRef = useRef<ScrollView>(null);
   const autoScrollLogsRef = useRef(true);
   const sessionDataRef = useRef<any>(null);
   const pollingActiveRef = useRef(false);
   const lastIntentPayloadRef = useRef<string>("");
   const callbackPostedPayloadsRef = useRef<Set<string>>(new Set());
   const awaitingAadhaarReturnRef = useRef(false);
   // Holds the processIntentResponse function so AppState handler can call it
   const processIntentResponseRef = useRef<((source: string, payload?: string | null) => Promise<void>) | null>(null);

   // Refs for polling control
   const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
   const appStateRef = useRef(AppState.currentState);

   useEffect(() => {
      autoScrollLogsRef.current = autoScrollLogs;
   }, [autoScrollLogs]);

   useEffect(() => {
      sessionDataRef.current = sessionData;
   }, [sessionData]);

   useEffect(() => {
      pollingActiveRef.current = pollingActive;
   }, [pollingActive]);

   // Debug logger function
   const addLog = (type: "INFO" | "SUCCESS" | "ERROR" | "API" | "METHOD", message: string) => {
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}.${now.getMilliseconds().toString().padStart(3, "0")}`;
      const logEntry = { time: timeStr, type, message };
      setDebugLogs((prev) => [...prev, logEntry]);
      console.log(`[${type}] ${message}`);
      // Scroll only when user keeps auto-scroll enabled.
      if (autoScrollLogsRef.current) {
         setTimeout(() => debugScrollRef.current?.scrollToEnd({ animated: true }), 100);
      }
   };

   const clearLogs = () => {
      addLog("INFO", "🗑️ Debug logs cleared");
      setDebugLogs([]);
   };

   const handleBack = () => {
      // Clean up polling on exit
      if (pollIntervalRef.current) {
         clearInterval(pollIntervalRef.current);
      }
      router.back();
   };

   // Save runtime to storage (disabled - AsyncStorage removed)
   const saveRuntime = async (runtime: OVSERuntime) => {
      // No-op: AsyncStorage was causing build issues
      console.log("ℹ️ Runtime persistence disabled");
   };

   // Load runtime from storage (disabled - AsyncStorage removed)
   const loadRuntime = async (): Promise<OVSERuntime | null> => {
      // No-op: AsyncStorage was causing build issues
      return null;
   };

   // Clear runtime from storage (disabled - AsyncStorage removed)
   const clearRuntime = async () => {
      // No-op: AsyncStorage was causing build issues
      console.log("ℹ️ Runtime persistence disabled");
   };

   // Stop polling
   const stopPolling = () => {
      if (pollIntervalRef.current) {
         clearInterval(pollIntervalRef.current);
         pollIntervalRef.current = null;
      }
      setPollingActive(false);
   };

   // Handle app state changes (when returning from Aadhaar app)
   useEffect(() => {
      const subscription = AppState.addEventListener("change", async (nextAppState) => {
         console.log("AppState changed:", appStateRef.current, "->", nextAppState);

         // User returned to app from background
         if (appStateRef.current.match(/inactive|background/) && nextAppState === "active") {
            console.log("📱 App came to foreground - checking for active runtime");

            // Try to restore runtime and continue polling
            const runtime = await loadRuntime();
            if (runtime && !pollingActive) {
               console.log("🔄 Resuming polling after return from Aadhaar app");
               setSessionData({
                  apiKey: runtime.apiKey,
                  transactionId: runtime.transactionId,
                  scanUri: runtime.scanUri,
               });
               setStatus("Returned from Aadhaar app - checking status...");

               // Immediately poll once, then start regular polling
               pollOnce(runtime.apiKey, runtime.transactionId);
               startPolling(runtime.apiKey, runtime.transactionId);
            }

            // Check native pending return payload when coming back from Aadhaar app.
            // onActivityResult / onNewIntent may fire slightly after AppState, so we retry.
            if (awaitingAadhaarReturnRef.current && OvseModule?.getPendingIntentResponse) {
               let foundPayload = false;
               for (let attempt = 0; attempt < 6; attempt++) {
                  // Small delay on first retry so native side can finish processing
                  if (attempt > 0) {
                     await new Promise((r) => setTimeout(r, 600));
                  }
                  try {
                     const pendingPayload = await OvseModule.getPendingIntentResponse();
                     if (pendingPayload && pendingPayload !== lastIntentPayloadRef.current) {
                        addLog("METHOD", `📥 Aadhaar return payload found (attempt ${attempt + 1}) via AppState retry`);
                        await processIntentResponseRef.current?.("appstate-retry", pendingPayload);
                        if (OvseModule?.clearPendingIntentResponse) {
                           await OvseModule.clearPendingIntentResponse();
                        }
                        foundPayload = true;
                        break;
                     }
                  } catch (error: any) {
                     addLog(
                        "ERROR",
                        `Pending intent check (attempt ${attempt + 1}) failed: ${error?.message || error}`,
                     );
                     break;
                  }
               }
               if (!foundPayload) {
                  addLog(
                     "INFO",
                     "Aadhaar return payload not found after retries (DeviceEventEmitter may still deliver it)",
                  );
               }
            }
         }

         appStateRef.current = nextAppState;
      });

      return () => {
         subscription.remove();
      };
   }, [pollingActive]);

   // Cleanup on unmount
   useEffect(() => {
      return () => {
         stopPolling();
      };
   }, []);

   // Try to restore runtime on mount
   useEffect(() => {
      const restoreOnMount = async () => {
         const runtime = await loadRuntime();
         if (runtime) {
            console.log("🔄 Restoring saved runtime on mount");
            setSessionData({
               apiKey: runtime.apiKey,
               transactionId: runtime.transactionId,
               scanUri: runtime.scanUri,
            });
            setStatus("Restored active session - polling...");
            startPolling(runtime.apiKey, runtime.transactionId);
         }
      };

      restoreOnMount();
   }, []);

   // Handle Aadhaar app return intents for APP-to-APP flow.
   useEffect(() => {
      if (Platform.OS !== "android") {
         return;
      }

      const processIntentResponse = async (source: string, payload?: string | null) => {
         if (!payload) {
            return;
         }
         if (lastIntentPayloadRef.current === payload) {
            return;
         }

         lastIntentPayloadRef.current = payload;

         addLog("METHOD", `📥 Aadhaar return intent received (${source})`);
         // Log full raw payload - truncate only if very long
         addLog("INFO", `RAW payload (${payload.length} chars): ${payload.substring(0, 400)}`);

         try {
            const parsedPayload = JSON.parse(payload);
            const action = parsedPayload?.action || "(none)";
            const data = parsedPayload?.data || "(none)";
            const extras = parsedPayload?.extras || {};
            const extraKeys = Object.keys(extras);

            addLog("INFO", `Intent action: ${action}`);
            addLog("INFO", `Intent data: ${String(data).substring(0, 200)}`);

            if (extraKeys.length === 0) {
               addLog("ERROR", "⚠️ Intent extras is EMPTY - Aadhaar returned no data");
            } else {
               addLog("INFO", `Intent extras keys (${extraKeys.length}): ${extraKeys.join(", ")}`);
               // Log every extra value in full
               for (const key of extraKeys) {
                  const val = String(extras[key] ?? "");
                  addLog("INFO", `  extra[${key}] = ${val.substring(0, 300)}`);
               }
            }
         } catch {
            addLog("INFO", "Intent payload is not JSON - treating as raw string");
         }

         const xmlCandidates = extractXmlCandidates(payload);
         if (xmlCandidates.length > 0) {
            addLog(
               "SUCCESS",
               `XML payload detected in intent (${xmlCandidates.length} candidate${xmlCandidates.length > 1 ? "s" : ""})`,
            );
            summarizeXmlPayload(xmlCandidates[0]).forEach((line) => addLog("INFO", line));
         }

         setStatus("Returned from Aadhaar app. Verifying status...");

         const activeSession = sessionDataRef.current;
         if (!activeSession?.apiKey || !activeSession?.transactionId) {
            addLog("ERROR", "No active session available to verify Aadhaar return intent");
            return;
         }

         const callbackXml = buildCallbackXmlPayload(xmlCandidates, activeSession.transactionId, payload);
         if (callbackXml) {
            if (!callbackPostedPayloadsRef.current.has(payload)) {
               try {
                  addLog(
                     "API",
                     `📤 Posting Aadhaar callback XML to ${activeSession.callbackUrl || "default /callback"}`,
                  );
                  addLog("INFO", `Callback XML: ${callbackXml.substring(0, 220)}...`);
                  const callbackResponse = await OVSEAPIService.sendCallback(
                     activeSession.apiKey,
                     callbackXml,
                     activeSession.callbackUrl,
                  );
                  callbackPostedPayloadsRef.current.add(payload);
                  addLog(
                     "SUCCESS",
                     `✅ Callback API accepted (${JSON.stringify(callbackResponse).substring(0, 140)}...)`,
                  );
               } catch (error: any) {
                  addLog("ERROR", `Callback API failed: ${error?.message || error}`);
               }
            }
         } else {
            addLog("ERROR", "No Credential XML found in Aadhaar return intent; callback API not sent");
         }

         awaitingAadhaarReturnRef.current = false;

         await pollOnce(activeSession.apiKey, activeSession.transactionId);

         if (!pollingActiveRef.current) {
            startPolling(activeSession.apiKey, activeSession.transactionId);
         }
      };

      // Expose to AppState handler so it can process pending payload retries.
      processIntentResponseRef.current = processIntentResponse;

      const intentSubscription = DeviceEventEmitter.addListener("OVSE_INTENT_RESPONSE", (event: any) => {
         void processIntentResponse("event", event?.payload);
      });

      const checkPendingIntent = async () => {
         try {
            if (!OvseModule?.getPendingIntentResponse) {
               return;
            }

            const pendingPayload = await OvseModule.getPendingIntentResponse();
            if (pendingPayload) {
               await processIntentResponse("pending", pendingPayload);
               if (OvseModule?.clearPendingIntentResponse) {
                  await OvseModule.clearPendingIntentResponse();
               }
            }
         } catch (error: any) {
            addLog("ERROR", `Failed to read pending Aadhaar intent: ${error?.message || error}`);
         }
      };

      void checkPendingIntent();

      return () => {
         processIntentResponseRef.current = null;
         intentSubscription.remove();
      };
   }, []);

   const handleSubmit = async () => {
      addLog("METHOD", "▶️ handleSubmit() called");
      if (!apiKey.trim()) {
         addLog("ERROR", "API Key is empty");
         Alert.alert("Error", "Please enter an API Key");
         return;
      }

      setIsLoading(true);
      setStatus("Generating intent for app-to-app flow...");
      addLog("INFO", "Starting OVSE flow...");

      try {
         // Single API call to generate token for APP channel
         addLog("API", "📤 Calling generateToken API (channel: APP)");
         const tokenResponse = await OVSEAPIService.generateToken(apiKey, "APP");
         addLog("API", `📥 Token Response: ${JSON.stringify(tokenResponse).substring(0, 200)}...`);
         console.log("Token Response:", tokenResponse);

         // Check response structure
         if (tokenResponse?.status !== 200 || !tokenResponse?.data) {
            addLog("ERROR", `Invalid response: status=${tokenResponse?.status}`);
            throw new Error(tokenResponse?.data?.message || "Failed to generate token");
         }
         addLog("SUCCESS", "✅ Token generated successfully");

         // API can return either scan_uri or jwt_token depending on implementation
         const { transaction_id, scan_uri, jwt_token, expires_at } = tokenResponse.data;
         addLog("INFO", `Transaction ID: ${transaction_id}`);

         // Use jwt_token if scan_uri is not present
         const intentToken = scan_uri || jwt_token;
         addLog("INFO", `Intent token length: ${intentToken?.length || 0}`);

         if (!transaction_id || !intentToken) {
            addLog("ERROR", "Missing transaction_id or token");
            throw new Error(
               `Invalid response: missing transaction_id or token. Got: ${JSON.stringify(tokenResponse.data)}`,
            );
         }

         let callbackUrl = OVSEAPIService.getDefaultCallbackUrl();

         // Decode JWT to verify backend configuration
         addLog("INFO", "🔍 Decoding JWT token...");
         console.log("\n=== JWT VERIFICATION ===");
         try {
            const jwtParts = intentToken.split(".");
            if (jwtParts.length === 3) {
               // Decode Base64URL payload
               const base64Url = jwtParts[1];
               const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
               const payload = JSON.parse(
                  decodeURIComponent(
                     atob(base64)
                        .split("")
                        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
                        .join(""),
                  ),
               );

               console.log("JWT Payload:", JSON.stringify(payload, null, 2));
               addLog("INFO", `JWT aid: ${payload.aid}`);
               addLog("INFO", `JWT asig: ${payload.asig?.substring(0, 20)}...`);
               addLog("INFO", `JWT ac (Client ID): ${payload.ac}`);
               addLog("INFO", `JWT sa (Reg#): ${payload.sa}`);
               addLog("INFO", `JWT channel: ${payload.ch}`);
               addLog("INFO", `JWT callback: ${payload.cb}`);
               if (typeof payload.cb === "string" && payload.cb.trim()) {
                  callbackUrl = payload.cb.trim();
               }
               console.log("\n=== CRITICAL FIELDS ===");
               console.log("aid (app_package_id):", payload.aid);
               console.log("asig (app_signature):", payload.asig);
               console.log("ac (OVSE Client ID):", payload.ac);
               console.log("sa (Registration Number):", payload.sa);
               console.log("ch (channel):", payload.ch);
               console.log("cb (callback URL):", payload.cb);
               console.log("aud (audience):", payload.aud);

               // Compare with actual runtime package on Android (or configured bundle id on iOS)
               try {
                  let expectedAppId = "in.ongrid.lav";
                  if (Platform.OS === "android" && OvseModule?.getAppPackageId) {
                     expectedAppId = await OvseModule.getAppPackageId();
                  }

                  if (payload.aid && payload.aid !== expectedAppId) {
                     addLog("ERROR", `⚠️ App ID mismatch! JWT aid: ${payload.aid}, runtime: ${expectedAppId}`);
                  }
               } catch (e) {
                  console.warn("Failed to validate runtime app id", e);
               }

               console.log("========================\n");
            }
         } catch (error) {
            console.error("Failed to decode JWT:", error);
         }

         setStatus("Token generated! Launching Aadhaar app...");
         setSessionData({
            apiKey,
            transactionId: transaction_id,
            scanUri: intentToken,
            callbackUrl,
         });

         // Save runtime for app state restoration
         await saveRuntime({
            apiKey,
            transactionId: transaction_id,
            expiresAt: expires_at || Date.now() + 3600 * 1000,
            scanUri: intentToken,
         });

         // Launch Aadhaar app with intent token
         addLog("METHOD", `🚀 Launching Aadhaar app on ${Platform.OS}`);
         console.log("Launching Aadhaar app on", Platform.OS);
         console.log("Intent token length:", intentToken.length);

         try {
            if (Platform.OS === "ios") {
               // iOS: Use verified working scheme - pehchaan:// (with double 'a')
               // The token might be a JWT or a URL, handle both cases
               let aadhaarUrl = intentToken;

               // If it's a web URL, extract the token parameter
               if (intentToken.includes("maadhaar.com") || intentToken.includes("http")) {
                  // Extract token from URL parameter
                  const urlParams = new URL(intentToken).searchParams;
                  const token = urlParams.get("value") || urlParams.get("req");
                  if (token) {
                     aadhaarUrl = `pehchaan://in.gov.uidai.pehchaan?req=${token}`;
                  }
               } else {
                  // It's a raw JWT token, build the URL
                  aadhaarUrl = `pehchaan://in.gov.uidai.pehchaan?req=${intentToken}`;
               }

               console.log("\n=== iOS App Launch ===");
               console.log("Using URL:", aadhaarUrl.substring(0, 100) + "...");
               addLog("INFO", `iOS URL: ${aadhaarUrl.substring(0, 80)}...`);

               await Linking.openURL(aadhaarUrl);
               addLog("SUCCESS", "✅ Aadhaar app launched (iOS)");
               console.log("✅ Aadhaar app launched successfully");
               setStatus("Aadhaar app launched. Complete verification there...");

               // Start polling IMMEDIATELY (no delay)
               addLog("METHOD", "🔄 Starting polling...");
               startPolling(apiKey, transaction_id);
            } else {
               // Android: Use official UIDAI Intent as per documentation
               // val intent = Intent("in.gov.uidai.pehchaan.INTENT_REQUEST").apply {
               //     putExtra("request", jwt)
               // }
               console.log("Android Intent with token (length:", intentToken.length, ")");

               // Extract token if it's a web URL, otherwise use as-is
               let androidToken = intentToken;
               if (intentToken.includes("maadhaar.com") || intentToken.includes("http")) {
                  const urlParams = new URL(intentToken).searchParams;
                  androidToken = urlParams.get("value") || urlParams.get("req") || intentToken;
               }

               try {
                  addLog("INFO", `Android token length: ${androidToken.length}`);
                  console.log("Launching Aadhaar app via native module with token length:", androidToken.length);

                  // Use native module to launch with proper Intent.putExtra()
                  await OvseModule.launchAadhaarApp(androidToken);

                  addLog("SUCCESS", "✅ Aadhaar app launched (Android)");
                  console.log(`✅ Aadhaar app launched successfully`);
                  setStatus("Aadhaar app launched. Complete verification there...");
                  awaitingAadhaarReturnRef.current = true;
               } catch (err: any) {
                  addLog("ERROR", `Launch failed: ${err.message}`);
                  console.log(`Failed to launch:`, err);
                  throw new Error(err.message || "Unable to launch Aadhaar app");
               }

               // Start polling IMMEDIATELY (no delay)
               addLog("METHOD", "🔄 Starting polling...");
               startPolling(apiKey, transaction_id);
            }
         } catch (error: any) {
            addLog("ERROR", `❌ Failed to launch Aadhaar: ${error.message}`);
            console.error("Failed to launch Aadhaar app:", error);
            const errorMessage = error.message || error.toString();

            Alert.alert(
               "Aadhaar App Not Found",
               "Unable to launch Aadhaar app. Please ensure:\n\n1. Aadhaar app is installed on your device\n2. Try again or continue with polling",
               [
                  {
                     text: "Start Polling",
                     onPress: () => startPolling(apiKey, transaction_id),
                  },
                  { text: "Cancel", style: "cancel" },
               ],
            );
         }
      } catch (error: any) {
         addLog("ERROR", `❌ OVSE Error: ${error.message || error}`);
         console.error("OVSE Error:", error);
         const errorMsg = error.message || error.toString() || "Failed to complete OVSE flow";
         Alert.alert("Error", errorMsg);
         setStatus(`Error: ${errorMsg}`);
         await clearRuntime();
      } finally {
         setIsLoading(false);
      }
   };

   // Poll once immediately
   const pollOnce = async (apiKey: string, transactionId: string) => {
      addLog("METHOD", "🔍 pollOnce() called");
      try {
         addLog("API", "📤 Calling checkStatus API (immediate)");
         const statusResponse = await OVSEAPIService.checkStatus(apiKey, transactionId);
         addLog("API", `📥 Status: ${JSON.stringify(statusResponse).substring(0, 150)}...`);
         console.log("Immediate poll result:", statusResponse);
         addLog(
            "INFO",
            `Immediate status code=${statusResponse?.data?.code ?? "(none)"}, message=${statusResponse?.data?.message ?? "(none)"}`,
         );

         // New API returns code 1001 for callback received
         if (statusResponse?.data?.code === "1001" || statusResponse?.data?.code === 1001) {
            addLog("SUCCESS", "🎉 Verification Complete! Code: 1001");
            const ovseData = statusResponse?.data?.ovse_data || statusResponse?.data || null;
            if (ovseData && typeof ovseData === "object") {
               addLog("INFO", `OVSE result fields: ${Object.keys(ovseData).join(", ")}`);
               addLog("INFO", `OVSE result preview: ${JSON.stringify(ovseData).substring(0, 260)}...`);
            }
            stopPolling();
            await clearRuntime();
            setStatus(`✅ Verification Complete!`);
            if (ovseData) {
               setOvseResult(ovseData);
               setShowResultModal(true);
            } else {
               addLog("ERROR", "Status is success but result payload is empty; modal not opened");
            }
         } else {
            setStatus(`Status: ${statusResponse?.data?.message || "Waiting for verification..."}`);
         }
      } catch (error: any) {
         addLog("ERROR", `Immediate status check failed: ${error?.message || error}`);
         console.error("Poll error:", error);
      }
   };

   const startPolling = async (apiKey: string, transactionId: string) => {
      addLog("METHOD", "▶️ startPolling() called");
      // Clear any existing polling interval
      stopPolling();

      setPollingActive(true);
      setPollCount(0);
      setStatus("Polling for status...");
      addLog("INFO", "⏰ Polling started (5s interval, 60 max attempts)");

      let attempts = 0;
      const maxAttempts = 60; // 5 minutes at 5-second intervals

      pollIntervalRef.current = setInterval(async () => {
         attempts++;
         setPollCount(attempts);

         try {
            addLog("API", `📤 Poll ${attempts}/${maxAttempts}: Checking status...`);
            const statusResponse = await OVSEAPIService.checkStatus(apiKey, transactionId);
            addLog(
               "API",
               `📥 Poll ${attempts}: Code ${statusResponse?.data?.code}, Msg: ${statusResponse?.data?.message}`,
            );
            console.log(`Poll ${attempts}/${maxAttempts}:`, statusResponse);
            addLog("INFO", `Poll ${attempts} raw status: ${JSON.stringify(statusResponse).substring(0, 220)}...`);

            // Check for callback received (code 1001)
            if (statusResponse?.data?.code === "1001" || statusResponse?.data?.code === 1001) {
               addLog("SUCCESS", "🎉 SUCCESS! Received code 1001 - Verification complete");
               const ovseData = statusResponse?.data?.ovse_data || statusResponse?.data || null;
               if (ovseData && typeof ovseData === "object") {
                  addLog("INFO", `OVSE result fields: ${Object.keys(ovseData).join(", ")}`);
                  addLog("INFO", `OVSE result preview: ${JSON.stringify(ovseData).substring(0, 260)}...`);
               }
               stopPolling();
               await clearRuntime();
               setStatus(`✅ Verification Complete!`);
               if (ovseData) {
                  setOvseResult(ovseData);
                  setShowResultModal(true);
               } else {
                  addLog("ERROR", "Status is success but result payload is empty; modal not opened");
               }
            } else {
               // Still waiting (code 1000 or other)
               setStatus(`Polling (${attempts}/${maxAttempts})... ${statusResponse.data?.message || "Waiting..."}`);
            }
         } catch (error: any) {
            addLog("ERROR", `Poll ${attempts} failed: ${error?.message || error}`);
            console.error(`Poll ${attempts} error:`, error);
         }

         if (attempts >= maxAttempts) {
            addLog("ERROR", "⏱️ Polling timeout - reached 60 attempts (5 minutes)");
            stopPolling();
            await clearRuntime();
            setStatus("Polling timeout after 5 minutes");
            Alert.alert("Timeout", "Verification did not complete within 5 minutes");
         }
      }, 5000);
   };

   const handleClearState = async () => {
      stopPolling();
      await clearRuntime();
      setApiKey("");
      setStatus("");
      setSessionData(null);
      setPollCount(0);
      setOvseResult(null);
      setShowResultModal(false);
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
                     <Text style={styles.infoText}>API: api-dev.gridlines.io/uidai-api/ovse</Text>
                     <Text style={styles.infoText}>Channel: APP (app-to-app)</Text>
                     <Text style={styles.infoText}>Polling: 5s interval, 60 max attempts</Text>
                  </View>

                  {/* API Key Input */}
                  <View style={styles.inputCard}>
                     <Text style={styles.label}>Enter API Key</Text>
                     <TextInput
                        style={styles.input}
                        value={apiKey}
                        onChangeText={setApiKey}
                        placeholder="X-API-Key"
                        placeholderTextColor="rgba(255, 255, 255, 0.5)"
                        autoCapitalize="none"
                        secureTextEntry={true}
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
                        <Text style={styles.dataLabel}>Transaction ID:</Text>
                        <Text style={styles.dataValue}>{sessionData.transactionId}</Text>
                        <Text style={styles.dataLabel}>Scan URI (first 80 chars):</Text>
                        <Text style={styles.dataValue}>{sessionData.scanUri?.substring(0, 80)}...</Text>
                     </View>
                  )}

                  {/* Instructions */}
                  <View style={styles.instructionsCard}>
                     <Text style={styles.instructionsTitle}>📋 Instructions</Text>
                     <Text style={styles.instructionsText}>1. Enter your X-API-Key from backend</Text>
                     <Text style={styles.instructionsText}>2. Tap "Start OVSE Flow"</Text>
                     <Text style={styles.instructionsText}>3. App generates intent (APP channel)</Text>
                     <Text style={styles.instructionsText}>4. Aadhaar app launches automatically</Text>
                     <Text style={styles.instructionsText}>5. Complete biometric in Aadhaar app</Text>
                     <Text style={styles.instructionsText}>6. Return to see verification result</Text>
                  </View>

                  {/* Debug Panel */}
                  <View style={styles.debugPanel}>
                     <TouchableOpacity style={styles.debugHeader} onPress={() => setShowDebugPanel(!showDebugPanel)}>
                        <Text style={styles.debugTitle}>🐛 Debug Logs ({debugLogs.length})</Text>
                        <Text style={styles.debugToggle}>{showDebugPanel ? "▼" : "▶"}</Text>
                     </TouchableOpacity>

                     {showDebugPanel && (
                        <>
                           <View style={styles.debugControlsRow}>
                              <TouchableOpacity
                                 style={[styles.debugToggleButton, autoScrollLogs && styles.debugToggleButtonActive]}
                                 onPress={() => setAutoScrollLogs(!autoScrollLogs)}
                              >
                                 <Text style={styles.debugToggleButtonText}>
                                    Auto-scroll: {autoScrollLogs ? "ON" : "OFF"}
                                 </Text>
                              </TouchableOpacity>
                           </View>
                           <ScrollView ref={debugScrollRef} style={styles.debugScroll} nestedScrollEnabled={true}>
                              {debugLogs.map((log, idx) => (
                                 <View key={idx} style={styles.debugLogRow}>
                                    <Text style={styles.debugTime}>{log.time}</Text>
                                    <Text
                                       style={[
                                          styles.debugType,
                                          log.type === "ERROR" && styles.debugTypeError,
                                          log.type === "SUCCESS" && styles.debugTypeSuccess,
                                          log.type === "API" && styles.debugTypeApi,
                                          log.type === "METHOD" && styles.debugTypeMethod,
                                       ]}
                                    >
                                       {log.type}
                                    </Text>
                                    <Text style={styles.debugMessage}>{log.message}</Text>
                                 </View>
                              ))}
                              {debugLogs.length === 0 && (
                                 <Text style={styles.debugEmpty}>No logs yet. Start OVSE flow to see logs.</Text>
                              )}
                           </ScrollView>
                           <TouchableOpacity style={styles.debugClearButton} onPress={clearLogs}>
                              <Text style={styles.debugClearText}>Clear Logs</Text>
                           </TouchableOpacity>
                        </>
                     )}
                  </View>
               </ScrollView>
            </KeyboardAvoidingView>
         </SafeAreaView>

         {/* OVSE Result Modal */}
         <Modal
            visible={showResultModal}
            animationType="slide"
            transparent={true}
            statusBarTranslucent={true}
            onRequestClose={() => setShowResultModal(false)}
         >
            <View style={styles.modalOverlay}>
               <View style={styles.modalContainer}>
                  <ScrollView
                     style={styles.modalScroll}
                     contentContainerStyle={styles.modalScrollContent}
                     showsVerticalScrollIndicator={false}
                  >
                     {/* Header */}
                     <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>✅ Verification Successful</Text>
                        <TouchableOpacity onPress={() => setShowResultModal(false)} style={styles.closeButton}>
                           <Text style={styles.closeButtonText}>✕</Text>
                        </TouchableOpacity>
                     </View>

                     {ovseResult ? (
                        <>
                           {/* Resident Photo */}
                           {ovseResult.resident_image && (
                              <View style={styles.photoContainer}>
                                 <Image
                                    source={{ uri: `data:image/jpeg;base64,${ovseResult.resident_image}` }}
                                    style={styles.residentPhoto}
                                    resizeMode="cover"
                                 />
                              </View>
                           )}

                           {/* Personal Details */}
                           <View style={styles.resultSection}>
                              <Text style={styles.sectionTitle}>Personal Information</Text>
                              <ResultRow label="Name" value={ovseResult.resident_name} />
                              {ovseResult.local_resident_name && (
                                 <ResultRow label="Local Name" value={ovseResult.local_resident_name} />
                              )}
                              <ResultRow label="Date of Birth" value={ovseResult.dob} />
                              <ResultRow label="Gender" value={ovseResult.gender} />
                              <ResultRow label="Care Of" value={ovseResult.care_of} />
                           </View>

                           {/* Contact Details */}
                           <View style={styles.resultSection}>
                              <Text style={styles.sectionTitle}>Contact Information</Text>
                              <ResultRow label="Mobile" value={ovseResult.masked_mobile || ovseResult.mobile} />
                              <ResultRow label="Email" value={ovseResult.masked_email || ovseResult.email} />
                           </View>

                           {/* Address Details */}
                           <View style={styles.resultSection}>
                              <Text style={styles.sectionTitle}>Address</Text>
                              <ResultRow label="Full Address" value={ovseResult.address} multiline />
                              {ovseResult.building && ovseResult.building !== "N/A" && (
                                 <ResultRow label="Building" value={ovseResult.building} />
                              )}
                              {ovseResult.street && ovseResult.street !== "N/A" && (
                                 <ResultRow label="Street" value={ovseResult.street} />
                              )}
                              {ovseResult.locality && ovseResult.locality !== "N/A" && (
                                 <ResultRow label="Locality" value={ovseResult.locality} />
                              )}
                              {ovseResult.landmark && ovseResult.landmark !== "N/A" && (
                                 <ResultRow label="Landmark" value={ovseResult.landmark} />
                              )}
                              {ovseResult.vtc && <ResultRow label="VTC" value={ovseResult.vtc} />}
                              {ovseResult.sub_district && (
                                 <ResultRow label="Sub District" value={ovseResult.sub_district} />
                              )}
                              <ResultRow label="District" value={ovseResult.district} />
                              <ResultRow label="State" value={ovseResult.state} />
                              <ResultRow label="Pincode" value={ovseResult.pincode} />
                              {ovseResult.po_name && ovseResult.po_name !== "N/A" && (
                                 <ResultRow label="Post Office" value={ovseResult.po_name} />
                              )}
                           </View>

                           {/* Age Verification */}
                           <View style={styles.resultSection}>
                              <Text style={styles.sectionTitle}>Age Verification</Text>
                              {ovseResult.age_above18 && <ResultRow label="Above 18" value={ovseResult.age_above18} />}
                              {ovseResult.age_above50 && <ResultRow label="Above 50" value={ovseResult.age_above50} />}
                              {ovseResult.age_above60 && <ResultRow label="Above 60" value={ovseResult.age_above60} />}
                              {ovseResult.age_above75 && <ResultRow label="Above 75" value={ovseResult.age_above75} />}
                              {ovseResult.is_nri && <ResultRow label="NRI Status" value={ovseResult.is_nri} />}
                           </View>

                           {/* Enrollment Details */}
                           <View style={styles.resultSection}>
                              <Text style={styles.sectionTitle}>Aadhaar Information</Text>
                              <ResultRow label="Enrolment Number" value={ovseResult.enrolment_number} />
                              <ResultRow
                                 label="Enrolment Date"
                                 value={new Date(ovseResult.enrolment_date).toLocaleString()}
                              />
                              <ResultRow
                                 label="Credential Issue Date"
                                 value={new Date(ovseResult.credential_issuing_date).toLocaleString()}
                              />
                           </View>
                        </>
                     ) : (
                        <View style={styles.emptyResultContainer}>
                           <Text style={styles.emptyResultTitle}>Result Ready</Text>
                           <Text style={styles.emptyResultText}>
                              Verification succeeded, but detailed fields were not present in `ovse_data`.
                           </Text>
                           <Text style={styles.emptyResultText}>Please check Debug Logs for full status payload.</Text>
                        </View>
                     )}

                     {/* Close Button */}
                     <TouchableOpacity style={styles.doneButton} onPress={() => setShowResultModal(false)}>
                        <Text style={styles.doneButtonText}>Done</Text>
                     </TouchableOpacity>
                  </ScrollView>
               </View>
            </View>
         </Modal>
      </LinearGradient>
   );
}

// Helper component for displaying result rows
const ResultRow = ({ label, value, multiline = false }: { label: string; value: unknown; multiline?: boolean }) => (
   <View style={styles.resultRow}>
      <Text style={styles.resultLabel}>{label}:</Text>
      <Text style={[styles.resultValue, multiline && styles.resultValueMultiline]}>
         {value != null ? String(value) : "N/A"}
      </Text>
   </View>
);

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
   // Modal styles
   modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.7)",
      justifyContent: "center",
      alignItems: "center",
   },
   modalContainer: {
      width: "90%",
      maxHeight: "85%",
      minHeight: 280,
      backgroundColor: "#ffffff",
      borderRadius: 20,
      overflow: "hidden",
      elevation: 10,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.3,
      shadowRadius: 20,
   },
   modalScroll: {
      width: "100%",
   },
   modalScrollContent: {
      paddingBottom: 12,
   },
   modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 20,
      backgroundColor: "#4facfe",
   },
   modalTitle: {
      color: "#fff",
      fontSize: 20,
      fontWeight: "bold",
      flex: 1,
   },
   closeButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: "rgba(255, 255, 255, 0.3)",
      justifyContent: "center",
      alignItems: "center",
   },
   closeButtonText: {
      color: "#fff",
      fontSize: 20,
      fontWeight: "bold",
   },
   photoContainer: {
      alignItems: "center",
      padding: 20,
      backgroundColor: "#f8f9fa",
   },
   residentPhoto: {
      width: 120,
      height: 150,
      borderRadius: 8,
      borderWidth: 3,
      borderColor: "#4facfe",
   },
   resultSection: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: "#e9ecef",
   },
   sectionTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: "#495057",
      marginBottom: 12,
   },
   resultRow: {
      flexDirection: "row",
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: "#f1f3f5",
   },
   resultLabel: {
      fontSize: 14,
      fontWeight: "600",
      color: "#6c757d",
      width: 140,
   },
   resultValue: {
      flex: 1,
      fontSize: 14,
      color: "#212529",
      fontWeight: "500",
   },
   resultValueMultiline: {
      lineHeight: 20,
   },
   doneButton: {
      margin: 20,
      backgroundColor: "#4facfe",
      borderRadius: 12,
      padding: 16,
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 4,
   },
   doneButtonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "bold",
   },
   emptyResultContainer: {
      paddingHorizontal: 20,
      paddingTop: 24,
      paddingBottom: 8,
   },
   emptyResultTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: "#212529",
      marginBottom: 10,
   },
   emptyResultText: {
      fontSize: 14,
      lineHeight: 20,
      color: "#495057",
      marginBottom: 8,
   },
   // Debug Panel Styles
   debugPanel: {
      backgroundColor: "rgba(0, 0, 0, 0.8)",
      borderRadius: 12,
      marginTop: 20,
      overflow: "hidden",
   },
   debugHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 12,
      backgroundColor: "rgba(255, 255, 255, 0.1)",
   },
   debugTitle: {
      color: "#fff",
      fontSize: 14,
      fontWeight: "bold",
   },
   debugToggle: {
      color: "#fff",
      fontSize: 14,
   },
   debugScroll: {
      maxHeight: 300,
      paddingHorizontal: 8,
   },
   debugControlsRow: {
      paddingHorizontal: 8,
      paddingTop: 8,
   },
   debugToggleButton: {
      backgroundColor: "rgba(255, 255, 255, 0.12)",
      borderRadius: 8,
      paddingVertical: 8,
      paddingHorizontal: 10,
      alignSelf: "flex-start",
   },
   debugToggleButtonActive: {
      backgroundColor: "rgba(81, 207, 102, 0.25)",
   },
   debugToggleButtonText: {
      color: "#fff",
      fontSize: 12,
      fontWeight: "600",
   },
   debugLogRow: {
      flexDirection: "row",
      paddingVertical: 4,
      borderBottomWidth: 1,
      borderBottomColor: "rgba(255, 255, 255, 0.1)",
   },
   debugTime: {
      color: "#888",
      fontSize: 10,
      fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
      width: 70,
   },
   debugType: {
      color: "#4facfe",
      fontSize: 10,
      fontWeight: "bold",
      width: 50,
      fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
   },
   debugTypeError: {
      color: "#ff6b6b",
   },
   debugTypeSuccess: {
      color: "#51cf66",
   },
   debugTypeApi: {
      color: "#ffd43b",
   },
   debugTypeMethod: {
      color: "#a78bfa",
   },
   debugMessage: {
      color: "#fff",
      fontSize: 11,
      flex: 1,
      fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
   },
   debugEmpty: {
      color: "#888",
      fontSize: 12,
      textAlign: "center",
      padding: 20,
   },
   debugClearButton: {
      backgroundColor: "#ff6b6b",
      padding: 10,
      margin: 8,
      borderRadius: 8,
      alignItems: "center",
   },
   debugClearText: {
      color: "#fff",
      fontSize: 12,
      fontWeight: "bold",
   },
});
