import UIKit
import Capacitor

class AppViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        super.capacitorDidLoad()
        bridge?.registerPluginType(OAuthSessionPlugin.self)
        bridge?.registerPluginType(StoreKitPlugin.self)
        bridge?.registerPluginType(AppleSignInPlugin.self)
        bridge?.registerPluginType(NotificationSettingsPlugin.self)
        bridge?.registerPluginType(VoiceSimulatorPlugin.self)
    }
}
