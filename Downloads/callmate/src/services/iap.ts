import { Capacitor, registerPlugin } from '@capacitor/core';

export const PRODUCT_IDS = {
  monthly: 'com.trycallmate.app.monthly',
  annual: 'com.trycallmate.app.annual',
} as const;

interface StoreKitPlugin {
  fetchProducts(): Promise<{ products: Array<{ id: string; displayName: string; displayPrice: string }> }>;
  purchase(options: { productId: string }): Promise<{ transactionId: string; productId: string; jwsToken: string }>;
  restorePurchases(): Promise<{ entitlements: Array<{ productId: string; transactionId: string; jwsToken: string }> }>;
  getEntitlements(): Promise<{ entitlements: Array<{ productId: string; transactionId: string; jwsToken: string }> }>;
}

const StoreKit = registerPlugin<StoreKitPlugin>('StoreKitPlugin');

function isNotImplemented(error: unknown) {
  return error instanceof Error && /plugin is not implemented/i.test(error.message);
}

async function withStoreKit<T>(fn: (plugin: StoreKitPlugin) => Promise<T>): Promise<T> {
  try {
    return await fn(StoreKit);
  } catch (error: any) {
    console.error('[IAP] StoreKit call failed:', error?.message, error?.code);
    if (isNotImplemented(error)) {
      throw new Error('StoreKit plugin is not implemented on iOS. Ensure the .m and .swift files are correctly added to the Xcode project.');
    }
    throw error;
  }
}

export async function fetchProducts() {
  if (!Capacitor.isNativePlatform()) return [];
  const { products } = await withStoreKit((plugin) => plugin.fetchProducts());
  return products;
}

export async function purchaseProduct(productId: string) {
  if (!Capacitor.isNativePlatform()) {
    throw new Error('In-app purchase is only available on device.');
  }
  return withStoreKit((plugin) => plugin.purchase({ productId }));
}

export async function restorePurchases() {
  if (!Capacitor.isNativePlatform()) return [];
  const { entitlements } = await withStoreKit((plugin) => plugin.restorePurchases());
  return entitlements;
}

export async function getActiveEntitlements() {
  if (!Capacitor.isNativePlatform()) return [];
  const { entitlements } = await withStoreKit((plugin) => plugin.getEntitlements());
  return entitlements;
}
