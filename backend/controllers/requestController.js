const mongoose = require("mongoose");
const Request = require("../models/Request");
const User = require("../models/User");
const Profile = require("../models/Profile");
const Team = require("../models/Team");

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

        // 4. Resolve team and verify membership
        let teamId = req.body.team || req.body.teamId;
        if (!teamId) {
            const userTeam = await Team.findOne({ leader: req.user._id }) || await Team.findOne({ members: req.user._id });
            if (userTeam) {
                teamId = userTeam._id;
            }
        }

        if (teamId) {
            const existingTeam = await Team.findById(teamId);
            if (existingTeam && existingTeam.members.some(m => m.toString() === targetUserId.toString())) {
                return res.status(400).json({
                    message: "This user is already a member of your team"
                });
            }
        }

        // 5. Prevent duplicate pending requests between the same two users
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

        // 6. Resolve requested role if not provided
        let requestedRole = req.body.requestedRole;
        if (!requestedRole) {
            const receiverProfile = await Profile.findOne({ userId: targetUserId });
            if (receiverProfile && receiverProfile.preferredRole) {
                requestedRole = receiverProfile.preferredRole;
            }
        }

        // 7. Create request
        const request = await Request.create({
            sender: req.user._id,
            receiver: targetUserId,
            team: teamId || undefined,
            requestedRole: requestedRole || undefined,
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
                if (!reqObj.team) {
                    const t = await Team.findOne({ leader: reqObj.sender?._id || reqObj.sender })
                           || await Team.findOne({ members: reqObj.sender?._id || reqObj.sender });
                    if (t) {
                        reqObj.team = { _id: t._id, name: t.name };
                    }
                }
                if (!reqObj.requestedRole && reqObj.receiver) {
                    let rProfile = await Profile.findOne({ userId: reqObj.receiver._id || reqObj.receiver });
                    if (rProfile && rProfile.preferredRole) {
                        reqObj.requestedRole = rProfile.preferredRole;
                    }
                }
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
                if (!reqObj.team) {
                    const t = await Team.findOne({ leader: reqObj.sender?._id || reqObj.sender })
                           || await Team.findOne({ members: reqObj.sender?._id || reqObj.sender });
                    if (t) {
                        reqObj.team = { _id: t._id, name: t.name };
                    }
                }
                if (reqObj.receiver) {
                    let profile = await Profile.findOne({ userId: reqObj.receiver._id || reqObj.receiver });
                    if (!profile && reqObj.receiver._id) {
                        profile = await Profile.findById(reqObj.receiver._id);
                    }
                    reqObj.receiverProfile = profile;
                    if (!reqObj.requestedRole && profile && profile.preferredRole) {
                        reqObj.requestedRole = profile.preferredRole;
                    }
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

        // 1. Mark request as accepted
        request.status = "accepted";

        // 2. Find team associated with request
        let team = null;
        if (request.team) {
            team = await Team.findById(request.team);
        }

        if (!team) {
            team = await Team.findOne({ leader: request.sender }) || await Team.findOne({ members: request.sender });
            if (!team) {
                team = await Team.findOne({ leader: request.receiver }) || await Team.findOne({ members: request.receiver });
            }
            if (team) {
                request.team = team._id;
            }
        }

        // 3. Add accepted member to team
        if (team) {
            const senderInTeam = team.leader.toString() === request.sender.toString() ||
                team.members.some(m => m.toString() === request.sender.toString());
            const receiverInTeam = team.leader.toString() === request.receiver.toString() ||
                team.members.some(m => m.toString() === request.receiver.toString());

            let newMemberRawId = request.receiver;
            if (senderInTeam && !receiverInTeam) {
                newMemberRawId = request.receiver;
            } else if (receiverInTeam && !senderInTeam) {
                newMemberRawId = request.sender;
            }

            // Resolve to User ID if it's a Profile ID
            let newMemberUserId = newMemberRawId;
            const userObj = await User.findById(newMemberRawId);
            if (!userObj) {
                const prof = await Profile.findById(newMemberRawId);
                if (prof && prof.userId) {
                    newMemberUserId = prof.userId;
                }
            }

            const alreadyInTeam = team.members.some(
                m => m.toString() === newMemberUserId.toString()
            );

            if (!alreadyInTeam) {
                team.members.push(newMemberUserId);
                await team.save();
            }
        }

        await request.save();

        res.status(200).json({
            message: "Request accepted successfully",
            request,
            team: team || undefined
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

