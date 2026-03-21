// swift-tools-version:5.5
// The swift-tools-version declares the minimum version of Swift required to build this package.

import PackageDescription

let package = Package(
    name: "VKYC",
    platforms: [
        .iOS(.v13)
    ],
    products: [
        .library(
            name: "VKYC",
            targets: ["VKYC"]
        ),
    ],
    dependencies: [
        // React Native dependencies would be added here
        // In practice, React Native is usually added as a framework
    ],
    targets: [
        .target(
            name: "VKYC",
            dependencies: [],
            path: "Sources/VKYC",
            exclude: [],
            sources: [
                "VKYCConfig.swift",
                "VKYCDelegate.swift",
                "VKYCManager.swift",
                "VKYCViewController.swift",
                "VKYCBridgeModule.swift"
            ],
            publicHeadersPath: "."
        ),
        .testTarget(
            name: "VKYCTests",
            dependencies: ["VKYC"],
            path: "Tests/VKYCTests"
        ),
    ]
)
