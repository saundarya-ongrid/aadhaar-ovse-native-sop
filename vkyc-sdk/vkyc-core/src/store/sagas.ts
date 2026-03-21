/**
 * Redux Sagas
 * Handle side effects and async operations with error handling
 */

import { all, call, delay, fork, put } from "redux-saga/effects";
import { ErrorCode } from "../types";
import { setError, setLoading } from "./actions";

/**
 * Generic error handler for sagas
 */
function* handleSagaError(error: any, context: string) {
   console.error(`[Saga Error] ${context}:`, error);

   yield put(
      setError({
         code: ErrorCode.UNKNOWN_ERROR,
         message: error.message || "An unexpected error occurred",
         details: { context, error: error.toString() },
      }),
   );

   yield put(setLoading(false));
}

/**
 * Example saga: Handle session creation with retry logic
 */
function* createSessionSaga(action: any): Generator<any, void, any> {
   const maxRetries = 3;
   let attempt = 0;

   while (attempt < maxRetries) {
      try {
         yield put(setLoading(true));

         // API call would go here
         // const session = yield call(APIService.createSession, action.payload);
         // yield put(setSessionId(session.sessionId));

         yield put(setLoading(false));
         break; // Success, exit retry loop
      } catch (error: any) {
         attempt++;

         if (attempt >= maxRetries) {
            yield call(handleSagaError, error, "createSession");
         } else {
            // Exponential backoff: 2^attempt seconds
            const backoffTime = Math.pow(2, attempt) * 1000;
            yield delay(backoffTime);
         }
      }
   }
}

/**
 * Watcher saga for session creation
 */
function* watchSessionSaga() {
   // Uncomment when you have session actions
   // yield takeLatest('CREATE_SESSION_REQUEST', createSessionSaga);
}

/**
 * Root saga
 * Combines all sagas with error boundaries
 */
export default function* rootSaga() {
   try {
      yield all([
         fork(watchSessionSaga),
         // Add more watchers here as needed
      ]);
   } catch (error) {
      console.error("[Root Saga Error]:", error);
      // Global error handling
      yield call(handleSagaError, error, "rootSaga");
   }
}
