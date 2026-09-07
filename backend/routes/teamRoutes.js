const express = require("express");
const {
    createTeam,
    getTeams,
    getTeamById,
    getMyTeams,
    updateTeam,
    deleteTeam,
    leaveTeam
} = require("../controllers/teamController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Private route — create a new team
router.post("/", protect, createTeam);

// Private route — returns only teams the logged-in user leads or is a member of
router.get("/my-teams", protect, getMyTeams);

// Private route — leave a team (member only)
router.post("/:id/leave", protect, leaveTeam);
router.delete("/:id/leave", protect, leaveTeam);

// Public route — get a single team by ID
router.get("/:id", getTeamById);

// Public route — no auth required to browse teams
router.get("/", getTeams);

// Private route — only the team leader can update
router.put("/:id", protect, updateTeam);

// Private route — only the team leader can delete
router.delete("/:id", protect, deleteTeam);

module.exports = router;
