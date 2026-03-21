/**
 * Redux Reducer
 */

import { VKYCConfig, VKYCError } from "../types";
import * as types from "./actionTypes";

export interface VKYCState {
   // Config
   config: VKYCConfig | null;

   // Session
   sessionId: string | null;
   documentId: string | null;
   selfieId: string | null;
   videoId: string | null;

   // Progress
   currentStep: number;
   totalSteps: number;

   // State
   isLoading: boolean;
   error: VKYCError | null;
}

const initialState: VKYCState = {
   config: null,
   sessionId: null,
   documentId: null,
   selfieId: null,
   videoId: null,
   currentStep: 0,
   totalSteps: 5,
   isLoading: false,
   error: null,
};

export const vkycReducer = (state = initialState, action: any): VKYCState => {
   switch (action.type) {
      case types.SET_CONFIG:
         return { ...state, config: action.payload };

      case types.SET_SESSION_ID:
         return { ...state, sessionId: action.payload };

      case types.SET_DOCUMENT_ID:
         return { ...state, documentId: action.payload };

      case types.SET_SELFIE_ID:
         return { ...state, selfieId: action.payload };

      case types.SET_VIDEO_ID:
         return { ...state, videoId: action.payload };

      case types.SET_PROGRESS:
         return {
            ...state,
            currentStep: action.payload.current,
            totalSteps: action.payload.total,
         };

      case types.SET_LOADING:
         return { ...state, isLoading: action.payload };

      case types.SET_ERROR:
         return { ...state, error: action.payload };

      case types.RESET_STORE:
         return initialState;

      default:
         return state;
   }
};
