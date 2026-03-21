/**
 * Redux Store Configuration
 * Optimized for production with DevTools support and middleware
 */

import { applyMiddleware, combineReducers, compose, createStore, Middleware } from "redux";
import createSagaMiddleware from "redux-saga";
import { nativeBridgeMiddleware } from "./middleware";
import { vkycReducer, VKYCState } from "./reducer";
import rootSaga from "./sagas";

// Root state interface
export interface RootState {
   vkyc: VKYCState;
}

// Combine reducers
const rootReducer = combineReducers({
   vkyc: vkycReducer,
});

// Logger middleware (only in development)
const loggerMiddleware: Middleware = () => (next) => (action) => {
   if (__DEV__) {
      console.log("[Redux] Dispatching:", action.type, action.payload);
   }
   return next(action);
};

// Performance monitoring middleware
const performanceMiddleware: Middleware = () => (next) => (action) => {
   if (__DEV__) {
      const start = Date.now();
      const result = next(action);
      const end = Date.now();
      const duration = end - start;

      if (duration > 16) {
         // More than one frame (16ms)
         console.warn(`[Redux] Slow action: ${action.type} took ${duration.toFixed(2)}ms`);
      }

      return result;
   }
   return next(action);
};

// Create saga middleware
const sagaMiddleware = createSagaMiddleware({
   onError: (error, { sagaStack }) => {
      console.error("[Redux Saga] Error:", error);
      if (__DEV__) {
         console.error("Saga stack:", sagaStack);
      }
   },
});

// Middleware array
const middlewares: Middleware[] = [sagaMiddleware, nativeBridgeMiddleware];

// Add development-only middlewares
if (__DEV__) {
   middlewares.push(loggerMiddleware, performanceMiddleware);
}

// Redux DevTools Extension (disabled in React Native, use Reactotron instead)
const composeEnhancers = compose;

// Create store with enhancers
export const store = createStore(rootReducer, composeEnhancers(applyMiddleware(...middlewares)));

// Run sagas
sagaMiddleware.run(rootSaga);

// Export everything needed
export * from "./actions";
export * from "./selectors";
export type { VKYCState };

