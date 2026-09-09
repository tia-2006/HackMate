const mongoose = require("mongoose");
const Request = require("../models/Request");
const User = require("../models/User");

// ==========================================
// @desc    Send a new request/invitation to another user
// @route   POST /api/requests
// @access  Private (Protected by JWT)
// ==========================================
const sendRequest = async (req, res) => {
    try {
        const receiverId = req.body.receiverId || req.body.receiver;

        // 1. Validate receiverId presence
        if (!receiverId) {
            return res.status(400).json({
                message: "Please provide a valid receiverId"
            });
        }

        // 2. Validate receiverId format
        if (!mongoose.Types.ObjectId.isValid(receiverId)) {
            return res.status(400).json({
                message: "Invalid receiver ID format"
            });
        }

        // 3. Prevent sending request to yourself
        if (req.user._id.toString() === receiverId.toString()) {
            return res.status(400).json({
                message: "You cannot send a request to yourself"
            });
        }

        // 4. Check if receiver exists
        const receiver = await User.findById(receiverId);
        if (!receiver) {
            return res.status(404).json({
                message: "Receiver user not found"
            });
        }

        // 5. Prevent duplicate pending requests between the same two users
        const existingDirectRequest = await Request.findOne({
            sender: req.user._id,
            receiver: receiverId,
            status: "pending"
        });

        if (existingDirectRequest) {
            return res.status(400).json({
                message: "A pending request to this user already exists"
            });
        }

        const existingReverseRequest = await Request.findOne({
            sender: receiverId,
            receiver: req.user._id,
            status: "pending"
        });

        if (existingReverseRequest) {
            return res.status(400).json({
                message: "A pending request from this user already exists. You can accept their request instead."
            });
        }

        // 6. Create request
        const request = await Request.create({
            sender: req.user._id,
            receiver: receiverId,
            status: "pending"
        });

        await request.populate([
            { path: "sender", select: "name email" },
            { path: "receiver", select: "name email" }
        ]);

        res.status(201).json({
            message: "Request sent successfully",
            request
        });
    } catch (error) {
        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};

// ==========================================
// @desc    Get received requests for logged-in user
// @route   GET /api/requests/received
// @access  Private (Protected by JWT)
// ==========================================
const getReceivedRequests = async (req, res) => {
    try {
        const { status } = req.query;

        const query = {
            receiver: req.user._id
        };

        if (status && status !== "all") {
            query.status = status;
        } else if (!status) {
            // Default to pending received requests as specified
            query.status = "pending";
        }

        const requests = await Request.find(query)
            .populate("sender", "name email")
            .sort({ createdAt: -1 });

        res.status(200).json({
            count: requests.length,
            requests
        });
    } catch (error) {
        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};

// ==========================================
// @desc    Get sent requests by logged-in user
// @route   GET /api/requests/sent
// @access  Private (Protected by JWT)
// ==========================================
const getSentRequests = async (req, res) => {
    try {
        const { status } = req.query;

        const query = {
            sender: req.user._id
        };

        if (status && status !== "all") {
            query.status = status;
        } else if (!status) {
            // Default to pending sent requests as specified
            query.status = "pending";
        }

        const requests = await Request.find(query)
            .populate("receiver", "name email")
            .sort({ createdAt: -1 });

        res.status(200).json({
            count: requests.length,
            requests
        });
    } catch (error) {
        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};

// ==========================================
// @desc    Accept a received request
// @route   PUT /api/requests/:id/accept
// @access  Private (Protected by JWT, Receiver only)
// ==========================================
const acceptRequest = async (req, res) => {
    try {
        const id = req.params.id || req.params.requestId;

        // 1. Validate request ID format
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid Request ID format"
            });
        }

        // 2. Find the request
        const request = await Request.findById(id);

        if (!request) {
            return res.status(404).json({
                message: "Request not found"
            });
        }

        // 3. Prevent sender from accepting own request
        if (request.sender.toString() === req.user._id.toString()) {
            return res.status(403).json({
                message: "You cannot accept your own request"
            });
        }

        // 4. Verify that authenticated user is the receiver
        if (request.receiver.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                message: "Not authorized to accept this request"
            });
        }

        // 5. Verify that request is currently pending
        if (request.status !== "pending") {
            return res.status(400).json({
                message: `Cannot accept request. Request has already been ${request.status}`
            });
        }

        // 6. Change status to accepted
        request.status = "accepted";
        await request.save();

        await request.populate([
            { path: "sender", select: "name email" },
            { path: "receiver", select: "name email" }
        ]);

        res.status(200).json({
            message: "Request accepted successfully",
            request
        });
    } catch (error) {
        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};

// ==========================================
// @desc    Reject a received request
// @route   PUT /api/requests/:id/reject
// @access  Private (Protected by JWT, Receiver only)
// ==========================================
const rejectRequest = async (req, res) => {
    try {
        const id = req.params.id || req.params.requestId;

        // 1. Validate request ID format
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid Request ID format"
            });
        }

        // 2. Find the request
        const request = await Request.findById(id);

        if (!request) {
            return res.status(404).json({
                message: "Request not found"
            });
        }

        // 3. Prevent sender from rejecting own request
        if (request.sender.toString() === req.user._id.toString()) {
            return res.status(403).json({
                message: "You cannot reject your own request"
            });
        }

        // 4. Verify that authenticated user is the receiver
        if (request.receiver.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                message: "Not authorized to reject this request"
            });
        }

        // 5. Verify that request is currently pending
        if (request.status !== "pending") {
            return res.status(400).json({
                message: `Cannot reject request. Request has already been ${request.status}`
            });
        }

        // 6. Change status to rejected
        request.status = "rejected";
        await request.save();

        await request.populate([
            { path: "sender", select: "name email" },
            { path: "receiver", select: "name email" }
        ]);

        res.status(200).json({
            message: "Request rejected successfully",
            request
        });
    } catch (error) {
        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};

module.exports = {
    sendRequest,
    getReceivedRequests,
    getSentRequests,
    acceptRequest,
    rejectRequest
};
