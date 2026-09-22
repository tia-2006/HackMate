const mongoose = require("mongoose");
const Request = require("../models/Request");
const User = require("../models/User");
const Profile = require("../models/Profile");

// ==========================================
// @desc    Send a new request/invitation to another user
// @route   POST /api/requests
// @access  Private (Protected by JWT)
// ==========================================
// ==========================================
// @desc    Send a new request/invitation to another user
// @route   POST /api/requests
// @access  Private (Protected by JWT)
// ==========================================
const sendRequest = async (req, res) => {
    try {
        let receiverId = req.body.receiverId || req.body.receiver;

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

        // Check if receiverId is a Profile ID or User ID
        let receiverUser = await User.findById(receiverId);
        let targetUserId = receiverId;
        if (!receiverUser) {
            const profile = await Profile.findById(receiverId);
            if (profile) {
                targetUserId = profile.userId;
                receiverUser = await User.findById(targetUserId);
            }
        }

        if (!receiverUser) {
            return res.status(404).json({
                message: "Receiver user not found"
            });
        }

        // 3. Prevent sending request to yourself
        if (req.user._id.toString() === targetUserId.toString()) {
            return res.status(400).json({
                message: "You cannot send a request to yourself"
            });
        }

        // 4. Prevent duplicate pending requests between the same two users
        const userProfile = await Profile.findOne({ userId: req.user._id });
        const myIds = [req.user._id];
        if (userProfile) myIds.push(userProfile._id);

        const targetIds = [targetUserId];
        if (receiverId !== targetUserId) targetIds.push(receiverId);

        const existingDirectRequest = await Request.findOne({
            sender: { $in: myIds },
            receiver: { $in: targetIds },
            status: "pending"
        });

        if (existingDirectRequest) {
            return res.status(400).json({
                message: "A pending request to this user already exists"
            });
        }

        const existingReverseRequest = await Request.findOne({
            sender: { $in: targetIds },
            receiver: { $in: myIds },
            status: "pending"
        });

        if (existingReverseRequest) {
            return res.status(400).json({
                message: "A pending request from this user already exists. You can accept their request instead."
            });
        }

        // 5. Create request
        const request = await Request.create({
            sender: req.user._id,
            receiver: targetUserId,
            team: req.body.team || req.body.teamId,
            requestedRole: req.body.requestedRole,
            status: "pending"
        });

        await request.populate([
            { path: "sender", select: "name email" },
            { path: "receiver", select: "name email" },
            { path: "team", select: "name" }
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

        // Support matching either User._id or Profile._id in receiver field
        const userProfile = await Profile.findOne({ userId: req.user._id });
        const receiverIds = [req.user._id];
        if (userProfile) {
            receiverIds.push(userProfile._id);
        }

        const query = {
            receiver: { $in: receiverIds }
        };

        if (status && status !== "all") {
            query.status = status;
        } else if (!status) {
            query.status = "pending";
        }

        const requests = await Request.find(query)
            .populate("sender", "name email")
            .populate("receiver", "name email")
            .populate("team", "name")
            .sort({ createdAt: -1 });

        const requestsWithProfiles = await Promise.all(
            requests.map(async (r) => {
                const reqObj = r.toObject();
                if (reqObj.sender) {
                    let profile = await Profile.findOne({ userId: reqObj.sender._id || reqObj.sender });
                    if (!profile && reqObj.sender._id) {
                        profile = await Profile.findById(reqObj.sender._id);
                    }
                    reqObj.senderProfile = profile;
                    if (profile && (!reqObj.sender || !reqObj.sender.name)) {
                        reqObj.sender = {
                            _id: profile.userId || profile._id,
                            name: profile.fullName,
                            email: profile.email || ''
                        };
                    }
                }
                return reqObj;
            })
        );

        res.status(200).json({
            count: requestsWithProfiles.length,
            requests: requestsWithProfiles
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

        const userProfile = await Profile.findOne({ userId: req.user._id });
        const senderIds = [req.user._id];
        if (userProfile) {
            senderIds.push(userProfile._id);
        }

        const query = {
            sender: { $in: senderIds }
        };

        if (status && status !== "all") {
            query.status = status;
        } else if (!status) {
            query.status = "pending";
        }

        const requests = await Request.find(query)
            .populate("receiver", "name email")
            .populate("sender", "name email")
            .populate("team", "name")
            .sort({ createdAt: -1 });

        const requestsWithProfiles = await Promise.all(
            requests.map(async (r) => {
                const reqObj = r.toObject();
                if (reqObj.receiver) {
                    let profile = await Profile.findOne({ userId: reqObj.receiver._id || reqObj.receiver });
                    if (!profile && reqObj.receiver._id) {
                        profile = await Profile.findById(reqObj.receiver._id);
                    }
                    reqObj.receiverProfile = profile;
                    if (profile && (!reqObj.receiver || !reqObj.receiver.name)) {
                        reqObj.receiver = {
                            _id: profile.userId || profile._id,
                            name: profile.fullName,
                            email: profile.email || ''
                        };
                    }
                }
                return reqObj;
            })
        );

        res.status(200).json({
            count: requestsWithProfiles.length,
            requests: requestsWithProfiles
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

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid Request ID format"
            });
        }

        const request = await Request.findById(id);

        if (!request) {
            return res.status(404).json({
                message: "Request not found"
            });
        }

        const userProfile = await Profile.findOne({ userId: req.user._id });
        const myIds = [req.user._id.toString()];
        if (userProfile) myIds.push(userProfile._id.toString());

        if (myIds.includes(request.sender.toString())) {
            return res.status(403).json({
                message: "You cannot accept your own request"
            });
        }

        if (!myIds.includes(request.receiver.toString())) {
            return res.status(403).json({
                message: "Not authorized to accept this request"
            });
        }

        if (request.status !== "pending") {
            return res.status(400).json({
                message: `Cannot accept request. Request has already been ${request.status}`
            });
        }

        request.status = "accepted";
        await request.save();

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

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid Request ID format"
            });
        }

        const request = await Request.findById(id);

        if (!request) {
            return res.status(404).json({
                message: "Request not found"
            });
        }

        const userProfile = await Profile.findOne({ userId: req.user._id });
        const myIds = [req.user._id.toString()];
        if (userProfile) myIds.push(userProfile._id.toString());

        if (myIds.includes(request.sender.toString())) {
            return res.status(403).json({
                message: "You cannot reject your own request"
            });
        }

        if (!myIds.includes(request.receiver.toString())) {
            return res.status(403).json({
                message: "Not authorized to reject this request"
            });
        }

        if (request.status !== "pending") {
            return res.status(400).json({
                message: `Cannot reject request. Request has already been ${request.status}`
            });
        }

        request.status = "rejected";
        await request.save();

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

// ==========================================
// @desc    Delete/cancel a request
// @route   DELETE /api/requests/:id
// @access  Private (Sender or Receiver)
// ==========================================
const deleteRequest = async (req, res) => {
    try {
        const id = req.params.id || req.params.requestId;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid Request ID format"
            });
        }

        const request = await Request.findById(id);

        if (!request) {
            return res.status(404).json({
                message: "Request not found"
            });
        }

        const userProfile = await Profile.findOne({ userId: req.user._id });
        const myIds = [req.user._id.toString()];
        if (userProfile) myIds.push(userProfile._id.toString());

        if (!myIds.includes(request.sender.toString()) && !myIds.includes(request.receiver.toString())) {
            return res.status(403).json({
                message: "Not authorized to delete this request"
            });
        }

        await Request.findByIdAndDelete(id);

        res.status(200).json({
            message: "Request deleted successfully"
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
    rejectRequest,
    deleteRequest
};

