import express from "express";

import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

// We also send a body to this route, for example: { "choice": "left" }
router.post("/vote/:pairId");

export default router;
