const express = require("express");
const { getTeammates } = require("../controllers/teammateController");
const { protect, optionalProtect } = require("../middleware/authMiddleware");

const router = express.Router();

// GET /api/teammates - Get all teammates (optional auth)
router.get("/", optionalProtect, getTeammates);

module.exports = router;
