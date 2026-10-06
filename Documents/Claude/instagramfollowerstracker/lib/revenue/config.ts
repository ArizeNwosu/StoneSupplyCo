function normalizedList(value: string | undefined) {
  return (value ?? '')
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

export function isRevenueTestEmail(email: string | null | undefined) {
  if (!email) return false;
  return normalizedList(process.env.REVENUE_TEST_EMAILS).includes(email.trim().toLowerCase());
}

export function getOutreachMode() {
  return {
    enabled: process.env.OUTREACH_ENABLED === 'true',
    dryRun: process.env.OUTREACH_DRY_RUN !== 'false',
    allowlist: normalizedList(process.env.OUTREACH_ALLOWLIST),
  };
}
