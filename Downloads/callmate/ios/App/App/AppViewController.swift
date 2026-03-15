import UIKit
import Capacitor

class AppViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        super.capacitorDidLoad()
        print("🔌 [PLUGIN] capacitorDidLoad — bridge=\(bridge as Any)")

        // registerPluginInstance bypasses metatype casting — more reliable than registerPluginType
        bridge?.registerPluginInstance(OAuthSessionPlugin())
        bridge?.registerPluginInstance(StoreKitPlugin())
        bridge?.registerPluginInstance(AppleSignInPlugin())
        bridge?.registerPluginInstance(NotificationSettingsPlugin())
        bridge?.registerPluginInstance(VoiceSimulatorPlugin())

        print("🔌 [PLUGIN] All plugins registered")
    }
}
