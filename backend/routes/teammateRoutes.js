const express = require("express");
const { getTeammates } = require("../controllers/teammateController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// GET /api/teammates - Get all teammates excluding current user
router.get("/", protect, getTeammates);

module.exports = router;
