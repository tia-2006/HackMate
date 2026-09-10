const express = require("express");
const {
    getMatches,
    getTeamMatches,
    saveMatch
} = require("../controllers/matchController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// All match endpoints require JWT authentication
router.get("/", protect, getMatches);
router.get("/teams", protect, getTeamMatches);
router.post("/save", protect, saveMatch);

module.exports = router;
