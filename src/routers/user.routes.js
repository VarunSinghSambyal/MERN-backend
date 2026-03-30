import { Router } from "express";
import { LoginUser, LogoutUser, RefreshToken, registerUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { AuthenticateJWT } from "../middlewares/jwt.middleware.js";

const router = Router();

router.route("/register").post(
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  registerUser
);

router.route("/login").post(LoginUser);

// Secure routes can be added here with authentication middleware

router.route("/logout").post(AuthenticateJWT, LogoutUser);

router.route("/refresh-token").post(RefreshToken);

export default router;
