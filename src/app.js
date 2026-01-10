import express from "express";
import cors from "cors";
import helmet from "helmet";
import tokenRoutes from "./routes/token.routes.js"; // ← IMPORTANT
import { TokenService } from "./services/token.service.js"; // ← IMPORTANT

import { httpLogger } from "#lib/logger";
import { errorHandler } from "#middlewares/error-handler";
import { notFoundHandler } from "#middlewares/not-found";
import { generalLimiter } from "#middlewares/rate-limit.middleware";
import userRoutes from "#routes/user.routes";
import adminRoutes from "#routes/admin.routes";
// Les routes seront importez ici
import authRouter from "#routes/auth.routes"
const twoFactorRoutes = require('./routes/twoFactorRoutes');
const oauthRoutes = require('./routes/oauthRoutes');
const userRoutes2 = require('./routes/userRoutes');
const passport = require('./config/passport');

// import userRoutes from "#routes/user.routes";

const app = express();

// Middlewares
app.use(helmet());
app.use(cors());
app.use(httpLogger);
app.use(generalLimiter);
app.use(express.json());
app.use(passport.initialize());

// Route racine
app.get("/", (req, res) => {
  res.json({ 
    success: true, 
    message: "API d'authentification REST",
    version: "1.0.0",
    endpoints: [
      "GET    /                 - Cette page",
      "GET    /test-token       - Test service token",
      "GET    /auth/test        - Test routes token",
      "POST   /auth/refresh     - Rafraîchir token",
      "GET    /auth/sessions    - Voir sessions (protégé)",
      "DELETE /auth/sessions/:id - Déconnecter session"
    ]
  });
});

// Test du service Token
app.get("/test-token", async (req, res) => {
  try {
    const token = await TokenService.createRefreshToken(123, {
      device: req.headers['user-agent'] || 'Inconnu',
      ipAddress: req.ip
    });
    
    res.json({
      success: true,
      token: {
        value: token.token.substring(0, 15) + "...",
        device: token.device,
        expiresAt: token.expiresAt.toISOString()
      },
      message: "✅ Service token fonctionne !"
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Routes d'authentification
app.use("/auth", tokenRoutes); // ← IMPORTANT
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);
app.use(authRouter);
app.use("/2fa", twoFactorRoutes);
app.use("/oauth", oauthRoutes);
app.use("/user", userRoutes2);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.path} non trouvée`
  });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error("❌ Erreur:", err);
  res.status(500).json({
    success: false,
    error: "Erreur serveur interne"
  });
});

export default app;