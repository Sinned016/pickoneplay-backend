import express from "express";
import { register, login, Me, logout } from "../controllers/authController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import {
  deleteMyGame,
  getMyGames,
  updateMyGame,
  updateUserInfo,
} from "../controllers/profileController.js";

const router = express.Router();

router.put("/settings/update", authMiddleware, updateUserInfo);

router.get("/games", authMiddleware, getMyGames);

router.put("/games/update/:id", authMiddleware, updateMyGame);

router.delete("/games/delete/:id", authMiddleware, deleteMyGame);

export default router;
