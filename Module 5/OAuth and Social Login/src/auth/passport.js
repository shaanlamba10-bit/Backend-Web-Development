'use strict';
// auth/passport.js — Google OAuth strategy

const passport = require('passport');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const { users, nextId } = require('../data');

async function verifyCallback(accessToken, refreshToken, profile, done) {
  try {
    // Prefer Google's stable subject ID for returning users.
    const returningUser = users.find((user) => user.googleId === profile.id);
    if (returningUser) {
      return done(null, returningUser);
    }

    const email = profile.emails[0].value;
    const existingUser = users.find((user) => user.email === email);

    if (existingUser) {
      // Only link an existing local account when Google verifies ownership
      // of the email address; otherwise the account could be taken over.
      if (profile._json.email_verified === true) {
        existingUser.googleId = profile.id;
        return done(null, existingUser);
      }
      return done(null, false);
    }

    const newUser = {
      id: nextId(),
      googleId: profile.id,
      email,
      name: profile.displayName,
      role: 'member',
    };
    users.push(newUser);
    return done(null, newUser);
  } catch (err) {
    return done(err);
  }
}

passport.use(
  new GoogleStrategy(
    {
      clientID:     process.env.GOOGLE_CLIENT_ID     || 'test-client-id',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'test-client-secret',
      callbackURL:  '/auth/google/callback',
    },
    verifyCallback,
  ),
);

// verifyCallback is exported so tests can call it directly without a real browser.
module.exports = { passport, verifyCallback };
