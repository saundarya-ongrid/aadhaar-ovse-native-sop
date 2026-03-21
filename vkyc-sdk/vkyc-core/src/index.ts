/**
 * VKYC Core Exports
 * Main exports for the VKYC SDK core module
 */

export { default as App } from "./App";
export { default as ConfigManager } from "./config/ConfigManager";
export { default as APIService } from "./services/APIService";
export { store } from "./store";
export * from "./store/actions";
export * from "./store/selectors";
export { default as ThemeManager } from "./theme/ThemeManager";
export { default as NativeBridge } from "./utils/NativeBridge";
export * from "./utils/optimizations";

// Export all types
export * from "./types";

// Export screens
export { default as DocumentCaptureScreen } from "./screens/DocumentCaptureScreen";
export { default as ErrorScreen } from "./screens/ErrorScreen";
export { default as LivenessCheckScreen } from "./screens/LivenessCheckScreen";
export { default as ProcessingScreen } from "./screens/ProcessingScreen";
export { default as SelfieCaptureScreen } from "./screens/SelfieCaptureScreen";
export { default as SuccessScreen } from "./screens/SuccessScreen";
export { default as VideoRecordingScreen } from "./screens/VideoRecordingScreen";
export { default as WelcomeScreen } from "./screens/WelcomeScreen";

// Export navigation
export { default as AppNavigator } from "./navigation/AppNavigator";
export type { RootStackParamList } from "./navigation/AppNavigator";

