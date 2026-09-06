const express = require("express");
const { createTeam, getTeams, getTeamById, getMyTeams } = require("../controllers/teamController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// All team routes are protected by JWT authentication
router.post("/", protect, createTeam);

// Private route — returns only teams the logged-in user leads or is a member of
router.get("/my-teams", protect, getMyTeams);

// Public route — get a single team by ID
router.get("/:id", getTeamById);

// Public route — no auth required to browse teams
router.get("/", getTeams);

module.exports = router;
