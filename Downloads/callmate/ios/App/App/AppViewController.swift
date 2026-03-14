import UIKit
import Capacitor

class AppViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        bridge?.registerPluginType(OAuthSessionPlugin.self)
        bridge?.registerPluginType(StoreKitPlugin.self)
        bridge?.registerPluginType(NotificationSettingsPlugin.self)
    }
}
