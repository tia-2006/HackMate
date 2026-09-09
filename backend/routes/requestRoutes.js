const express = require("express");
const {
    sendRequest,
    getReceivedRequests,
    getSentRequests,
    acceptRequest,
    rejectRequest
} = require("../controllers/requestController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// All request endpoints require JWT authentication
router.post("/", protect, sendRequest);
router.get("/received", protect, getReceivedRequests);
router.get("/sent", protect, getSentRequests);
router.put("/:id/accept", protect, acceptRequest);
router.put("/:id/reject", protect, rejectRequest);

module.exports = router;
