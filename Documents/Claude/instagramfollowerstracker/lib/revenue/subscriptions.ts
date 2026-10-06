export function mapStripeStatusToAccess(status: string) {
  if (status === 'active' || status === 'trialing') {
    return { hasAccess: true, billingWarning: false };
  }
  if (status === 'past_due') {
    return { hasAccess: true, billingWarning: true };
  }
  return { hasAccess: false, billingWarning: false };
}

interface StripeEventClaimStore {
  claim(id: string, type: string): Promise<boolean>;
  release(id: string): Promise<void>;
}

export async function processStripeEvent<T extends { id: string; type: string }>(
  event: T,
  store: StripeEventClaimStore,
  handle: (event: T) => Promise<void>
) {
  if (!await store.claim(event.id, event.type)) return { duplicate: true as const };
  try {
    await handle(event);
    return { duplicate: false as const };
  } catch (error) {
    await store.release(event.id);
    throw error;
  }
}
