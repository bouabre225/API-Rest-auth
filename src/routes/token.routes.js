import { Router } from "express";
import { TokenController } from "#controllers/token.controller";
import { asyncHandler } from "#lib/async-handler";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();

// POST /auth/refresh - rafraîchir l'access token
router.post("/refresh", asyncHandler(TokenController.refresh));

// GET /auth/sessions - voir les sessions actives (protégé)
router.get("/sessions", authenticate, asyncHandler(TokenController.getSessions));

// DELETE /auth/sessions/:id - deconnecter une session (protégé)
router.delete("/sessions/:id", authenticate, asyncHandler(TokenController.revokeSession));

// DELETE /auth/sessions/others - deconnecter toutes les autres sessions (protégé)
router.delete("/sessions/others", authenticate, asyncHandler(TokenController.revokeOtherSessions));

export default router;