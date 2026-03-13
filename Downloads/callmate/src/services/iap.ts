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

const pluginNames = ['StoreKit', 'Storekit', 'StoreKitPlugin'] as const;
const plugins = pluginNames.map((name) => registerPlugin<StoreKitPlugin>(name));

function isNotImplemented(error: unknown) {
  return error instanceof Error && /plugin is not implemented/i.test(error.message);
}

async function withStoreKit<T>(fn: (plugin: StoreKitPlugin) => Promise<T>): Promise<T> {
  let lastError: unknown = null;

  for (const plugin of plugins) {
    try {
      return await fn(plugin);
    } catch (error) {
      lastError = error;
      if (!isNotImplemented(error)) {
        throw error;
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error('StoreKit plugin is not available on this device.');
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
