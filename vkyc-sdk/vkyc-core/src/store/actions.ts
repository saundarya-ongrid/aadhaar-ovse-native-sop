/**
 * Redux Actions
 */

import { VKYCConfig, VKYCError } from "../types";
import * as types from "./actionTypes";

// Config Actions
export const setConfig = (config: VKYCConfig) => ({
   type: types.SET_CONFIG,
   payload: config,
});

// Session Actions
export const setSessionId = (id: string) => ({
   type: types.SET_SESSION_ID,
   payload: id,
});

export const setDocumentId = (id: string) => ({
   type: types.SET_DOCUMENT_ID,
   payload: id,
});

export const setSelfieId = (id: string) => ({
   type: types.SET_SELFIE_ID,
   payload: id,
});

export const setVideoId = (id: string) => ({
   type: types.SET_VIDEO_ID,
   payload: id,
});

// Progress Actions
export const setProgress = (current: number, total: number) => ({
   type: types.SET_PROGRESS,
   payload: { current, total },
});

// State Actions
export const setLoading = (loading: boolean) => ({
   type: types.SET_LOADING,
   payload: loading,
});

export const setError = (error: VKYCError | null) => ({
   type: types.SET_ERROR,
   payload: error,
});

// Reset Actions
export const resetStore = () => ({
   type: types.RESET_STORE,
});
