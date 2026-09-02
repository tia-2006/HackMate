const express = require("express");
const {
    createProfile,
    getMyProfile,
    updateProfile,
    getProfileByUserId,
    getAllProfiles
} = require("../controllers/profileController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// All profile routes are protected by JWT authentication
router.post("/", protect, createProfile);
router.get("/me", protect, getMyProfile);
router.put("/me", protect, updateProfile);
router.put("/", protect, updateProfile); // Support PUT /api/profile as well
router.get("/user/:userId", protect, getProfileByUserId);
router.get("/", protect, getAllProfiles);

module.exports = router;
