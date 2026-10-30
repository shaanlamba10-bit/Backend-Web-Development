'use strict';

// ─── GIVEN FILE — modify only to add caching (do not remove existing code) ───
require('dotenv').config();

const express = require('express');
const db      = require('./db');
const { cacheGet, cacheSet, cacheDel } = require('./cache');

const app = express();
app.use(express.json());

const FEED_KEY = 'feed:trending';
const FEED_TTL = 60;   // seconds

app.get('/health', (req, res) => res.json({ ok: true }));

// GET /feed — cache-aside: Redis first, database on a cache miss.
app.get('/feed', async (req, res) => {
  try {
    const t0 = Date.now();
    const cached = await cacheGet(FEED_KEY);

    if (cached !== null) {
      console.log(`[feed] HIT ${Date.now() - t0}ms`);
      return res.set('X-Cache', 'HIT').json(cached);
    }

    const posts = await db.getTrendingPosts();
    await cacheSet(FEED_KEY, posts, FEED_TTL);

    console.log(`[feed] MISS ${Date.now() - t0}ms`);
    return res.set('X-Cache', 'MISS').json(posts);
  } catch (err) {
    console.error('[feed] error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /posts — create a post and invalidate the stale trending feed.
app.post('/posts', async (req, res) => {
  try {
    const post = await db.createPost(req.body);
    await cacheDel(FEED_KEY);
    res.status(201).json(post);
  } catch (err) {
    console.error('[posts] error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const PORT = process.env.PORT || 3000;

if (require.main === module) {
  app.listen(PORT, () => console.log(`Server on http://localhost:${PORT}`));
}

module.exports = { app };
