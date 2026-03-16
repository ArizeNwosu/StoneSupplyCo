// supabase/functions/verify-purchase/index.ts
//
// Production-grade Apple StoreKit 2 JWS verification.
//
// Flow:
//   1. Authenticate caller via their Supabase JWT
//   2. Validate request body fields
//   3. Decode the Apple JWS and cryptographically verify the x5c cert chain
//      (leaf → Apple WWDR intermediate → Apple Root CA G3)
//   4. Validate JWS payload claims (bundleId, productId, transactionId)
//   5. Idempotency check — if the transaction was already recorded, return
//      current AccessState without re-processing (or 409 if claimed by
//      a different user)
//   6. Insert into `purchases` table
//   7. Upgrade `profiles.tier` to 'monthly' | 'annual'
//   8. Return the caller's fresh AccessState object

import { createClient } from "npm:@supabase/supabase-js@2";
import * as jose from "npm:jose";
import { X509Certificate, cryptoProvider } from "npm:@peculiar/x509";

// Wire @peculiar/x509 to Deno's built-in Web Crypto
cryptoProvider.set(globalThis.crypto as Crypto);

// ─── Constants ───────────────────────────────────────────────────────────────

const BUNDLE_ID = "com.trycallmate.app";

const VALID_PRODUCT_IDS = new Set([
  "com.trycallmate.app.monthly",
  "com.trycallmate.app.annual",
]);

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ─── Types ───────────────────────────────────────────────────────────────────

type AccessTier = "free" | "trial" | "monthly" | "annual" | "admin";

interface AccessState {
  tier: AccessTier;
  selectedPlan: "monthly" | "annual" | null;
  scriptsUsed: number;
  scriptLimit: number;
  trialStartedAt: number | null;
  trialEndsAt: number | null;
  trialDaysRemaining: number;
  hasPremium: boolean;
  canGenerate: boolean;
  canPractice: boolean;
}

interface AppleJWSPayload {
  bundleId: string;
  productId: string;
  transactionId: string;
  originalTransactionId?: string;
  purchaseDate?: number;
  originalPurchaseDate?: number;
  expiresDate?: number;
  environment?: string;
  type?: string;
  quantity?: number;
}

// ─── Response helpers ─────────────────────────────────────────────────────────

function jsonResp(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

function errResp(status: number, message: string): Response {
  return jsonResp({ error: message }, status);
}

// ─── Certificate helpers ──────────────────────────────────────────────────────

/**
 * Wraps a base64-DER string (x5c array element per RFC 7517 §4.7)
 * in PEM armor so @peculiar/x509 and jose can parse it.
 */
function toPem(base64Der: string): string {
  const wrapped = (base64Der.match(/.{1,64}/g) ?? []).join("\n");
  return `-----BEGIN CERTIFICATE-----\n${wrapped}\n-----END CERTIFICATE-----`;
}

// ─── Apple JWS Verification ───────────────────────────────────────────────────

/**
 * Verifies an Apple StoreKit 2 JWS transaction token:
 *   1. Decodes the protected header to extract the x5c certificate chain
 *   2. Validates the chain cryptographically (root → intermediate → leaf)
 *   3. Validates subject names to confirm the chain belongs to Apple
 *   4. Verifies the JWS signature using the leaf certificate's public key
 *   5. Returns the decoded, verified payload
 *
 * signatureOnly: true is used for validity-period checks so that short-lived
 * Apple leaf certificates that may have technically expired don't cause false
 * rejections on old-but-valid receipts.
 */
async function verifyAppleJWS(jws: string): Promise<AppleJWSPayload> {
  // Step 1 — Decode header
  const header = jose.decodeProtectedHeader(jws);
  if (!header.alg) throw new Error("JWS protected header is missing 'alg'");

  const x5c = header.x5c as string[] | undefined;
  if (!Array.isArray(x5c) || x5c.length < 3) {
    throw new Error(
      "JWS x5c must contain at least 3 certificates [leaf, intermediate, root]",
    );
  }

  // Step 2 — Parse PEM certs
  const leafPem = toPem(x5c[0]);
  const intermediatePem = toPem(x5c[1]);
  const rootPem = toPem(x5c[2]);

  const leaf = new X509Certificate(leafPem);
  const intermediate = new X509Certificate(intermediatePem);
  const root = new X509Certificate(rootPem);

  // Step 3 — Subject name sanity checks
  if (!root.subject.includes("Apple Root CA - G3")) {
    throw new Error(
      `Root cert subject does not match Apple Root CA - G3. Got: ${root.subject}`,
    );
  }
  if (!intermediate.subject.includes("Apple Worldwide Developer Relations")) {
    throw new Error(
      `Intermediate cert subject unexpected. Got: ${intermediate.subject}`,
    );
  }

  // Step 4 — Cryptographic chain verification
  //
  //   root:         must be self-signed
  //   intermediate: must be signed by root
  //   leaf:         must be signed by intermediate
  //
  // signatureOnly: true — skip NotBefore/NotAfter checks so receipts remain
  // verifiable even after Apple's short-lived leaf certs expire.

  const rootSelfValid = await root.verify({ signatureOnly: true });
  if (!rootSelfValid) {
    throw new Error("Apple Root CA G3 self-signature verification failed");
  }

  const intermediateValid = await intermediate.verify({
    publicKey: root.publicKey,
    signatureOnly: true,
  });
  if (!intermediateValid) {
    throw new Error(
      "Apple WWDR intermediate cert is not signed by Apple Root CA G3",
    );
  }

  const leafValid = await leaf.verify({
    publicKey: intermediate.publicKey,
    signatureOnly: true,
  });
  if (!leafValid) {
    throw new Error("JWS leaf cert is not signed by Apple WWDR intermediate");
  }

  // Step 5 — Verify JWS signature using the leaf cert's public key
  const leafPublicKey = await jose.importX509(leafPem, header.alg);
  const { payload } = await jose.compactVerify(jws, leafPublicKey);

  // Step 6 — Decode and return payload
  return JSON.parse(new TextDecoder().decode(payload)) as AppleJWSPayload;
}

// ─── Access State Builder ─────────────────────────────────────────────────────

/**
 * Builds an AccessState matching the shape consumed by the client's
 * applyAccessState() in App.tsx / src/services/access.ts.
 */
async function buildAccessState(
  // deno-lint-ignore no-explicit-any
  admin: ReturnType<typeof createClient<any>>,
  userId: string,
): Promise<AccessState> {
  const [{ data: profile }, { count: scriptCount }] = await Promise.all([
    admin
      .from("profiles")
      .select("tier, trial_start_date")
      .eq("id", userId)
      .maybeSingle(),
    admin
      .from("scripts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
  ]);

  const tier = ((profile?.tier as AccessTier) ?? "free");
  const scriptsUsed = scriptCount ?? 0;
  const hasPremium = ["monthly", "annual", "admin", "trial"].includes(tier);
  const selectedPlan =
    tier === "monthly" || tier === "annual" ? tier : null;
  const scriptLimit =
    tier === "monthly" || tier === "annual" || tier === "admin"
      ? Number.MAX_SAFE_INTEGER
      : tier === "trial"
      ? 5
      : 3;

  return {
    tier,
    selectedPlan,
    scriptsUsed,
    scriptLimit,
    trialStartedAt: profile?.trial_start_date ?? null,
    trialEndsAt: null,
    trialDaysRemaining: 0,
    hasPremium,
    canGenerate: true,
    canPractice: true,
  };
}

// ─── Main handler ─────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS });
  }

  try {
    // ── 1. Authenticate caller ──────────────────────────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return errResp(401, "Missing Authorization header");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();

    if (userError || !user) return errResp(401, "Unauthorized");

    // ── 2. Validate request body ────────────────────────────────────────────
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return errResp(400, "Request body must be valid JSON");
    }

    const { transactionId, jwsToken, productId } = body as Record<
      string,
      unknown
    >;

    if (!transactionId || typeof transactionId !== "string") {
      return errResp(400, "Missing or invalid 'transactionId'");
    }
    if (!jwsToken || typeof jwsToken !== "string") {
      return errResp(400, "Missing or invalid 'jwsToken'");
    }
    if (!productId || !VALID_PRODUCT_IDS.has(productId as string)) {
      return errResp(
        400,
        `Invalid 'productId'. Accepted: ${[...VALID_PRODUCT_IDS].join(", ")}`,
      );
    }

    // ── 3. Verify Apple JWS ─────────────────────────────────────────────────
    let claims: AppleJWSPayload;
    try {
      claims = await verifyAppleJWS(jwsToken);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[verify-purchase] JWS verification failed:", msg);
      return errResp(400, `Apple JWS verification failed: ${msg}`);
    }

    // ── 4. Validate JWS payload claims ──────────────────────────────────────
    if (claims.bundleId !== BUNDLE_ID) {
      return errResp(400, `Invalid bundleId in JWS: "${claims.bundleId}"`);
    }
    if (claims.productId !== productId) {
      return errResp(
        400,
        `productId mismatch — JWS: "${claims.productId}", body: "${productId}"`,
      );
    }
    if (claims.transactionId !== transactionId) {
      return errResp(
        400,
        `transactionId mismatch — JWS: "${claims.transactionId}", body: "${transactionId}"`,
      );
    }

    // ── 5. Service-role DB client (bypasses RLS) ────────────────────────────
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    // ── 6. Idempotency check ────────────────────────────────────────────────
    const { data: existing, error: lookupErr } = await admin
      .from("purchases")
      .select("user_id, product_id")
      .eq("transaction_id", transactionId)
      .maybeSingle();

    if (lookupErr) {
      console.error("[verify-purchase] DB lookup error:", lookupErr);
      return errResp(500, "Database error during idempotency check");
    }

    if (existing) {
      if (existing.user_id !== user.id) {
        // Fraud — a different account already claimed this transaction
        console.warn(
          "[verify-purchase] Transaction replay attempt:",
          transactionId,
          "claimed by",
          existing.user_id,
          "attempted by",
          user.id,
        );
        return errResp(409, "Transaction already claimed by another account");
      }
      // Same user retrying (e.g., app re-opened after crash) — safe to return
      // the current access state without touching the DB again.
      const state = await buildAccessState(admin, user.id);
      return jsonResp(state);
    }

    // ── 7. Determine tier ───────────────────────────────────────────────────
    const tier: "monthly" | "annual" =
      productId === "com.trycallmate.app.annual" ? "annual" : "monthly";

    // ── 8. Record purchase (unique constraint on transaction_id) ────────────
    const { error: insertErr } = await admin.from("purchases").insert({
      user_id: user.id,
      transaction_id: transactionId,
      original_transaction_id: claims.originalTransactionId ?? transactionId,
      product_id: claims.productId,
      bundle_id: claims.bundleId,
      purchase_date: claims.purchaseDate ?? null,
      expires_date: claims.expiresDate ?? null,
      environment: claims.environment ?? "Production",
      jws_token: jwsToken,
    });

    if (insertErr) {
      if (insertErr.code === "23505") {
        // Race condition — a concurrent request already inserted; idempotent
        const state = await buildAccessState(admin, user.id);
        return jsonResp(state);
      }
      console.error("[verify-purchase] Insert error:", insertErr);
      return errResp(500, "Failed to record purchase");
    }

    // ── 9. Upgrade profile tier ─────────────────────────────────────────────
    const { error: updateErr } = await admin
      .from("profiles")
      .update({ tier, updated_at: new Date().toISOString() })
      .eq("id", user.id);

    if (updateErr) {
      console.error("[verify-purchase] Profile update error:", updateErr);
      return errResp(500, "Failed to upgrade account tier");
    }

    // ── 10. Return fresh AccessState ────────────────────────────────────────
    const state = await buildAccessState(admin, user.id);
    console.log(
      `[verify-purchase] ✅ ${user.id} → ${tier} (txn: ${transactionId})`,
    );
    return jsonResp(state);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    console.error("[verify-purchase] Unhandled exception:", err);
    return errResp(500, message);
  }
});
