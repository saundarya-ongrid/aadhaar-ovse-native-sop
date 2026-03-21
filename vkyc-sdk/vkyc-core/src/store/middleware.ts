/**
 * Native Bridge Middleware
 * Automatically syncs Redux actions with native callbacks
 */

import { Middleware } from "redux";
import NativeBridge from "../utils/NativeBridge";
import * as types from "./actionTypes";

/**
 * Middleware to sync certain actions with native bridge
 */
export const nativeBridgeMiddleware: Middleware = () => (next) => (action) => {
   const result = next(action);

   // Sync progress updates to native
   if (action.type === types.SET_PROGRESS) {
      const { current, total } = action.payload;
      NativeBridge.onProgress(current, total);
   }

   // Sync error state to native
   if (action.type === types.SET_ERROR && action.payload !== null) {
      NativeBridge.onEvent("error_occurred", {
         code: action.payload.code,
         message: action.payload.message,
      });
   }

   // Sync session creation to native
   if (action.type === types.SET_SESSION_ID && action.payload) {
      NativeBridge.onEvent("session_created", {
         sessionId: action.payload,
      });
   }

   // Sync document capture to native
   if (action.type === types.SET_DOCUMENT_ID && action.payload) {
      NativeBridge.onEvent("document_captured", {
         documentId: action.payload,
      });
   }

   // Sync selfie capture to native
   if (action.type === types.SET_SELFIE_ID && action.payload) {
      NativeBridge.onEvent("selfie_captured", {
         selfieId: action.payload,
      });
   }

   // Sync video recording to native
   if (action.type === types.SET_VIDEO_ID && action.payload) {
      NativeBridge.onEvent("video_recorded", {
         videoId: action.payload,
      });
   }

   return result;
};
