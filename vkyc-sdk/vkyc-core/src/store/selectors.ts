/**
 * Redux Selectors
 * Memoized selectors for accessing state (optimized with reselect)
 */

import { createSelector } from "reselect";
import { RootState } from "./index";
import { VKYCState } from "./reducer";

// Base selectors
const selectVKYCState = (state: RootState): VKYCState => state.vkyc;

// Memoized selectors
export const selectConfig = createSelector([selectVKYCState], (vkyc) => vkyc.config);

export const selectSessionId = createSelector([selectVKYCState], (vkyc) => vkyc.sessionId);

export const selectDocumentId = createSelector([selectVKYCState], (vkyc) => vkyc.documentId);

export const selectSelfieId = createSelector([selectVKYCState], (vkyc) => vkyc.selfieId);

export const selectVideoId = createSelector([selectVKYCState], (vkyc) => vkyc.videoId);

export const selectCurrentStep = createSelector([selectVKYCState], (vkyc) => vkyc.currentStep);

export const selectTotalSteps = createSelector([selectVKYCState], (vkyc) => vkyc.totalSteps);

export const selectIsLoading = createSelector([selectVKYCState], (vkyc) => vkyc.isLoading);

export const selectError = createSelector([selectVKYCState], (vkyc) => vkyc.error);

// Derived selectors
export const selectProgress = createSelector([selectCurrentStep, selectTotalSteps], (current, total) => ({
   current,
   total,
   percentage: total > 0 ? Math.round((current / total) * 100) : 0,
}));

export const selectHasSession = createSelector(
   [selectSessionId],
   (sessionId) => sessionId !== null && sessionId.length > 0,
);

export const selectHasDocuments = createSelector(
   [selectDocumentId, selectSelfieId, selectVideoId],
   (documentId, selfieId, videoId) => ({
      hasDocument: documentId !== null,
      hasSelfie: selfieId !== null,
      hasVideo: videoId !== null,
      hasAny: documentId !== null || selfieId !== null || videoId !== null,
   }),
);

export const selectIsReady = createSelector(
   [selectConfig, selectIsLoading, selectError],
   (config, isLoading, error) => config !== null && !isLoading && error === null,
);

export const selectCanProceed = createSelector(
   [selectIsLoading, selectError],
   (isLoading, error) => !isLoading && error === null,
);

// Environment-based selectors
export const selectEnvironment = createSelector([selectConfig], (config) => config?.environment || "staging");

export const selectFeatures = createSelector([selectConfig], (config) => config?.features);

export const selectTheme = createSelector([selectConfig], (config) => config?.theme);
