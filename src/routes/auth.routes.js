import { Router } from "express"
import {asyncHandler} from "#lib/async-handler"
import {AuthController} from "#controllers/auth.controller"


const router = Router()

router.post(
  "/verify-email",
  asyncHandler(AuthController.verifyEmailController)
)
router.post("/auth/forgot-password", asyncHandler(AuthController.forgotPassword));
router.post("/auth/reset-password", asyncHandler(AuthController.resetPassword));


export default router