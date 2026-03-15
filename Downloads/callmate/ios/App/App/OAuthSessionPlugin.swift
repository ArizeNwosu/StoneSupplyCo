import UIKit
import Capacitor
import AuthenticationServices

@objc(OAuthSessionPlugin)
public class OAuthSessionPlugin: CAPPlugin, ASWebAuthenticationPresentationContextProviding {
    private var authSession: ASWebAuthenticationSession?

    public func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
        guard let window = self.bridge?.viewController?.view.window else {
            // Fallback: find the foreground key window via connected scenes
            let scene = UIApplication.shared.connectedScenes
                .first(where: { $0.activationState == .foregroundActive }) as? UIWindowScene
            return scene?.windows.first(where: { $0.isKeyWindow })
                ?? scene?.windows.first
                ?? UIWindow()
        }
        return window
    }

    @objc func start(_ call: CAPPluginCall) {
        guard
            let urlString = call.getString("url"),
            let url = URL(string: urlString),
            let callbackScheme = call.getString("callbackScheme")
        else {
            call.reject("Missing url or callbackScheme")
            return
        }

        DispatchQueue.main.async {
            self.authSession = ASWebAuthenticationSession(
                url: url,
                callbackURLScheme: callbackScheme
            ) { callbackURL, error in
                if let authError = error as? ASWebAuthenticationSessionError,
                   authError.code == .canceledLogin {
                    call.reject("cancelled")
                    return
                }
                if let error = error {
                    call.reject(error.localizedDescription)
                    return
                }
                guard let callbackURL = callbackURL else {
                    call.reject("No callback URL returned")
                    return
                }
                call.resolve(["url": callbackURL.absoluteString])
            }
            self.authSession?.presentationContextProvider = self
            self.authSession?.prefersEphemeralWebBrowserSession = false
            self.authSession?.start()
        }
    }
}
