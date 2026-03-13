import UIKit
import Capacitor
import AuthenticationServices

private class OAuthPresentationContext: NSObject, ASWebAuthenticationPresentationContextProviding {
    func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
        return UIApplication.shared.connectedScenes
            .compactMap { $0 as? UIWindowScene }
            .flatMap { $0.windows }
            .first { $0.isKeyWindow } ?? UIWindow()
    }
}

@objc(OAuthSessionPlugin)
public class OAuthSessionPlugin: CAPPlugin {
    private var authSession: ASWebAuthenticationSession?
    private let context = OAuthPresentationContext()

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
            self.authSession?.presentationContextProvider = self.context
            self.authSession?.prefersEphemeralWebBrowserSession = false
            self.authSession?.start()
        }
    }
}
