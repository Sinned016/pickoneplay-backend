import express from "express";

import { authMiddleware } from "../middleware/authMiddleware.js";
import {
  createGame,
  deleteGame,
  getFullGame,
  getGame,
  getGames,
  getHomeGames,
  updateGame,
  updatePairScore,
  updatePlayScore,
} from "../controllers/gameController.js";
import { upload } from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.post("/create", authMiddleware, upload.any(), createGame);

router.delete("/delete/:id", authMiddleware, deleteGame);

router.put("/update/:id", authMiddleware, updateGame);

router.get("/games/home", getHomeGames);

router.get("/games", getGames);

router.get("/:id", getGame);

router.get("/getFullGame/:id", getFullGame);

router.put("/updatePairScore", updatePairScore);

router.put("/updatePlayScore/:id", updatePlayScore);

export default router;
