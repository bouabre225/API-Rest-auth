const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const prisma = require('./database');

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || 'dummy-client-id',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'dummy-secret',
      callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/auth/google/callback'
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;
        
        let user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
          user = await prisma.user.create({
            data: {
              email,
              name: profile.displayName,
              emailVerified: true,
              emailVerifiedAt: new Date()
            }
          });
        }

        let oauthAccount = await prisma.oAuthAccount.findFirst({
          where: {
            provider: 'google',
            providerAccountId: profile.id
          }
        });

        if (!oauthAccount) {
          oauthAccount = await prisma.oAuthAccount.create({
            data: {
              userId: user.id,
              provider: 'google',
              providerAccountId: profile.id,
              accessToken,
              refreshToken
            }
          });
        } else {
          await prisma.oAuthAccount.update({
            where: { id: oauthAccount.id },
            data: { accessToken, refreshToken }
          });
        }

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;
