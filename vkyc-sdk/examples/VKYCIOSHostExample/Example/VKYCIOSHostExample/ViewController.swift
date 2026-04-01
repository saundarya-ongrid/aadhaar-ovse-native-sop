//
//  ViewController.swift
//  VKYCIOSHostExample
//
//  Created by saundarya-ongrid on 03/31/2026.
//  Copyright (c) 2026 saundarya-ongrid. All rights reserved.
//

import UIKit
import VKYC

class ViewController: UIViewController {

    private let startButton: UIButton = {
        let button = UIButton(type: .system)
        button.translatesAutoresizingMaskIntoConstraints = false
        button.setTitle("Start VKYC OVSE", for: .normal)
        button.titleLabel?.font = .systemFont(ofSize: 18, weight: .semibold)
        return button
    }()

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .systemBackground
        title = "VKYC iOS Host"

        view.addSubview(startButton)
        startButton.addTarget(self, action: #selector(startOVSE), for: .touchUpInside)

        NSLayoutConstraint.activate([
            startButton.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            startButton.centerYAnchor.constraint(equalTo: view.centerYAnchor)
        ])
    }

    @objc private func startOVSE() {
        let config = VKYCConfig(
            apiKey: "YOUR_GRIDLINES_API_KEY",
            environment: .staging,
            mode: .ovse
        )

        config.ovse = VKYCOVSEOptions(
            apiBaseUrl: "https://api-dev.gridlines.io/uidai-api/ovse",
            apiKey: "YOUR_GRIDLINES_API_KEY",
            initialApiKey: "YOUR_GRIDLINES_API_KEY",
            channelType: "APP",
            templateId: "1",
            expiryTimeInSeconds: 3600,
            consent: "Y",
            appPackageId: "in.ongrid.lav",
            appSignature: "DZ54P8HK5D",
            pollingIntervalMs: 5000,
            maxPollAttempts: 60
        )

        VKYCManager.start(from: self, config: config) { result in
            print("VKYC result: \(result)")
        }
    }

}

