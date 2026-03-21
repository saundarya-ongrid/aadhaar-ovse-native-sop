Pod::Spec.new do |s|
  s.name             = 'VKYC'
  s.version          = '1.0.0'
  s.summary          = 'Native iOS SDK for Video KYC verification'
  s.description      = <<-DESC
VKYC SDK provides a seamless video KYC verification experience for iOS applications.
The SDK embeds React Native to provide a consistent UI across platforms while exposing
a native Swift/Objective-C API.
                       DESC

  s.homepage         = 'https://github.com/your-org/vkyc-sdk'
  s.license          = { :type => 'Proprietary', :file => 'LICENSE' }
  s.author           = { 'VKYC Team' => 'sdk@vkyc.com' }
  s.source           = { :git => 'https://github.com/your-org/vkyc-ios-sdk.git', :tag => s.version.to_s }

  s.ios.deployment_target = '13.0'
  s.swift_version = '5.5'

  # Source files
  s.source_files = 'Sources/VKYC/**/*.{swift,h,m}'
  s.public_header_files = 'Sources/VKYC/**/*.h'

  # React Native dependency
  s.dependency 'React-Core'
  s.dependency 'React-RCTImage'
  s.dependency 'React-RCTNetwork'
  s.dependency 'React-RCTText'
  s.dependency 'React-RCTAnimation'

  # Resources
  s.resource_bundles = {
    'VKYC' => ['Sources/VKYC/Resources/**/*']
  }

  # Build settings
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'EXCLUDED_ARCHS[sdk=iphonesimulator*]' => 'i386'
  }

  # Required frameworks
  s.frameworks = 'UIKit', 'AVFoundation', 'CoreMedia'

  # Required for React Native
  s.user_target_xcconfig = { 'EXCLUDED_ARCHS[sdk=iphonesimulator*]' => 'i386' }
end
