/**
 * API Service
 * Handles all API calls to VKYC backend
 */

import axios, { AxiosError, AxiosInstance } from "axios";
import ConfigManager from "../config/ConfigManager";
import {
    APIResponse,
    UploadDocumentResponse,
    UploadSelfieResponse,
    VerificationSessionResponse
} from "../types";

class APIService {
   private client: AxiosInstance | null = null;

   /**
    * Initialize API client
    */
   initialize(): void {
      const baseURL = ConfigManager.getApiBaseUrl();
      const token = ConfigManager.get("token");
      const apiKey = ConfigManager.get("apiKey");

      console.log("[APIService] Initializing with baseURL:", baseURL);

      this.client = axios.create({
         baseURL,
         timeout: 30000,
         headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            "X-API-Key": apiKey,
         },
      });

      // Request interceptor
      this.client.interceptors.request.use(
         (config: any) => {
            console.log("[APIService] Request:", config.method?.toUpperCase(), config.url);
            return config;
         },
         (error: any) => {
            return Promise.reject(error);
         },
      );

      // Response interceptor
      this.client.interceptors.response.use(
         (response: any) => {
            console.log("[APIService] Response:", response.status, response.config.url);
            return response;
         },
         (error: any) => {
            console.error("[APIService] Error:", error.message);
            return Promise.reject(this.handleError(error));
         },
      );
   }

   /**
    * Upload document image
    */
   async uploadDocument(imageUri: string, imageBase64: string): Promise<UploadDocumentResponse> {
      try {
         const response = await this.getClient().post<APIResponse<UploadDocumentResponse>>("/documents/upload", {
            image: imageBase64,
            metadata: ConfigManager.get("metadata"),
         });

         if (response.data.success && response.data.data) {
            return response.data.data;
         } else {
            throw new Error(response.data.error?.message || "Upload failed");
         }
      } catch (error) {
         throw this.handleError(error);
      }
   }

   /**
    * Upload selfie image
    */
   async uploadSelfie(imageUri: string, imageBase64: string, documentId?: string): Promise<UploadSelfieResponse> {
      try {
         const response = await this.getClient().post<APIResponse<UploadSelfieResponse>>("/selfies/upload", {
            image: imageBase64,
            documentId,
            metadata: ConfigManager.get("metadata"),
         });

         if (response.data.success && response.data.data) {
            return response.data.data;
         } else {
            throw new Error(response.data.error?.message || "Upload failed");
         }
      } catch (error) {
         throw this.handleError(error);
      }
   }

   /**
    * Perform liveness check
    */
   async checkLiveness(selfieId: string): Promise<{ score: number; passed: boolean }> {
      try {
         const response = await this.getClient().post<APIResponse<{ score: number; passed: boolean }>>(
            "/liveness/check",
            {
               selfieId,
            },
         );

         if (response.data.success && response.data.data) {
            return response.data.data;
         } else {
            throw new Error(response.data.error?.message || "Liveness check failed");
         }
      } catch (error) {
         throw this.handleError(error);
      }
   }

   /**
    * Upload video
    */
   async uploadVideo(videoUri: string, videoBase64: string): Promise<{ videoId: string }> {
      try {
         const response = await this.getClient().post<APIResponse<{ videoId: string }>>("/videos/upload", {
            video: videoBase64,
            metadata: ConfigManager.get("metadata"),
         });

         if (response.data.success && response.data.data) {
            return response.data.data;
         } else {
            throw new Error(response.data.error?.message || "Upload failed");
         }
      } catch (error) {
         throw this.handleError(error);
      }
   }

   /**
    * Create verification session
    */
   async createSession(data: {
      documentId?: string;
      selfieId?: string;
      videoId?: string;
   }): Promise<VerificationSessionResponse> {
      try {
         const response = await this.getClient().post<APIResponse<VerificationSessionResponse>>("/sessions/create", {
            ...data,
            metadata: ConfigManager.get("metadata"),
         });

         if (response.data.success && response.data.data) {
            return response.data.data;
         } else {
            throw new Error(response.data.error?.message || "Session creation failed");
         }
      } catch (error) {
         throw this.handleError(error);
      }
   }

   /**
    * Get session status
    */
   async getSessionStatus(sessionId: string): Promise<VerificationSessionResponse> {
      try {
         const response = await this.getClient().get<APIResponse<VerificationSessionResponse>>(
            `/sessions/${sessionId}`,
         );

         if (response.data.success && response.data.data) {
            return response.data.data;
         } else {
            throw new Error(response.data.error?.message || "Failed to get session status");
         }
      } catch (error) {
         throw this.handleError(error);
      }
   }

   /**
    * Poll session until complete
    */
   async pollSessionStatus(
      sessionId: string,
      maxAttempts: number = 30,
      interval: number = 2000,
   ): Promise<VerificationSessionResponse> {
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
         const status = await this.getSessionStatus(sessionId);

         if (status.status === "verified" || status.status === "failed") {
            return status;
         }

         // Wait before next attempt
         await new Promise<void>((resolve) => setTimeout(resolve, interval));
      }

      throw new Error("Session polling timeout");
   }

   /**
    * Get axios client
    */
   private getClient(): AxiosInstance {
      if (!this.client) {
         throw new Error("API client not initialized");
      }
      return this.client;
   }

   /**
    * Handle API errors
    */
   private handleError(error: any): Error {
      if (axios.isAxiosError(error)) {
         const axiosError = error as AxiosError<APIResponse>;

         if (axiosError.response) {
            // Server responded with error
            const serverError = axiosError.response.data?.error;
            return new Error(serverError?.message || "API request failed");
         } else if (axiosError.request) {
            // Request made but no response
            return new Error("No response from server");
         } else {
            // Request setup error
            return new Error(axiosError.message || "Request failed");
         }
      }

      return error instanceof Error ? error : new Error("Unknown error");
   }

   /**
    * Reset API client
    */
   reset(): void {
      this.client = null;
   }
}

// Export singleton instance
export default new APIService();
