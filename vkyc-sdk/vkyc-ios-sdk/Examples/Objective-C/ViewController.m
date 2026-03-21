//
//  ViewController.m
//  VKYC Example (Objective-C)
//
//  Created on 21/03/2026.
//  Copyright © 2026 VKYC. All rights reserved.
//

#import "ViewController.h"
@import VKYC;

@interface ViewController () <VKYCDelegate>
@property (nonatomic, strong) UIButton *startButton;
@end

@implementation ViewController

- (void)viewDidLoad {
    [super viewDidLoad];
    [self setupUI];
}

- (void)setupUI {
    self.view.backgroundColor = [UIColor whiteColor];
    self.title = @"VKYC Example (Obj-C)";
    
    self.startButton = [UIButton buttonWithType:UIButtonTypeSystem];
    [self.startButton setTitle:@"Start VKYC" forState:UIControlStateNormal];
    self.startButton.titleLabel.font = [UIFont systemFontOfSize:18 weight:UIFontWeightSemibold];
    [self.startButton addTarget:self action:@selector(startVKYCTapped) forControlEvents:UIControlEventTouchUpInside];
    self.startButton.translatesAutoresizingMaskIntoConstraints = NO;
    
    [self.view addSubview:self.startButton];
    
    [NSLayoutConstraint activateConstraints:@[
        [self.startButton.centerXAnchor constraintEqualToAnchor:self.view.centerXAnchor],
        [self.startButton.centerYAnchor constraintEqualToAnchor:self.view.centerYAnchor]
    ]];
}

#pragma mark - Example 1: Basic Integration

- (void)startVKYCTapped {
    // Create configuration
    VKYCConfig *config = [[VKYCConfig alloc] initWithToken:@"your-token"
                                                    apiKey:@"your-api-key"
                                               environment:VKYCConfigEnvironmentStaging];
    
    // Start VKYC with blocks
    [VKYCManager startFrom:self
                    config:config
                   success:^(NSDictionary<NSString *,id> * _Nonnull result) {
        [self handleSuccess:result];
    }
                   failure:^(VKYCError * _Nonnull error) {
        [self handleError:error];
    }
                    cancel:^{
        [self handleCancellation];
    }];
}

#pragma mark - Example 2: With Custom Theme

- (void)startVKYCWithCustomTheme {
    // Create configuration
    VKYCConfig *config = [[VKYCConfig alloc] initWithToken:@"your-token"
                                                    apiKey:@"your-api-key"
                                               environment:VKYCConfigEnvironmentProduction];
    
    // Customize theme
    VKYCTheme *theme = [[VKYCTheme alloc] initWithPrimaryColor:@"#667eea"
                                                secondaryColor:@"#764ba2"
                                                     textColor:@"#333333"
                                           backgroundColor:@"#FFFFFF"
                                                    fontFamily:@"SF Pro Display"
                                                  buttonRadius:@12];
    config.theme = theme;
    
    // Configure features
    VKYCFeatures *features = [[VKYCFeatures alloc] initWithVideoEnabled:YES
                                                           autoCapture:@YES
                                                         livenessCheck:@YES
                                              documentVerification:@YES
                                                          faceMatch:@YES
                                                       audioEnabled:@YES
                                                   screenRecording:@NO];
    config.features = features;
    
    // Add metadata
    config.metadata = @{
        @"userId": @"12345",
        @"source": @"ios_app",
        @"sessionType": @"kyc_verification"
    };
    
    // Start VKYC
    [VKYCManager startFrom:self
                    config:config
                   success:^(NSDictionary<NSString *,id> * _Nonnull result) {
        [self handleSuccess:result];
    }
                   failure:^(VKYCError * _Nonnull error) {
        [self handleError:error];
    }
                    cancel:^{
        [self handleCancellation];
    }];
}

#pragma mark - Example 3: Using Delegate Pattern

- (void)startVKYCWithDelegate {
    VKYCConfig *config = [[VKYCConfig alloc] initWithToken:@"your-token"
                                                    apiKey:@"your-api-key"
                                               environment:VKYCConfigEnvironmentStaging];
    
    VKYCManager.shared.delegate = self;
    [VKYCManager startFrom:self config:config];
}

#pragma mark - Example 4: Validation Before Starting

- (void)startVKYCWithValidation {
    VKYCConfig *config = [[VKYCConfig alloc] initWithToken:@"your-token"
                                                    apiKey:@"your-api-key"
                                               environment:VKYCConfigEnvironmentStaging];
    
    // Validate configuration
    VKYCConfigValidationResult validationResult = [config validate];
    
    if (validationResult == VKYCConfigValidationResultSuccess) {
        [VKYCManager startFrom:self
                        config:config
                       success:^(NSDictionary<NSString *,id> * _Nonnull result) {
            [self handleSuccess:result];
        }
                       failure:^(VKYCError * _Nonnull error) {
            [self handleError:error];
        }
                        cancel:^{
            [self handleCancellation];
        }];
    } else {
        [self showAlertWithTitle:@"Invalid Configuration" message:@"Please check your configuration"];
    }
}

#pragma mark - Helper Methods

- (void)handleSuccess:(NSDictionary *)result {
    NSLog(@"✅ VKYC Success: %@", result);
    
    NSString *sessionId = result[@"sessionId"] ?: @"N/A";
    NSString *status = result[@"status"] ?: @"N/A";
    
    NSString *message = [NSString stringWithFormat:@"Session ID: %@\nStatus: %@", sessionId, status];
    [self showAlertWithTitle:@"Verification Successful" message:message];
}

- (void)handleError:(VKYCError *)error {
    NSLog(@"❌ VKYC Error: %@", error);
    
    NSString *message;
    switch (error.code) {
        case VKYCErrorCodeCameraPermissionDenied:
            message = @"Camera permission is required. Please grant access in Settings.";
            break;
        case VKYCErrorCodeMicrophonePermissionDenied:
            message = @"Microphone permission is required. Please grant access in Settings.";
            break;
        case VKYCErrorCodeNetworkError:
            message = @"Network error. Please check your connection and try again.";
            break;
        case VKYCErrorCodeSessionExpired:
            message = @"Your session has expired. Please start again.";
            break;
        default:
            message = error.message;
            break;
    }
    
    [self showAlertWithTitle:@"Verification Failed" message:message];
}

- (void)handleCancellation {
    NSLog(@"⚠️ VKYC Cancelled");
    [self showAlertWithTitle:@"Cancelled" message:@"Verification was cancelled"];
}

- (void)showAlertWithTitle:(NSString *)title message:(NSString *)message {
    UIAlertController *alert = [UIAlertController alertControllerWithTitle:title
                                                                   message:message
                                                            preferredStyle:UIAlertControllerStyleAlert];
    [alert addAction:[UIAlertAction actionWithTitle:@"OK" style:UIAlertActionStyleDefault handler:nil]];
    [self presentViewController:alert animated:YES completion:nil];
}

#pragma mark - VKYCDelegate

- (void)vkycDidStart {
    NSLog(@"📱 VKYC Started");
}

- (void)vkycDidSucceedWith:(NSDictionary<NSString *,id> *)result {
    NSLog(@"✅ VKYC Success: %@", result);
    [self handleSuccess:result];
}

- (void)vkycDidFailWith:(VKYCError *)error {
    NSLog(@"❌ VKYC Error: %@", error);
    [self handleError:error];
}

- (void)vkycDidCancel {
    NSLog(@"⚠️ VKYC Cancelled");
    [self handleCancellation];
}

- (void)vkycDidReceiveEvent:(NSString *)eventName metadata:(NSDictionary<NSString *,id> *)metadata {
    NSLog(@"📊 VKYC Event: %@, metadata: %@", eventName, metadata);
    
    // Track events with your analytics service
    // [Analytics track:eventName properties:metadata];
}

@end
