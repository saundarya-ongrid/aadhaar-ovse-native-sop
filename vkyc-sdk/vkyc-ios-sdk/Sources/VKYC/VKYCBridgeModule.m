//
//  VKYCBridgeModule.m
//  VKYC
//
//  Created on 21/03/2026.
//  Copyright © 2026 VKYC. All rights reserved.
//

#if __has_include(<React/RCTBridgeModule.h>)
#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(VKYCModule, NSObject)

/// Called when VKYC completes successfully
RCT_EXTERN_METHOD(onSuccess:(NSDictionary *)result)

/// Called when VKYC fails
RCT_EXTERN_METHOD(onFailure:(NSString *)errorCode
                  errorMessage:(NSString *)errorMessage
                  errorDetails:(NSDictionary *)errorDetails)

/// Called when user cancels
RCT_EXTERN_METHOD(onCancel)

/// Called for tracking events
RCT_EXTERN_METHOD(onEvent:(NSString *)eventName
                  metadata:(NSDictionary *)metadata)

/// Called to close VKYC view
RCT_EXTERN_METHOD(close)

/// Get SDK version
RCT_EXTERN_METHOD(getSDKVersion:(RCTResponseSenderBlock)callback)

/// Check if debug mode
RCT_EXTERN_METHOD(isDebugMode:(RCTResponseSenderBlock)callback)

@end

#else

// No-op in environments where React headers are unavailable.

#endif
