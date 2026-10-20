'use strict';
// routes/auth.js — OAuth entry points

const router  = require('express').Router();
const { passport } = require('../auth/passport');
const { signToken } = require('../utils/jwt');

// Triggers the OAuth flow.
router.get(
  '/google',
  passport.authenticate('google', {
    scope:   ['openid', 'email', 'profile'],
    session: false,
  }),
);

// Google OAuth callback: exchange the authenticated app user for our own JWT.
router.get(
  '/google/callback',
  passport.authenticate('google', {
    session:         false,
    failureRedirect: '/auth/failure',
  }),
  (req, res) => {
    const token = signToken({ sub: req.user.id, role: req.user.role });
    res.json({ token });
  },
);

// Shown when OAuth fails or is denied.
router.get('/failure', (_req, res) => {
  res.status(401).json({ error: { code: 'OAUTH_FAILED', message: 'Google login failed or was denied' } });
});

module.exports = router;
