import Foundation
import Capacitor
import StoreKit

@available(iOS 15.0, *)
@objc(StoreKitPlugin)
public class StoreKitPlugin: CAPPlugin {
    private let productIds = [
        "com.trycallmate.app.monthly",
        "com.trycallmate.app.annual",
    ]

    @objc func fetchProducts(_ call: CAPPluginCall) {
        Task {
            do {
                let products = try await Product.products(for: productIds)
                let payload = products.map { product in
                    [
                        "id": product.id,
                        "displayName": product.displayName,
                        "displayPrice": product.displayPrice,
                    ]
                }
                call.resolve(["products": payload])
            } catch {
                call.reject(error.localizedDescription)
            }
        }
    }

    @objc func purchase(_ call: CAPPluginCall) {
        guard let productId = call.getString("productId"), !productId.isEmpty else {
            call.reject("Missing productId")
            return
        }

        Task {
            do {
                let products = try await Product.products(for: [productId])
                guard let product = products.first else {
                    call.reject("Product not found")
                    return
                }

                let result = try await product.purchase()
                switch result {
                case .success(let verificationResult):
                    let payload = try self.serialize(verificationResult: verificationResult)
                    let transaction = try self.checkVerified(verificationResult)
                    await transaction.finish()
                    call.resolve(payload)
                case .userCancelled:
                    call.reject("cancelled")
                case .pending:
                    call.reject("pending")
                @unknown default:
                    call.reject("Unknown purchase result")
                }
            } catch {
                call.reject(error.localizedDescription)
            }
        }
    }

    @objc func restorePurchases(_ call: CAPPluginCall) {
        Task {
            do {
                try await AppStore.sync()
                let entitlements = try await self.collectCurrentEntitlements()
                call.resolve(["entitlements": entitlements])
            } catch {
                call.reject(error.localizedDescription)
            }
        }
    }

    @objc func getEntitlements(_ call: CAPPluginCall) {
        Task {
            do {
                let entitlements = try await self.collectCurrentEntitlements()
                call.resolve(["entitlements": entitlements])
            } catch {
                call.reject(error.localizedDescription)
            }
        }
    }

    private func collectCurrentEntitlements() async throws -> [[String: String]] {
        var entitlements: [[String: String]] = []
        for await result in Transaction.currentEntitlements {
            entitlements.append(try serialize(verificationResult: result))
        }
        return entitlements
    }

    private func serialize(
        verificationResult: VerificationResult<Transaction>
    ) throws -> [String: String] {
        let transaction = try checkVerified(verificationResult)
        return [
            "transactionId": String(transaction.id),
            "productId": transaction.productID,
            "jwsToken": verificationResult.jwsRepresentation,
        ]
    }

    private func checkVerified<T>(_ result: VerificationResult<T>) throws -> T {
        switch result {
        case .verified(let signed):
            return signed
        case .unverified:
            throw NSError(domain: "StoreKitPlugin", code: 1, userInfo: [
                NSLocalizedDescriptionKey: "Transaction verification failed",
            ])
        }
    }
}
