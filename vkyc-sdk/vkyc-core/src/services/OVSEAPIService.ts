/**
 * OVSE API Service
 * Handles all API calls for Aadhaar OVSE verification
 */

import axios, { AxiosInstance } from "axios";

const BASE_URL = "https://d29vza544ghj85.cloudfront.net/api/integration";

interface InitiateSessionResponse {
   data: {
      authorization: string;
      sessionId: string;
      status: string;
   };
   message: string;
   request_id: string;
   status: string;
}

interface KYCMethodResponse {
   message: string;
   request_id: string;
   status: string;
}

interface GenerateIntentResponse {
   code: string;
   data: {
      jwt_token: string;
      transaction_id: string;
      expires_at: number;
   };
   message: string;
   request_id: string;
   status: string;
}

interface StatusResponse {
   code: string;
   data: any;
   message: string;
   request_id: string;
   status: string;
}

class OVSEAPIService {
   private client: AxiosInstance;

   constructor() {
      this.client = axios.create({
         baseURL: BASE_URL,
         timeout: 30000,
         headers: {
            "Content-Type": "application/json",
         },
      });

      // Request interceptor
      this.client.interceptors.request.use(
         (config: any) => {
            console.log("[OVSE API] Request:", config.method?.toUpperCase(), config.url);
            return config;
         },
         (error: any) => {
            console.error("[OVSE API] Request error:", error);
            return Promise.reject(error);
         },
      );

      // Response interceptor
      this.client.interceptors.response.use(
         (response: any) => {
            console.log("[OVSE API] Response:", response.status, response.config.url);
            return response;
         },
         (error: any) => {
            console.error("[OVSE API] Response error:", error.response?.data || error.message);
            return Promise.reject(error);
         },
      );
   }

   /**
    * Step 1: Initiate session with token
    */
   async initiateSession(token: string): Promise<InitiateSessionResponse> {
      try {
         const response = await this.client.post<InitiateSessionResponse>("/initiate/session", { token });

         if (response.data.status === "success") {
            return response.data;
         } else {
            throw new Error(response.data.message || "Failed to initiate session");
         }
      } catch (error: any) {
         console.error("[OVSE API] Initiate session failed:", error);
         throw new Error(error.response?.data?.message || error.message || "Session initiation failed");
      }
   }

   /**
    * Step 2: Set KYC method
    */
   async setKYCMethod(sessionId: string, method: string = "aadhaarovse"): Promise<KYCMethodResponse> {
      try {
         const response = await this.client.post<KYCMethodResponse>("/customer/kyc/method", { sessionId, method });

         if (response.data.status === "success") {
            return response.data;
         } else {
            throw new Error(response.data.message || "Failed to set KYC method");
         }
      } catch (error: any) {
         console.error("[OVSE API] Set KYC method failed:", error);
         throw new Error(error.response?.data?.message || error.message || "Setting KYC method failed");
      }
   }

   /**
    * Step 3: Generate JWT intent token
    */
   async generateIntent(customerSessionId: string, channel: string = "WEB"): Promise<GenerateIntentResponse> {
      try {
         const response = await this.client.post<GenerateIntentResponse>("/ovse/generate-intent", {
            customer_session_id: customerSessionId,
            channel,
         });

         if (response.data.status === "success") {
            return response.data;
         } else {
            throw new Error(response.data.message || "Failed to generate intent");
         }
      } catch (error: any) {
         console.error("[OVSE API] Generate intent failed:", error);
         throw new Error(error.response?.data?.message || error.message || "Intent generation failed");
      }
   }

   /**
    * Step 4: Poll status
    */
   async checkStatus(customerSessionId: string, transactionId: string): Promise<StatusResponse> {
      try {
         const response = await this.client.post<StatusResponse>("/ovse/status", {
            customer_session_id: customerSessionId,
            transaction_id: transactionId,
         });

         return response.data;
      } catch (error: any) {
         console.error("[OVSE API] Check status failed:", error);
         throw new Error(error.response?.data?.message || error.message || "Status check failed");
      }
   }

   /**
    * Poll status until callback received or timeout
    */
   async pollStatus(
      customerSessionId: string,
      transactionId: string,
      maxAttempts: number = 60, // 5 minutes at 5-second intervals
      intervalMs: number = 5000,
   ): Promise<StatusResponse> {
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
         const status = await this.checkStatus(customerSessionId, transactionId);

         // Check if callback received
         if (status.code !== "CALLBACK_NOT_YET_RECEIVED") {
            return status;
         }

         // Wait before next attempt
         if (attempt < maxAttempts - 1) {
            await new Promise<void>((resolve) => setTimeout(resolve, intervalMs));
         }
      }

      throw new Error("Status polling timeout - callback not received");
   }
}

export default new OVSEAPIService();
