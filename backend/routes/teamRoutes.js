const express = require("express");
const { createTeam } = require("../controllers/teamController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// All team routes are protected by JWT authentication
router.post("/", protect, createTeam);

module.exports = router;
