import UIKit
import Capacitor

class AppViewController: CAPBridgeViewController {

    override func viewDidLoad() {
        super.viewDidLoad()
        // Match the WKWebView background to the app's warm beige (#f3eee4)
        // so there's no white flash between the native launch screen and the WebView.
        let warmBeige = UIColor(red: 243/255, green: 238/255, blue: 228/255, alpha: 1)
        webView?.isOpaque = false
        webView?.backgroundColor = warmBeige
        webView?.scrollView.backgroundColor = warmBeige
    }

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
