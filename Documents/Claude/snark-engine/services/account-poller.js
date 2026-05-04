const InstagramAPI = require('../instagram-api');
const { query } = require('../db/pg');
const { decrypt } = require('../lib/crypto');
const { classifyIntent } = require('./intent-classifier');
const { generateAccountReply } = require('./account-reply-generator');

const SPAM_AUTO_SKIP_THRESHOLD = 0.85;
const AUTO_POST_THRESHOLD = 0.75;
const SPICY_AUTO_POST_THRESHOLD = 0.90;

function shouldAutoPost(voiceIntensity, autoPostEnabled, intent, confidenceScore) {
  if (!autoPostEnabled) return false;
  if (intent !== 'high_intent' && intent !== 'engagement') return false;
  const threshold = voiceIntensity === 'spicy' ? SPICY_AUTO_POST_THRESHOLD : AUTO_POST_THRESHOLD;
  return confidenceScore >= threshold;
}

async function getAccountWithCredentials(accountId) {
  const result = await query(
    `SELECT a.id, a.voice_intensity, a.auto_post_enabled, a.replies_used, a.replies_limit,
            c.access_token, c.platform_account_id, c.username AS own_username
     FROM accounts a
     JOIN account_credentials c ON c.account_id = a.id AND c.platform = 'instagram'
     WHERE a.id = $1`,
    [accountId]
  );
  return result.rows[0] || null;
}

async function setLastPollTimestamp(accountId, timestamp) {
  await query(
    `INSERT INTO settings (account_id, key, value)
     VALUES ($1, 'last_poll_timestamp', $2)
     ON CONFLICT (account_id, key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
    [accountId, timestamp]
  );
}

async function getVoiceExamples(accountId) {
  const result = await query(
    `SELECT comment, reply, intent FROM voice_examples
     WHERE account_id = $1 AND active = true
     ORDER BY created_at DESC`,
    [accountId]
  );
  return result.rows;
}

async function pollAccount(accountId, _igOverride = null) {
  const account = await getAccountWithCredentials(accountId);
  if (!account) {
    console.log(`[account-poller] Account ${accountId}: not found or no Instagram credentials`);
    return;
  }

  if (account.replies_used >= account.replies_limit) {
    console.log(`[account-poller] Account ${accountId}: at reply limit (${account.replies_used}/${account.replies_limit})`);
    return;
  }

  const accessToken = decrypt(account.access_token);
  const ig = _igOverride || new InstagramAPI(accessToken, account.platform_account_id);
  const pollStart = new Date().toISOString();

  let media;
  try {
    media = await ig.getRecentMedia();
  } catch (err) {
    console.error(`[account-poller] Account ${accountId}: failed to fetch media:`, err.message);
    return;
  }

  const voiceExamples = await getVoiceExamples(accountId);

  for (const post of media) {
    let comments;
    try {
      comments = await ig.getCommentsForMedia(post.id);
    } catch (err) {
      console.warn(`[account-poller] Could not fetch comments for post ${post.id}:`, err.message);
      continue;
    }

    const freshComments = comments.filter(c => c.username !== account.own_username);

    for (const comment of freshComments) {
      // Re-check limit mid-poll
      const limitRow = await query('SELECT replies_used, replies_limit FROM accounts WHERE id = $1', [accountId]);
      const { replies_used, replies_limit } = limitRow.rows[0];
      if (replies_used >= replies_limit) {
        console.log(`[account-poller] Account ${accountId}: hit reply limit mid-poll`);
        break;
      }

      let insertResult;
      try {
        insertResult = await query(
          `INSERT INTO comments (id, account_id, post_id, post_permalink, username, text, timestamp, source)
           VALUES ($1, $2, $3, $4, $5, $6, $7, 'instagram')
           ON CONFLICT (id) DO NOTHING`,
          [comment.id, accountId, post.id, post.permalink || null, comment.username, comment.text, comment.timestamp]
        );
      } catch (err) {
        console.warn(`[account-poller] Could not insert comment ${comment.id}:`, err.message);
        continue;
      }

      // Skip if comment was already processed in a prior poll
      if (insertResult.rowCount === 0) {
        continue;
      }

      let intent = 'engagement';
      let intentConfidence = 0.5;
      try {
        const classification = await classifyIntent(comment.text, comment.username);
        intent = classification.intent;
        intentConfidence = classification.confidence;
      } catch (err) {
        console.warn(`[account-poller] Intent classification failed for ${comment.id}:`, err.message);
      }

      await query(
        'UPDATE comments SET intent = $1, intent_confidence = $2 WHERE id = $3',
        [intent, intentConfidence, comment.id]
      );

      if (intent === 'spam' && intentConfidence > SPAM_AUTO_SKIP_THRESHOLD) {
        await query("UPDATE comments SET status = 'skipped' WHERE id = $1", [comment.id]);
        console.log(`[account-poller] Auto-skipped spam comment ${comment.id}`);
        continue;
      }

      let replyText, confidenceScore;
      try {
        const result = await generateAccountReply({
          account: { username: account.own_username, voice_intensity: account.voice_intensity },
          commenterUsername: comment.username,
          commentText: comment.text,
          intent,
          voiceExamples,
        });
        replyText = result.reply_text;
        confidenceScore = result.confidence_score;
      } catch (err) {
        console.error(`[account-poller] Reply generation failed for ${comment.id}:`, err.message);
        continue;
      }

      let replyId;
      try {
        const replyResult = await query(
          `INSERT INTO replies (account_id, comment_id, reply_text, confidence_score, voice_intensity, status)
           VALUES ($1, $2, $3, $4, $5, 'pending')
           RETURNING id`,
          [accountId, comment.id, replyText, confidenceScore, account.voice_intensity]
        );
        if (!replyResult.rows[0]) {
          console.warn(`[account-poller] Reply insert returned no row for comment ${comment.id}`);
          continue;
        }
        replyId = replyResult.rows[0].id;
      } catch (err) {
        console.error(`[account-poller] Could not insert reply for comment ${comment.id}:`, err.message);
        continue;
      }

      await query('UPDATE accounts SET replies_used = replies_used + 1 WHERE id = $1', [accountId]);

      if (shouldAutoPost(account.voice_intensity, account.auto_post_enabled, intent, confidenceScore)) {
        try {
          await ig.replyToComment(comment.id, replyText);
          await query("UPDATE replies SET status = 'posted', posted_at = now() WHERE id = $1", [replyId]);
          await query("UPDATE comments SET status = 'replied' WHERE id = $1", [comment.id]);
          console.log(`[account-poller] Auto-posted reply for comment ${comment.id}`);
        } catch (err) {
          console.error(`[account-poller] Auto-post failed for ${comment.id}:`, err.message);
        }
      }
    }
  }

  try {
    await setLastPollTimestamp(accountId, pollStart);
  } catch (err) {
    console.warn(`[account-poller] Could not update last_poll_timestamp for account ${accountId}:`, err.message);
  }
  console.log(`[account-poller] Finished polling account ${accountId}`);
}

module.exports = { pollAccount, shouldAutoPost };
