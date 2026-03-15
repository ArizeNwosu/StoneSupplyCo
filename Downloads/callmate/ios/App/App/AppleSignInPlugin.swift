import Foundation
import Capacitor
import AuthenticationServices

@objc(AppleSignInPlugin)
public class AppleSignInPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "AppleSignInPlugin"
    public let jsName = "AppleSignInPlugin"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "signIn", returnType: CAPPluginReturnPromise),
    ]
    private var call: CAPPluginCall?

    @objc func signIn(_ call: CAPPluginCall) {
        // Reject concurrent calls — only one Apple Sign In sheet can be active at a time.
        if self.call != nil {
            call.reject("Sign In already in progress")
            return
        }
        self.call = call
        let nonce = call.getString("nonce")

        DispatchQueue.main.async {
            let provider = ASAuthorizationAppleIDProvider()
            let request = provider.createRequest()
            request.requestedScopes = [.fullName, .email]
            if let nonce = nonce {
                request.nonce = nonce
            }

            let controller = ASAuthorizationController(authorizationRequests: [request])
            controller.delegate = self
            controller.presentationContextProvider = self
            controller.performRequests()
        }
    }
}

extension AppleSignInPlugin: ASAuthorizationControllerDelegate {
    public func authorizationController(controller: ASAuthorizationController, didCompleteWithAuthorization authorization: ASAuthorization) {
        defer { self.call = nil }
        guard let credential = authorization.credential as? ASAuthorizationAppleIDCredential,
              let tokenData = credential.identityToken,
              let identityToken = String(data: tokenData, encoding: .utf8) else {
            call?.reject("No identity token returned from Apple")
            return
        }

        var result: [String: Any] = ["identityToken": identityToken]
        if let email = credential.email { result["email"] = email }
        if let given = credential.fullName?.givenName { result["givenName"] = given }
        if let family = credential.fullName?.familyName { result["familyName"] = family }

        call?.resolve(result)
    }

    public func authorizationController(controller: ASAuthorizationController, didCompleteWithError error: Error) {
        defer { self.call = nil }
        let msg = (error as? ASAuthorizationError)?.code == .canceled ? "cancelled" : error.localizedDescription
        call?.reject(msg)
    }
}

extension AppleSignInPlugin: ASAuthorizationControllerPresentationContextProviding {
    public func presentationAnchor(for controller: ASAuthorizationController) -> ASPresentationAnchor {
        // Reject rather than return a detached UIWindow() — a bare UIWindow() is not
        // connected to any scene and will cause the auth sheet to fail silently on iOS 13+.
        guard let window = self.bridge?.viewController?.view.window else {
            call?.reject("No presentation window available")
            self.call = nil
            return UIWindow()
        }
        return window
    }
}
