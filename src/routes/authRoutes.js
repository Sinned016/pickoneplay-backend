import express from "express";
import { register, login, Me, logout } from "../controllers/authController.js";

const router = express.Router();

router.post("/register", register);

router.post("/login", login);

router.post("/logout", logout);

router.get("/me", Me);

export default router;
