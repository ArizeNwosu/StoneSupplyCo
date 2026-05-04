require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const nodemailer = require('nodemailer');

const InstagramAPI = require('./instagram-api');
const FacebookAPI = require('./facebook-api');
const ReplyGenerator = require('./reply-generator');
const db = require('./database');

const { authenticate } = require('./auth/middleware');
const authRouter = require('./auth/routes');

// ── App setup ─────────────────────────────────────────────────────────────

const app = express();
app.use(cors());
app.use(express.json());

// Auth endpoints — no JWT required
app.use('/api/auth', authRouter);

// All other API endpoints require a valid JWT
app.use('/api', authenticate);

// Serve built React dashboard
app.use(express.static(path.join(__dirname, 'dashboard', 'dist')));

// ── Service instances ─────────────────────────────────────────────────────

const ig = new InstagramAPI(
  process.env.INSTAGRAM_ACCESS_TOKEN,
  process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID,
);

const fb = process.env.FACEBOOK_PAGE_ID
  ? new FacebookAPI(
      process.env.FACEBOOK_ACCESS_TOKEN || process.env.INSTAGRAM_ACCESS_TOKEN,
      process.env.FACEBOOK_PAGE_ID,
    )
  : null;

const generator = new ReplyGenerator(process.env.CLAUDE_API_KEY);
generator.setDb(db); // gives generator access to live settings + voice examples

// Own username — set on startup, used to filter self-comments
let ownUsername = null;
let ownPageName = null; // Facebook page name for self-filter

// ── Email alerts ──────────────────────────────────────────────────────────

const mailer = process.env.SMTP_USER
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  : null;

async function sendFlagAlert(comment, reply) {
  if (!mailer) {
    console.log('[Email] SMTP not configured — skipping alert email');
    return;
  }
  try {
    await mailer.sendMail({
      from: `"Snark Engine 🐍" <${process.env.SMTP_USER}>`,
      to: process.env.ALERT_EMAIL,
      subject: `🚨 Flagged comment from @${comment.username} — needs review`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px;">
          <h2 style="color:#e53e3e">⚠️ Flagged Comment Alert</h2>
          <table style="width:100%; border-collapse:collapse;">
            <tr><td style="padding:8px; font-weight:bold">From</td><td>@${comment.username}</td></tr>
            <tr style="background:#f7f7f7"><td style="padding:8px; font-weight:bold">Comment</td><td>${comment.text}</td></tr>
            <tr><td style="padding:8px; font-weight:bold">Flag reason</td><td style="color:#e53e3e">${reply.flag_reason}</td></tr>
            <tr style="background:#f7f7f7"><td style="padding:8px; font-weight:bold">AI reply draft</td><td>${reply.reply_text}</td></tr>
          </table>
          <p style="margin-top:24px">
            <a href="http://localhost:${process.env.PORT || 3001}"
               style="background:#2d3748; color:white; padding:10px 20px; text-decoration:none; border-radius:6px;">
              Review in Dashboard
            </a>
          </p>
          <p style="color:#718096; font-size:12px; margin-top:16px">
            This comment has been flagged and will NOT be auto-posted. Human approval required.
          </p>
        </div>
      `,
    });
    console.log(`[Email] Alert sent for @${comment.username}`);
  } catch (err) {
    console.error('[Email] Failed to send alert:', err.message);
  }
}

// ── Queue helpers ─────────────────────────────────────────────────────────

/** Random 5–30 minute delay in ms */
function randomStagger() {
  const min = 5 * 60 * 1000;
  const max = 30 * 60 * 1000;
  return Math.floor(Math.random() * (max - min) + min);
}

/** Like a comment if auto_like is enabled and comment is not flagged */
async function maybelike(source, commentId, isFlagged) {
  if (isFlagged) return; // Never like a complaint
  if (db.getSetting.get('auto_like_enabled')?.value !== 'true') return;
  try {
    if (source === 'facebook' && fb) {
      await fb.likeComment(commentId);
      console.log(`[Like] FB comment ${commentId}`);
    } else if (source === 'instagram') {
      await ig.likeComment(commentId);
      console.log(`[Like] IG comment ${commentId}`);
    }
  } catch (err) {
    console.warn(`[Like] Failed for ${commentId}: ${err.message}`);
  }
}

// ── Instagram comment poller ───────────────────────────────────────────────

let isPolling = false;

async function pollComments() {
  if (isPolling) return; // Prevent overlap
  isPolling = true;

  const lastPoll = db.getSetting.get('last_poll_timestamp')?.value
    || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  console.log(`\n[Poll] Checking for new comments (since ${lastPoll})`);

  try {
    const media = await ig.getRecentMedia();
    console.log(`[Poll] Found ${media.length} recent posts to check`);

    let newCount = 0;

    for (const post of media) {
      // Skip posts with 0 comments
      if ((post.comments_count || 0) === 0) continue;

      let comments;
      try {
        comments = await ig.getCommentsForMedia(post.id);
      } catch (err) {
        console.warn(`[Poll] Could not fetch comments for post ${post.id}: ${err.message}`);
        continue;
      }

      const lastPollDate = new Date(lastPoll);

      // Build flat list of items to process:
      // - Fresh top-level comments (newer than lastPoll)
      // - Fresh replies to ANY top-level comment (replies to replies, including replies to our posts)
      const toProcess = [];
      for (const comment of comments) {
        if (new Date(comment.timestamp) > lastPollDate) {
          toProcess.push({ ...comment, parent_comment_id: null });
        }
        // Check sub-replies regardless of whether the top-level comment is fresh
        for (const reply of (comment.replies?.data || [])) {
          if (new Date(reply.timestamp) > lastPollDate) {
            toProcess.push({ ...reply, parent_comment_id: comment.id });
          }
        }
      }

      if (comments.length > 0) {
        const topFresh = toProcess.filter(i => !i.parent_comment_id).length;
        const subFresh = toProcess.filter(i => i.parent_comment_id).length;
        console.log(`[Poll] Post ${post.id}: ${comments.length} top-level (${topFresh} fresh) + ${subFresh} fresh sub-replies`);
      }

      for (const item of toProcess) {
        // Skip own account's comments/replies (self-filter)
        if (ownUsername && item.username === ownUsername) continue;
        // Skip anything that looks like one of our own posted replies
        if (item.text && item.text.includes('www.Splitflask.com')) continue;
        // Skip blacklisted usernames
        try {
          const blacklist = JSON.parse(db.getSetting.get('blacklist_usernames')?.value || '[]');
          if (blacklist.includes(item.username)) {
            console.log(`[Poll] Skipping blacklisted @${item.username}`);
            continue;
          }
        } catch { /* ignore parse errors */ }

        // Skip if already in DB
        if (db.getCommentById.get(item.id)) continue;

        const label = item.parent_comment_id ? '[Sub-reply]' : '[Top-level]';
        console.log(`[New] ${label} @${item.username}: "${(item.text || '').substring(0, 60)}"`);

        // Store comment
        db.insertComment.run({
          id: item.id,
          post_id: post.id,
          post_permalink: post.permalink || null,
          parent_comment_id: item.parent_comment_id || null,
          username: item.username,
          text: item.text || '',
          timestamp: item.timestamp,
          source: 'instagram',
        });

        newCount++;

        // Generate AI reply (or use GIF template for empty/media-only comments)
        try {
          let reply;
          if (!item.text || !item.text.trim()) {
            const template = db.getSetting.get('gif_reply_template')?.value
              || '@{username} a gif? bold choice, we respect the energy 👉 www.Splitflask.com';
            reply = {
              reply_text: template.replace('{username}', item.username),
              confidence_score: 1.0,
              flagged_for_review: false,
              flag_reason: null,
            };
            console.log(`[Poll] GIF/media comment from @${item.username} — using template`);
          } else {
            reply = await generator.generateReply(item.username, item.text);
          }
          const scheduledAt = new Date(Date.now() + randomStagger()).toISOString();

          db.insertReply.run({
            comment_id: item.id,
            reply_text: reply.reply_text,
            confidence_score: reply.confidence_score,
            flagged_for_review: reply.flagged_for_review ? 1 : 0,
            flag_reason: reply.flag_reason || null,
            scheduled_at: scheduledAt,
          });

          const flag = reply.flagged_for_review ? '🚨 FLAGGED' : `✓ conf=${reply.confidence_score}`;
          console.log(`[Reply] Generated (${flag}) → scheduled ${scheduledAt}`);

          if (reply.flagged_for_review) {
            await sendFlagAlert(item, reply);
          }
        } catch (err) {
          console.error(`[Reply] Error generating for ${item.id}:`, err.message);
        }

        // Polite delay between Claude calls
        await new Promise((r) => setTimeout(r, 800));
      }
    }

    db.setSetting.run('last_poll_timestamp', new Date().toISOString());
    console.log(`[Poll] Done — ${newCount} new comment(s) processed\n`);
  } catch (err) {
    console.error('[Poll] Error:', err.message);
  } finally {
    isPolling = false;
  }
}

// ── Facebook comment poller ───────────────────────────────────────────────

let isFbPolling = false;

async function pollFacebookComments() {
  if (!fb) return; // No Facebook page configured
  if (isFbPolling) return;
  isFbPolling = true;

  const lastPoll = db.getSetting.get('fb_last_poll_timestamp')?.value
    || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  console.log(`\n[FB Poll] Checking for new comments (since ${lastPoll})`);

  try {
    const comments = await fb.getRecentComments(lastPoll);
    console.log(`[FB Poll] Found ${comments.length} comments since last poll`);

    let newCount = 0;

    for (const comment of comments) {
      // Skip own page's comments
      if (ownPageName && comment.username === ownPageName) continue;
      // Skip our own posted replies
      if (comment.text && comment.text.includes('www.Splitflask.com')) continue;
      // Skip blacklisted
      try {
        const blacklist = JSON.parse(db.getSetting.get('blacklist_usernames')?.value || '[]');
        if (blacklist.includes(comment.username)) continue;
      } catch { /* ignore */ }
      // Skip if already in DB
      if (db.getCommentById.get(comment.id)) continue;

      db.insertComment.run({
        id: comment.id,
        post_id: comment.post_id,
        post_permalink: comment.post_permalink || null,
        parent_comment_id: null,
        username: comment.username,
        text: comment.text || '',
        timestamp: comment.timestamp,
        source: 'facebook',
      });

      newCount++;
      console.log(`[FB New] ${comment.username}: "${(comment.text || '').substring(0, 60)}"`);

      try {
        let reply;
        if (!comment.text || !comment.text.trim()) {
          const template = db.getSetting.get('gif_reply_template')?.value
            || '@{username} a gif? bold choice, we respect the energy 👉 www.Splitflask.com';
          reply = {
            reply_text: template.replace('{username}', comment.username),
            confidence_score: 1.0,
            flagged_for_review: false,
            flag_reason: null,
          };
        } else {
          reply = await generator.generateReply(comment.username, comment.text, 'facebook');
        }
        const scheduledAt = new Date(Date.now() + randomStagger()).toISOString();
        db.insertReply.run({
          comment_id: comment.id,
          reply_text: reply.reply_text,
          confidence_score: reply.confidence_score,
          flagged_for_review: reply.flagged_for_review ? 1 : 0,
          flag_reason: reply.flag_reason || null,
          scheduled_at: scheduledAt,
        });
        const flag = reply.flagged_for_review ? '🚨 FLAGGED' : `✓ conf=${reply.confidence_score}`;
        console.log(`[FB Reply] Generated (${flag}) → scheduled ${scheduledAt}`);
        if (reply.flagged_for_review) await sendFlagAlert(comment, reply);
      } catch (err) {
        console.error(`[FB Reply] Error generating for ${comment.id}:`, err.message);
      }

      await new Promise(r => setTimeout(r, 800));
    }

    db.setSetting.run('fb_last_poll_timestamp', new Date().toISOString());
    console.log(`[FB Poll] Done — ${newCount} new comment(s) processed\n`);
  } catch (err) {
    console.error('[FB Poll] Error:', err.message);
  } finally {
    isFbPolling = false;
  }
}

// ── Auto-post queue processor ─────────────────────────────────────────────

function withinBusinessHours() {
  const enabled = db.getSetting.get('business_hours_enabled')?.value === 'true';
  if (!enabled) return true;
  const now = new Date();
  const hour = now.getHours();
  const start = parseInt(db.getSetting.get('business_hours_start')?.value || '9');
  const end   = parseInt(db.getSetting.get('business_hours_end')?.value   || '21');
  return hour >= start && hour < end;
}

function underDailyCap() {
  const enabled = db.getSetting.get('daily_cap_enabled')?.value === 'true';
  if (!enabled) return true;
  const cap = parseInt(db.getSetting.get('daily_cap')?.value || '50');
  const posted = db.countPostedToday.get().n;
  return posted < cap;
}

async function processQueue() {
  const mode = db.getSetting.get('mode')?.value || 'manual';
  if (mode !== 'auto') return;
  if (!withinBusinessHours()) { console.log('[Queue] Outside business hours — skipping'); return; }
  if (!underDailyCap()) { console.log('[Queue] Daily cap reached — skipping'); return; }

  const threshold = parseFloat(db.getSetting.get('confidence_threshold')?.value || '0.75');
  const due = db.getDueReplies.all();
  if (due.length === 0) return;

  console.log(`[Queue] Auto-mode: ${due.length} due, threshold=${threshold}`);

  for (const reply of due) {
    if (!underDailyCap()) { console.log('[Queue] Daily cap reached mid-batch'); break; }

    // Hold low-confidence replies for manual review
    if ((reply.confidence_score || 0) < threshold) {
      console.log(`[Queue] Holding low-confidence reply ${reply.id} (${reply.confidence_score} < ${threshold})`);
      continue;
    }

    try {
      // Route reply to correct platform based on comment source
      const comment = db.getCommentById.get(reply.comment_id);
      const source = comment?.source || 'instagram';
      // For IG sub-replies, post to the parent (top-level) comment's /replies endpoint
      const igTarget = comment?.parent_comment_id || reply.comment_id;
      if (source === 'facebook' && fb) {
        await fb.replyToComment(reply.comment_id, reply.reply_text);
      } else {
        await ig.replyToComment(igTarget, reply.reply_text);
      }
      db.updateReplyStatus.run('posted', new Date().toISOString(), reply.id);
      db.updateCommentStatus.run('replied', reply.comment_id);
      console.log(`[Queue] Auto-posted reply to ${reply.username} (${source})`);
      await maybelike(source, reply.comment_id, false);
    } catch (err) {
      console.error(`[Queue] Failed to post reply ${reply.id}:`, err.message);
    }
    await new Promise((r) => setTimeout(r, 1500));
  }
}

// ── REST API ──────────────────────────────────────────────────────────────

// GET /api/mode
app.get('/api/mode', (req, res) => {
  const mode = db.getSetting.get('mode')?.value || 'manual';
  res.json({ mode });
});

// POST /api/mode  { mode: 'manual' | 'auto' }
app.post('/api/mode', (req, res) => {
  const { mode } = req.body;
  if (!['manual', 'auto'].includes(mode)) {
    return res.status(400).json({ error: 'mode must be "manual" or "auto"' });
  }
  db.setSetting.run('mode', mode);
  console.log(`[Mode] Switched to ${mode}`);
  res.json({ mode });
});

// GET /api/queue?page=1&limit=20&filter=pending|flagged|rejected&source=all|instagram|facebook
app.get('/api/queue', (req, res) => {
  const page   = Math.max(1, parseInt(req.query.page)  || 1);
  const limit  = Math.min(50, parseInt(req.query.limit) || 20);
  const filter = ['pending', 'flagged', 'rejected'].includes(req.query.filter)
    ? req.query.filter : 'pending';
  const source = ['all', 'instagram', 'facebook'].includes(req.query.source)
    ? req.query.source : 'all';
  const offset = (page - 1) * limit;

  const whereMap = {
    pending:  `c.status = 'pending' AND (r.flagged_for_review = 0 OR r.id IS NULL)`,
    flagged:  `c.status = 'pending' AND r.flagged_for_review = 1`,
    rejected: `r.status IN ('rejected') OR c.status = 'skipped'`,
  };
  const sourceClause = source !== 'all' ? ` AND c.source = '${source}'` : '';
  const where = whereMap[filter] + sourceClause;

  const base = `
    FROM comments c
    LEFT JOIN replies r ON c.id = r.comment_id
    WHERE ${where}`;

  const total = db.db.prepare(`SELECT COUNT(*) as n ${base}`).get().n;
  const rows  = db.db.prepare(`
    SELECT c.*, r.id AS reply_id, r.reply_text, r.confidence_score,
           r.flagged_for_review, r.flag_reason, r.status AS reply_status, r.scheduled_at
    ${base}
    ORDER BY c.timestamp DESC
    LIMIT ${limit} OFFSET ${offset}
  `).all();

  res.json({ rows, total, page, limit, pages: Math.ceil(total / limit) });
});

// GET /api/all — all comments (for history view)
app.get('/api/all', (req, res) => {
  res.json(db.getAllComments.all());
});

// POST /api/replies/:id/approve — post reply immediately
app.post('/api/replies/:id/approve', async (req, res) => {
  const id = parseInt(req.params.id);
  const reply = db.getReplyById.get(id);
  if (!reply) return res.status(404).json({ error: 'Reply not found' });

  try {
    const comment = db.getCommentById.get(reply.comment_id);
    const source = comment?.source || 'instagram';
    // For IG sub-replies, post to the parent (top-level) comment's /replies endpoint
    const igTarget = comment?.parent_comment_id || reply.comment_id;
    if (source === 'facebook' && fb) {
      await fb.replyToComment(reply.comment_id, reply.reply_text);
    } else {
      await ig.replyToComment(igTarget, reply.reply_text);
    }
    db.updateReplyStatus.run('posted', new Date().toISOString(), id);
    db.updateCommentStatus.run('replied', reply.comment_id);
    console.log(`[Approve] Manually posted reply ${id} (${source})`);
    await maybelike(source, reply.comment_id, false);
    res.json({ success: true });
  } catch (err) {
    console.error('[Approve] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/replies/:id/reject
app.post('/api/replies/:id/reject', (req, res) => {
  const id = parseInt(req.params.id);
  const reply = db.getReplyById.get(id);
  if (!reply) return res.status(404).json({ error: 'Reply not found' });

  db.setReplyStatus.run('rejected', id);
  db.updateCommentStatus.run('skipped', reply.comment_id);
  console.log(`[Reject] Reply ${id} rejected`);
  res.json({ success: true });
});

// PATCH /api/replies/:id  { reply_text: '...' }
app.patch('/api/replies/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const { reply_text } = req.body;
  if (!reply_text || !reply_text.trim()) {
    return res.status(400).json({ error: 'reply_text is required' });
  }
  db.updateReplyText.run(reply_text.trim(), id);
  res.json({ success: true });
});

// POST /api/replies/:id/regenerate — re-run Claude on same comment
app.post('/api/replies/:id/regenerate', async (req, res) => {
  const id = parseInt(req.params.id);
  const reply = db.getReplyById.get(id);
  if (!reply) return res.status(404).json({ error: 'Reply not found' });

  const comment = db.getCommentById.get(reply.comment_id);
  if (!comment) return res.status(404).json({ error: 'Comment not found' });

  try {
    const fresh = await generator.generateReply(comment.username, comment.text);
    db.updateReplyText.run(fresh.reply_text, id);
    // Update confidence + flag
    db.db.prepare(`
      UPDATE replies SET confidence_score=?, flagged_for_review=?, flag_reason=? WHERE id=?
    `).run(fresh.confidence_score, fresh.flagged_for_review ? 1 : 0, fresh.flag_reason, id);
    res.json({ success: true, reply: fresh });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Backfill ──────────────────────────────────────────────────────────────

let backfillState = { running: false, processed: 0, total: 0, error: null };

async function runBackfill(days) {
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  backfillState = { running: true, processed: 0, total: 0, error: null };
  console.log(`[Backfill] Starting ${days}-day scan (since ${cutoff.toISOString()})`);

  try {
    // First pass: count posts with real comments
    let url = `${require('./instagram-api').BASE_URL || 'https://graph.facebook.com/v21.0'}/${process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID}/media`;
    const axios = require('axios');
    const token = process.env.INSTAGRAM_ACCESS_TOKEN;
    let params = { fields: 'id,timestamp,comments_count,permalink', limit: 50, access_token: token };
    const postsWithComments = [];

    while (url) {
      let res;
      try { res = await axios.get(url, { params }); }
      catch (e) { break; }
      const posts = res.data.data || [];
      let hitCutoff = false;
      for (const p of posts) {
        if (new Date(p.timestamp) < cutoff) { hitCutoff = true; break; }
        if ((p.comments_count || 0) > 1) postsWithComments.push(p);
      }
      url = hitCutoff ? null : (res.data.paging?.next || null);
      params = {};
    }

    backfillState.total = postsWithComments.length;
    console.log(`[Backfill] Found ${postsWithComments.length} posts with real comments`);

    for (const post of postsWithComments) {
      try {
        const cr = await axios.get(`https://graph.facebook.com/v21.0/${post.id}/comments`, {
          params: { fields: 'id,text,username,timestamp', limit: 50, access_token: token }
        });
        for (const c of (cr.data.data || [])) {
          if (ownUsername && c.username === ownUsername) continue;
          if (c.text && c.text.includes('www.Splitflask.com')) continue;
          if (db.getCommentById.get(c.id)) continue;
          db.insertComment.run({
            id: c.id, post_id: post.id, post_permalink: post.permalink || null,
            parent_comment_id: null,
            username: c.username, text: c.text || '', timestamp: c.timestamp,
            source: 'instagram',
          });
          console.log(`[Backfill] +comment @${c.username}: "${(c.text||'(gif)').substring(0,50)}"`);
        }
      } catch (e) {
        console.warn(`[Backfill] Failed post ${post.id}: ${e.message}`);
      }
      backfillState.processed++;
      await new Promise(r => setTimeout(r, 300));
    }

    db.setSetting.run('backfill_done', 'true');
    db.setSetting.run('last_poll_timestamp', cutoff.toISOString());
    backfillState.running = false;
    console.log('[Backfill] Complete');
  } catch (err) {
    backfillState.running = false;
    backfillState.error = err.message;
    console.error('[Backfill] Error:', err.message);
  }
}

// GET /api/backfill/status
app.get('/api/backfill/status', (req, res) => {
  const done = db.getSetting.get('backfill_done')?.value === 'true';
  res.json({ ...backfillState, done });
});

// POST /api/backfill/start  { days: 30 }
app.post('/api/backfill/start', (req, res) => {
  if (backfillState.running) return res.status(400).json({ error: 'Already running' });
  const done = db.getSetting.get('backfill_done')?.value === 'true';
  if (done) return res.status(400).json({ error: 'Backfill already completed' });
  const days = parseInt(req.body.days) || 30;
  res.json({ started: true, days });
  runBackfill(days);
});

// POST /api/backfill/skip
app.post('/api/backfill/skip', (req, res) => {
  db.setSetting.run('backfill_done', 'true');
  res.json({ success: true });
});

// POST /api/process-pending — generate replies for any comments missing one
app.post('/api/process-pending', async (req, res) => {
  const pending = db.db.prepare(`
    SELECT c.* FROM comments c
    LEFT JOIN replies r ON c.id = r.comment_id
    WHERE r.id IS NULL AND c.status = 'pending'
  `).all();

  if (pending.length === 0) return res.json({ processed: 0 });

  res.json({ processing: pending.length, message: 'Generating replies in background…' });

  for (const comment of pending) {
    try {
      const reply = await generator.generateReply(comment.username, comment.text);
      const scheduledAt = new Date(Date.now() + randomStagger()).toISOString();
      db.insertReply.run({
        comment_id: comment.id,
        reply_text: reply.reply_text,
        confidence_score: reply.confidence_score,
        flagged_for_review: reply.flagged_for_review ? 1 : 0,
        flag_reason: reply.flag_reason || null,
        scheduled_at: scheduledAt,
      });
      console.log(`[Process] Generated reply for @${comment.username}`);
    } catch (err) {
      console.error(`[Process] Failed for ${comment.id}:`, err.message);
    }
  }
});

// GET /api/settings — return all configurable settings
app.get('/api/settings', (req, res) => {
  const get = (k, fallback = '') => db.getSetting.get(k)?.value ?? fallback;
  res.json({
    gif_reply_template:    get('gif_reply_template'),
    tone:                  parseInt(get('tone', '3')),
    confidence_threshold:  parseFloat(get('confidence_threshold', '0.75')),
    business_hours_enabled: get('business_hours_enabled') === 'true',
    business_hours_start:  parseInt(get('business_hours_start', '9')),
    business_hours_end:    parseInt(get('business_hours_end', '21')),
    daily_cap_enabled:     get('daily_cap_enabled') === 'true',
    daily_cap:             parseInt(get('daily_cap', '50')),
    flagged_keywords:      JSON.parse(get('flagged_keywords', '[]')),
    blacklist_usernames:   JSON.parse(get('blacklist_usernames', '[]')),
    polling_interval:      parseInt(get('polling_interval', '60')),
    email_alerts_enabled:  get('email_alerts_enabled') !== 'false',
    auto_like_enabled:     get('auto_like_enabled') === 'true',
  });
});

// POST /api/settings — save any subset of settings
app.post('/api/settings', (req, res) => {
  const body = req.body;
  const str  = (k, v) => db.setSetting.run(k, String(v));
  const json = (k, v) => db.setSetting.run(k, JSON.stringify(v));

  if (body.gif_reply_template    !== undefined) str('gif_reply_template', body.gif_reply_template);
  if (body.tone                  !== undefined) str('tone', body.tone);
  if (body.confidence_threshold  !== undefined) str('confidence_threshold', body.confidence_threshold);
  if (body.business_hours_enabled !== undefined) str('business_hours_enabled', body.business_hours_enabled);
  if (body.business_hours_start  !== undefined) str('business_hours_start', body.business_hours_start);
  if (body.business_hours_end    !== undefined) str('business_hours_end', body.business_hours_end);
  if (body.daily_cap_enabled     !== undefined) str('daily_cap_enabled', body.daily_cap_enabled);
  if (body.daily_cap             !== undefined) str('daily_cap', body.daily_cap);
  if (body.flagged_keywords      !== undefined) json('flagged_keywords', body.flagged_keywords);
  if (body.blacklist_usernames   !== undefined) json('blacklist_usernames', body.blacklist_usernames);
  if (body.polling_interval      !== undefined) str('polling_interval', body.polling_interval);
  if (body.email_alerts_enabled  !== undefined) str('email_alerts_enabled', body.email_alerts_enabled);
  if (body.auto_like_enabled     !== undefined) str('auto_like_enabled', body.auto_like_enabled);

  res.json({ success: true });
});

// POST /api/settings/test-email
app.post('/api/settings/test-email', async (req, res) => {
  if (!mailer) return res.status(400).json({ error: 'SMTP not configured in .env' });
  try {
    await mailer.sendMail({
      from: `"Snark Engine 🐍" <${process.env.SMTP_USER}>`,
      to: process.env.ALERT_EMAIL,
      subject: '🐍 Snark Engine — test email',
      html: '<p>Your email alerts are working correctly.</p>',
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Voice Examples ────────────────────────────────────────────────────────

// GET /api/voice-examples
app.get('/api/voice-examples', (req, res) => {
  res.json(db.getAllVoiceExamples.all());
});

// POST /api/voice-examples  { comment, reply }
app.post('/api/voice-examples', (req, res) => {
  const { comment, reply } = req.body;
  if (!comment?.trim() || !reply?.trim())
    return res.status(400).json({ error: 'comment and reply are required' });
  const result = db.insertVoiceExample.run(comment.trim(), reply.trim());
  res.json({ id: result.lastInsertRowid });
});

// PATCH /api/voice-examples/:id  { comment?, reply?, active? }
app.patch('/api/voice-examples/:id', (req, res) => {
  const id = parseInt(req.params.id);
  if (req.body.active !== undefined) db.toggleVoiceExample.run(req.body.active ? 1 : 0, id);
  if (req.body.comment !== undefined && req.body.reply !== undefined)
    db.updateVoiceExample.run(req.body.comment, req.body.reply, id);
  res.json({ success: true });
});

// DELETE /api/voice-examples/:id
app.delete('/api/voice-examples/:id', (req, res) => {
  db.deleteVoiceExample.run(parseInt(req.params.id));
  res.json({ success: true });
});

// GET /api/metrics
app.get('/api/metrics', (req, res) => {
  res.json(db.getMetrics.get());
});

// GET /api/history
app.get('/api/history', (req, res) => {
  res.json(db.getReplyHistory.all());
});

// GET /api/health — token validation check
app.get('/api/health', async (req, res) => {
  try {
    const account = await ig.validateToken();
    res.json({ ok: true, account });
  } catch (err) {
    res.json({ ok: false, error: err.message });
  }
});

// Catch-all: serve dashboard for any non-API route
app.get('*', (req, res) => {
  const distIndex = path.join(__dirname, 'dashboard', 'dist', 'index.html');
  res.sendFile(distIndex, (err) => {
    if (err) res.status(200).send('<p>Dashboard not built yet. Run: <code>cd dashboard && npm install && npm run build</code></p>');
  });
});

// ── Start ─────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3001;

app.listen(PORT, async () => {
  const mode = db.getSetting.get('mode')?.value || 'manual';

  console.log(`
╔══════════════════════════════════════════════════╗
║          🐍  Snark Engine  —  @splitflask        ║
╠══════════════════════════════════════════════════╣
║  Server  → http://localhost:${PORT}                ║
║  Mode    → ${mode.toUpperCase().padEnd(37)}║
║  Account → ${(process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID || '—').padEnd(37)}║
╚══════════════════════════════════════════════════╝
  `);

  // Validate Instagram token and capture own username
  try {
    const account = await ig.validateToken();
    ownUsername = account.username || null;
    console.log(`[Auth] Instagram OK — @${ownUsername || account.name}`);
  } catch (err) {
    console.warn(`[Auth] Instagram token check failed: ${err.message}`);
  }

  // Validate Facebook page access if configured
  if (fb) {
    try {
      const page = await fb.validatePage();
      ownPageName = page.name || null;
      console.log(`[Auth] Facebook OK — "${ownPageName}" (${page.id})`);
    } catch (err) {
      console.warn(`[Auth] Facebook page check failed: ${err.message}`);
      console.warn('[Auth] Set FACEBOOK_PAGE_ID (and optionally FACEBOOK_ACCESS_TOKEN) in .env to enable');
    }
  } else {
    console.log('[Auth] Facebook not configured — set FACEBOOK_PAGE_ID in .env to enable');
  }
});

// Dynamic polling — reads interval from settings each cycle
function schedulePoll() {
  const secs = parseInt(db.getSetting.get('polling_interval')?.value || '60');
  Promise.all([
    pollComments(),
    pollFacebookComments(),
  ]).finally(() => {
    setTimeout(schedulePoll, secs * 1000);
  });
}
schedulePoll();

// Process auto-post queue every 30s
processQueue();
setInterval(processQueue, 30 * 1000);
