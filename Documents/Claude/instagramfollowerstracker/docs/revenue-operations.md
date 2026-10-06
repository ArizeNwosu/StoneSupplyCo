# Revenue and outreach operations

The release is safe by default: `OUTREACH_ENABLED=false` and `OUTREACH_DRY_RUN=true`. Deploying code or running cron cannot send email in this state. Stripe reconciliation is read-only on Stripe; it only repairs local access.

## 1. Deploy and observe

1. Apply the Prisma migration with `npx prisma migrate deploy`.
2. Configure `CRON_SECRET`, Stripe keys/webhook, `ADMIN_EMAIL`, and `REVENUE_TEST_EMAILS` in Vercel Production.
3. Leave outreach disabled and dry-run enabled. Deploy, then verify `/admin` → Revenue records pricing views, paywalls, attempts, completions, and expirations for 48 hours.
4. Confirm owner/test accounts do not appear in Revenue or Campaign denominators.

## 2. Configure IONOS

Use the complete IONOS mailbox address for `IONOS_EMAIL_USER` and its mailbox password for `IONOS_EMAIL_PASSWORD`.

- SMTP: `smtp.ionos.com`, port `465`, SSL/TLS. Port `587` is also supported and uses STARTTLS.
- IMAP: `imap.ionos.com`, port `993`, SSL/TLS.
- TLS certificate validation remains enabled.

Set `OUTREACH_FROM_NAME`, `OUTREACH_REPLY_TO`, a real physical `OUTREACH_COMPANY_ADDRESS`, and a long random `OUTREACH_TOKEN_SECRET`. `NEXT_PUBLIC_APP_URL` must be the production same-origin URL. Verify SPF, DKIM, and DMARC for the sender domain in IONOS before any live send.

## 3. Dry-run and allowlist smoke test

1. Keep `OUTREACH_ENABLED=false`, `OUTREACH_DRY_RUN=true`, and all campaigns disabled. Run `/api/cron/outreach-evaluate` using `Authorization: Bearer $CRON_SECRET` and inspect Campaigns in admin.
2. Enable only one campaign in the database/admin operation. Re-run evaluation and inspect recipients and content. Dry-run rows are never deliverable.
3. Set `OUTREACH_ALLOWLIST` to owner-controlled addresses only. Set `OUTREACH_ENABLED=true` and `OUTREACH_DRY_RUN=false`, then create a new test occurrence. Do not reuse dry-run rows.
4. Run the sender once. Verify delivery, sender/reply-to, visible unsubscribe link, one-click unsubscribe, and that the address is immediately suppressed.
5. Reply to the message. Run `/api/cron/outreach-replies`, verify the plain-text reply in Admin → Replies, classify it, and use the `mailto:` action to respond.

## 4. Gradual enablement

Start with `abandoned_core_checkout` and a small daily cap. Review sent, failed, replied, unsubscribed, and converted counts with explicit denominators. Then enable behavior campaigns one at a time. Transactional onboarding/cancellation campaigns are separate from the two-promotional-emails-per-seven-days cap.

## 5. Daily operation

- Evaluation runs daily; sending every 15 minutes; reply ingestion every 10 minutes; Stripe reconciliation daily.
- Campaigns shows disabled/dry-run/live state. Replies contains needs-response, responded, and resolved work.
- Use Revenue source rows to decide which paywall or checkout path to improve. Keep `REVENUE_TEST_EMAILS` current.
- Reply content is retained as bounded plain text; mailbox messages are not moved or deleted.

## Disable, rollback, and incidents

Set `OUTREACH_ENABLED=false` immediately to stop all sends; the sender checks this before constructing SMTP. Set every campaign `enabled=false` to stop new queue creation. Existing suppression remains in force. For complaints or bounces, add a normalized `OutreachSuppression` row with the matching reason.

If credentials may be exposed, disable outreach, rotate the IONOS password and `OUTREACH_TOKEN_SECRET`, update Vercel, and redeploy. Review failed categories in Campaigns without logging message bodies or credentials. Never delete suppression rows during rollback.
