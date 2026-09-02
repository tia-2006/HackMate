const express = require("express");

const {
    registerUser,
    loginUser,
    getMe
} = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Public routes
router.post("/register", registerUser);
router.post("/login", loginUser);

// Protected routes
router.get("/me", protect, getMe);
router.get("/protected", protect, (req, res) => {
    res.status(200).json({
        message: "You have successfully accessed a protected route!",
        user: req.user
    });
});

module.exports = router;

