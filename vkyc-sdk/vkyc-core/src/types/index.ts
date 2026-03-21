/**
 * VKYC SDK TypeScript Type Definitions
 */

// ============================================================================
// Configuration Types
// ============================================================================

export interface VKYCConfig {
   token: string;
   apiKey: string;
   environment: "staging" | "production";
   theme?: VKYCTheme;
   features?: VKYCFeatures;
   metadata?: Record<string, any>;
}

export interface VKYCTheme {
   primaryColor: string;
   secondaryColor?: string;
   textColor?: string;
   backgroundColor?: string;
   fontFamily?: string;
   buttonRadius?: number;
}

export interface VKYCFeatures {
   videoEnabled: boolean;
   videoRecording?: boolean; // Alias for videoEnabled
   autoCapture?: boolean;
   liveness?: boolean; // Alias for livenessCheck
   livenessCheck?: boolean;
   documentVerification?: boolean;
   faceMatch?: boolean;
   audioEnabled?: boolean;
   screenRecording?: boolean;
}

// ============================================================================
// API Types
// ============================================================================

export interface APIConfig {
   baseURL: string;
   token: string;
   apiKey: string;
   timeout: number;
}

export interface APIResponse<T = any> {
   success: boolean;
   data?: T;
   error?: {
      code: string;
      message: string;
      details?: any;
   };
}

export interface UploadDocumentResponse {
   documentId: string;
   extractedData?: {
      name?: string;
      documentNumber?: string;
      dateOfBirth?: string;
      expiryDate?: string;
   };
}

export interface UploadSelfieResponse {
   selfieId: string;
   livenessScore?: number;
   faceMatchScore?: number;
}

export interface VerificationSessionResponse {
   sessionId: string;
   status: "pending" | "processing" | "verified" | "failed" | "completed";
   verificationId?: string;
   message?: string;
   data?: any;
   verificationData?: {
      documentVerified: boolean;
      faceMatched: boolean;
      livenessCheckPassed: boolean;
   };
   timestamp: number;
}

export interface VKYCResult {
   success: boolean;
   sessionId: string;
   verificationId: string;
   data?: any;
}

// ============================================================================
// Screen Types
// ============================================================================

export type ScreenName =
   | "Welcome"
   | "Permissions"
   | "DocumentCapture"
   | "SelfieCapture"
   | "LivenessCheck"
   | "VideoRecording"
   | "Processing"
   | "Success"
   | "Error";

export interface NavigationParams {
   Welcome: undefined;
   Permissions: undefined;
   DocumentCapture: undefined;
   SelfieCapture: { documentId?: string };
   LivenessCheck: { documentId?: string; selfieId?: string };
   VideoRecording: { documentId?: string; selfieId?: string };
   Processing: { sessionData: ProcessingData };
   Success: { sessionId: string; result: VerificationResult };
   Error: { error: VKYCError };
}

export interface ProcessingData {
   documentId?: string;
   selfieId?: string;
   videoId?: string;
}

export interface VerificationResult {
   sessionId: string;
   status: string;
   timestamp: number;
   verificationData?: any;
}

// ============================================================================
// Error Types
// ============================================================================

export interface VKYCError {
   code: ErrorCode;
   message: string;
   details?: any;
}

export enum ErrorCode {
   // Configuration
   INVALID_CONFIG = "invalid_config",
   MISSING_TOKEN = "missing_token",
   MISSING_API_KEY = "missing_api_key",

   // Network
   NETWORK_ERROR = "network_error",
   API_ERROR = "api_error",
   TIMEOUT = "timeout",
   UPLOAD_FAILED = "upload_failed",

   // Permissions
   CAMERA_PERMISSION_DENIED = "camera_permission_denied",
   MICROPHONE_PERMISSION_DENIED = "microphone_permission_denied",

   // Runtime
   INITIALIZATION_FAILED = "initialization_failed",
   CAPTURE_FAILED = "capture_failed",

   // Verification
   VERIFICATION_FAILED = "verification_failed",
   LIVENESS_CHECK_FAILED = "liveness_check_failed",
   LIVENESS_FAILED = "liveness_check_failed",
   DOCUMENT_VERIFICATION_FAILED = "document_verification_failed",
   FACE_MATCH_FAILED = "face_match_failed",

   // User
   USER_CANCELLED = "user_cancelled",
   SESSION_EXPIRED = "session_expired",

   UNKNOWN_ERROR = "unknown",
   UNKNOWN = "unknown",
}

// ============================================================================
// Event Types
// ============================================================================

export interface VKYCEvent {
   name: string;
   metadata?: Record<string, any>;
   timestamp: number;
}

export type EventName =
   | "screen_viewed"
   | "button_clicked"
   | "document_captured"
   | "selfie_captured"
   | "liveness_check_started"
   | "liveness_check_completed"
   | "video_recording_started"
   | "video_recording_completed"
   | "verification_started"
   | "verification_completed"
   | "error_occurred"
   | "session_cancelled";

// ============================================================================
// Store Types
// ============================================================================

export interface VKYCStore {
   // Config
   config: VKYCConfig | null;
   setConfig: (config: VKYCConfig) => void;

   // Session
   sessionId: string | null;
   documentId: string | null;
   selfieId: string | null;
   videoId: string | null;

   setSessionId: (id: string) => void;
   setDocumentId: (id: string) => void;
   setSelfieId: (id: string) => void;
   setVideoId: (id: string) => void;

   // Progress
   currentStep: number;
   totalSteps: number;
   setProgress: (current: number, total: number) => void;

   // State
   isLoading: boolean;
   error: VKYCError | null;
   setLoading: (loading: boolean) => void;
   setError: (error: VKYCError | null) => void;

   // Reset
   reset: () => void;
}

// ============================================================================
// Native Module Types
// ============================================================================

export interface VKYCNativeModule {
   onSuccess: (result: Record<string, any>) => void;
   onFailure: (errorCode: string, message: string, details?: any) => void;
   onCancel: () => void;
   onEvent: (eventName: string, metadata?: Record<string, any>) => void;
   close: () => void;
   getSDKVersion: () => string;
}

// ============================================================================
// Camera Types
// ============================================================================

export interface CapturedImage {
   uri: string;
   width: number;
   height: number;
   base64?: string;
}

export interface CapturedVideo {
   uri: string;
   duration: number;
   size: number;
}

// ============================================================================
// Utility Types
// ============================================================================

export type DeepPartial<T> = {
   [P in keyof T]?: DeepPartial<T[P]>;
};

export type RequiredKeys<T, K extends keyof T> = T & Required<Pick<T, K>>;
