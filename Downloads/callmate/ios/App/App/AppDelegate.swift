import UIKit
import Capacitor
import AuthenticationServices
import WebKit

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?
    private var appleSignInHandlerAdded = false

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        return true
    }

    // Register the Apple Sign In message handler once the bridge WebView is ready
    func applicationDidBecomeActive(_ application: UIApplication) {
        if !appleSignInHandlerAdded {
            registerAppleSignInHandler()
        }
    }

    private func registerAppleSignInHandler(retries: Int = 10) {
        guard let bridgeVC = window?.rootViewController as? CAPBridgeViewController,
              let webView = bridgeVC.bridge?.webView else {
            // Bridge not ready yet — retry
            if retries > 0 {
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
                    self.registerAppleSignInHandler(retries: retries - 1)
                }
            }
            return
        }
        webView.configuration.userContentController.add(AppleSignInHandler(appDelegate: self), name: "appleSignIn")
        appleSignInHandlerAdded = true
    }

    // Called by AppleSignInHandler when JavaScript posts a message
    func handleAppleSignInRequest(nonce: String?) {
        let provider = ASAuthorizationAppleIDProvider()
        let request = provider.createRequest()
        request.requestedScopes = [.fullName, .email]
        if let nonce = nonce { request.nonce = nonce }
        let controller = ASAuthorizationController(authorizationRequests: [request])
        controller.delegate = self
        controller.presentationContextProvider = self
        controller.performRequests()
    }

    // Dispatch result back to JavaScript via CustomEvent
    func dispatchToWebView(_ js: String) {
        guard let bridgeVC = window?.rootViewController as? CAPBridgeViewController,
              let webView = bridgeVC.bridge?.webView else { return }
        DispatchQueue.main.async {
            webView.evaluateJavaScript(js, completionHandler: nil)
        }
    }

    func applicationWillResignActive(_ application: UIApplication) {}
    func applicationDidEnterBackground(_ application: UIApplication) {}
    func applicationWillEnterForeground(_ application: UIApplication) {}
    func applicationWillTerminate(_ application: UIApplication) {}

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }
}

// MARK: - WKScriptMessageHandler (receives messages from JavaScript)

class AppleSignInHandler: NSObject, WKScriptMessageHandler {
    weak var appDelegate: AppDelegate?
    init(appDelegate: AppDelegate) { self.appDelegate = appDelegate }

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard message.name == "appleSignIn" else { return }
        let nonce = (message.body as? [String: Any])?["nonce"] as? String
        appDelegate?.handleAppleSignInRequest(nonce: nonce)
    }
}

// MARK: - ASAuthorizationControllerDelegate

extension AppDelegate: ASAuthorizationControllerDelegate {
    func authorizationController(controller: ASAuthorizationController, didCompleteWithAuthorization authorization: ASAuthorization) {
        guard let credential = authorization.credential as? ASAuthorizationAppleIDCredential,
              let tokenData = credential.identityToken,
              let identityToken = String(data: tokenData, encoding: .utf8) else {
            dispatchToWebView("window.dispatchEvent(new CustomEvent('nativeAppleSignIn',{detail:{error:'No identity token'}}))")
            return
        }
        var payload: [String: String] = ["identityToken": identityToken]
        if let email = credential.email { payload["email"] = email }
        if let given = credential.fullName?.givenName { payload["givenName"] = given }
        if let family = credential.fullName?.familyName { payload["familyName"] = family }

        if let json = try? JSONSerialization.data(withJSONObject: payload),
           let jsonStr = String(data: json, encoding: .utf8) {
            let escaped = jsonStr.replacingOccurrences(of: "'", with: "\\'")
            dispatchToWebView("window.dispatchEvent(new CustomEvent('nativeAppleSignIn',{detail:{result:\(escaped)}}))")
        }
    }

    func authorizationController(controller: ASAuthorizationController, didCompleteWithError error: Error) {
        let msg = (error as? ASAuthorizationError)?.code == .canceled ? "cancelled" : error.localizedDescription
        let payload: [String: String] = ["error": msg]
        if let json = try? JSONSerialization.data(withJSONObject: payload),
           let jsonStr = String(data: json, encoding: .utf8) {
            dispatchToWebView("window.dispatchEvent(new CustomEvent('nativeAppleSignIn',{detail:\(jsonStr)}))")
        }
    }
}

// MARK: - ASAuthorizationControllerPresentationContextProviding

extension AppDelegate: ASAuthorizationControllerPresentationContextProviding {
    func presentationAnchor(for controller: ASAuthorizationController) -> ASPresentationAnchor {
        return window ?? UIWindow()
    }
}
