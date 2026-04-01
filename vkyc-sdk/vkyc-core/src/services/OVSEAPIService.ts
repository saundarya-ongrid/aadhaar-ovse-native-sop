/**
 * OVSE API Service
 * Handles Gridlines OVSE API calls for Aadhaar verification
 */

import ConfigManager from "../config/ConfigManager";

const BASE_URL = "https://api-dev.gridlines.io/uidai-api/ovse";

interface GenerateTokenResponse {
   status: number;
   data: {
      jwt_token: string;
      scan_uri?: string;
      transaction_id: string;
      expires_at: number;
   };
}

interface StatusResponse {
   status?: number;
   data: any;
}

class OVSEAPIService {
   private getBaseUrl(): string {
      return ConfigManager.get("ovse")?.apiBaseUrl || BASE_URL;
   }

   /**
    * Parse API response safely
    */
   private async parseResponse(response: Response) {
      const text = await response.text();
      if (!text || text.trim() === "") {
         throw new Error(`Empty response from server (Status: ${response.status})`);
      }
      try {
         return JSON.parse(text);
      } catch {
         throw new Error(`Invalid JSON response: ${text.substring(0, 120)}`);
      }
   }

   /**
    * Resolve app identifiers from SDK config or defaults
    */
   private getAppIdentifiers() {
      const ovse = ConfigManager.get("ovse");
      return {
         app_package_id: ovse?.appPackageId || "in.ongrid.lav",
         app_signature: ovse?.appSignature || "",
      };
   }

   /**
    * Step 1: Generate token for APP/WEB flow
    */
   async generateToken(apiKey: string, channelType: "APP" | "WEB" = "APP"): Promise<GenerateTokenResponse> {
      const ovseConfig = ConfigManager.get("ovse");
      const { app_package_id, app_signature } = this.getAppIdentifiers();

      const body: any = {
         channel_type: channelType,
         template_id: ovseConfig?.templateId || "1",
         expiry_time_in_seconds: ovseConfig?.expiryTimeInSeconds || 3600,
         consent: ovseConfig?.consent || "Y",
      };

      if (channelType === "APP") {
         body.app_package_id = app_package_id;
         body.app_signature = app_signature;
      }

      const response = await fetch(`${this.getBaseUrl()}/generate-token`, {
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

      const parsed = await this.parseResponse(response);
      if (!response.ok) {
         throw new Error(parsed?.message || `Generate token failed with status ${response.status}`);
      }
      return parsed;
   }

   /**
    * Step 2: Poll transaction status
    */
   async checkStatus(apiKey: string, transactionId: string): Promise<StatusResponse> {
      const response = await fetch(`${this.getBaseUrl()}/status`, {
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

      const parsed = await this.parseResponse(response);
      if (!response.ok) {
         throw new Error(parsed?.message || `Status check failed with status ${response.status}`);
      }
      return parsed;
   }

   /**
    * Poll status until callback received or timeout
    */
   async pollStatus(
      apiKey: string,
      transactionId: string,
      maxAttempts: number = 60,
      intervalMs: number = 5000,
   ): Promise<StatusResponse> {
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
         const status = await this.checkStatus(apiKey, transactionId);

         // Success is marked by code 1001 in current OVSE contract.
         if (status?.data?.code === "1001" || status?.data?.code === 1001) {
            return status;
         }

         if (attempt < maxAttempts - 1) {
            await new Promise<void>((resolve) => setTimeout(resolve, intervalMs));
         }
      }

      throw new Error("Status polling timeout - callback not received");
   }
}

export default new OVSEAPIService();
