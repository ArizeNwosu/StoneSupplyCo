const InstagramAPI = require('../instagram-api');
const { query } = require('../db/pg');

const DAYS_BACK = 30;
const MAX_PAIRS = 12;

async function extractVoice(accountId, accessToken, platformAccountId, ownUsername, _igOverride = null) {
  try {
    const ig = _igOverride || new InstagramAPI(accessToken, platformAccountId);
    const media = await ig.getRecentMedia(DAYS_BACK);

    const pairs = [];
    for (const post of media) {
      if (pairs.length >= MAX_PAIRS) break;
      const comments = await ig.getCommentsForMedia(post.id);
      for (const comment of comments) {
        if (pairs.length >= MAX_PAIRS) break;
        if (comment.username === ownUsername) continue;
        if (!comment.replies?.data) continue;
        for (const reply of comment.replies.data) {
          if (reply.username === ownUsername) {
            pairs.push({ comment: comment.text, reply: reply.text });
            if (pairs.length >= MAX_PAIRS) break;
          }
        }
      }
    }

    if (pairs.length === 0) {
      console.log(`[voice-extraction] No pairs found for account ${accountId}`);
      return;
    }

    for (const pair of pairs) {
      await query(
        `INSERT INTO voice_examples (account_id, comment, reply, kind, intent)
         VALUES ($1, $2, $3, 'reply', NULL)`,
        [accountId, pair.comment, pair.reply]
      );
    }

    await query('UPDATE accounts SET voice_extracted = true WHERE id = $1', [accountId]);
    console.log(`[voice-extraction] Inserted ${pairs.length} examples for account ${accountId}`);
  } catch (err) {
    console.error(`[voice-extraction] Failed for account ${accountId}:`, err.message);
  }
}

module.exports = { extractVoice };
