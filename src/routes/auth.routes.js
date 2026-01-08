import { Router } from "express"
import {asyncHandler} from "#lib/async-handler"
import {AuthController} from "#controllers/auth.controller"


const router = Router()

router.post(
  "/verify-email",
  asyncHandler(AuthController.verifyEmailController)
)

export default router