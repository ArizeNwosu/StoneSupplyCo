import Foundation
import Capacitor
import UserNotifications
import UIKit

@objc(NotificationSettingsPlugin)
public class NotificationSettingsPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "NotificationSettingsPlugin"
    public let jsName = "NotificationSettingsPlugin"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "requestPermission", returnType: CAPPluginReturnPromise),
    ]
    @objc func requestPermission(_ call: CAPPluginCall) {
        let openSettings = call.getBool("openSettings") ?? false

        UNUserNotificationCenter.current().getNotificationSettings { settings in
            switch settings.authorizationStatus {
            case .authorized, .provisional, .ephemeral:
                call.resolve([
                    "status": "granted",
                    "openedSettings": false,
                ])
            case .denied:
                if openSettings {
                    DispatchQueue.main.async {
                        if let url = URL(string: UIApplication.openSettingsURLString),
                           UIApplication.shared.canOpenURL(url) {
                            UIApplication.shared.open(url)
                            call.resolve([
                                "status": "denied",
                                "openedSettings": true,
                            ])
                        } else {
                            call.resolve([
                                "status": "denied",
                                "openedSettings": false,
                            ])
                        }
                    }
                } else {
                    call.resolve([
                        "status": "denied",
                        "openedSettings": false,
                    ])
                }
            case .notDetermined:
                UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .badge, .sound]) { granted, error in
                    if let error {
                        call.reject(error.localizedDescription)
                        return
                    }
                    call.resolve([
                        "status": granted ? "granted" : "denied",
                        "openedSettings": false,
                    ])
                }
            @unknown default:
                call.resolve([
                    "status": "unknown",
                    "openedSettings": false,
                ])
            }
        }
    }
}
