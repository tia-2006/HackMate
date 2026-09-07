const mongoose = require("mongoose");
const Team = require("../models/Team");


// ==========================================
// @desc    Create a new team
// @route   POST /api/teams
// @access  Private (Protected by JWT)
// ==========================================
const createTeam = async (req, res) => {
    try {
        const {
            name,
            description,
            hackathon,
            requiredRoles,
            requiredSkills,
            maxMembers
        } = req.body;

        // Validate required fields based on Team model
        if (!name || !hackathon) {
            return res.status(400).json({
                message: "Please provide all required fields: name, hackathon"
            });
        }

        // Create team with the logged-in user as leader and first member
        const team = await Team.create({
            name,
            description: description || "",
            hackathon,
            leader: req.user._id,
            members: [req.user._id],
            requiredRoles: requiredRoles || [],
            requiredSkills: requiredSkills || [],
            maxMembers: maxMembers || 4
        });

        res.status(201).json({
            message: "Team created successfully",
            team
        });
    } catch (error) {
        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};
const updateTeam = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid Team ID format"
            });
        }
        const {
            name,
            description,
            hackathon,
            requiredRoles,
            requiredSkills,
            maxMembers
        } = req.body;

        // Find the team
        const team = await Team.findById(id);

        if (!team) {
            return res.status(404).json({
                message: "Team not found"
            });
        }

        // Only the team leader can update the team
        if (team.leader.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                message: "Only the team leader can update this team"
            });
        }

        // Update only the fields that were provided
        if (name !== undefined) team.name = name;
        if (description !== undefined) team.description = description;
        if (hackathon !== undefined) team.hackathon = hackathon;
        if (requiredRoles !== undefined) team.requiredRoles = requiredRoles;
        if (requiredSkills !== undefined) team.requiredSkills = requiredSkills;
        if (maxMembers !== undefined) team.maxMembers = maxMembers;

        // Prevent maxMembers from being set below current member count
        if (maxMembers !== undefined && maxMembers < team.members.length) {
            return res.status(400).json({
                message: `maxMembers cannot be less than current member count (${team.members.length})`
            });
        }

        const updatedTeam = await team.save();

        res.status(200).json({
            message: "Team updated successfully",
            team: updatedTeam
        });
    } catch (error) {
        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};
// ==========================================
// @desc    Get all teams (with optional filters)
// @route   GET /api/teams
// @access  Public
// ==========================================
const getTeams = async (req, res) => {
    try {
        const { hackathon, requiredRoles, requiredSkills } = req.query;

        const filter = {};

        if (hackathon) {
            filter.hackathon = hackathon;
        }

        if (requiredRoles) {
            const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
            filter.requiredRoles = { $in: roles };
        }

        if (requiredSkills) {
            const skills = Array.isArray(requiredSkills) ? requiredSkills : [requiredSkills];
            filter.requiredSkills = { $in: skills };
        }

        const teams = await Team.find(filter);

        res.status(200).json({
            count: teams.length,
            teams
        });
    } catch (error) {
        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};

// ==========================================
// @desc    Get a single team by ID
// @route   GET /api/teams/:id
// @access  Public
// ==========================================
const getTeamById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid Team ID format"
            });
        }

        const team = await Team.findById(id)
            .populate("leader", "name email")
            .populate("members", "name email");

        if (!team) {
            return res.status(404).json({
                message: "Team not found"
            });
        }

        res.status(200).json({ team });
    } catch (error) {
        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};

// ==========================================
// @desc    Get teams the logged-in user belongs to
// @route   GET /api/teams/my-teams
// @access  Private (Protected by JWT)
// ==========================================
const getMyTeams = async (req, res) => {
    try {
        const userId = req.user._id;

        const teams = await Team.find({
            $or: [
                { leader: userId },
                { members: userId }
            ]
        });

        res.status(200).json({
            count: teams.length,
            teams
        });
    } catch (error) {
        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};

// ==========================================
// @desc    Delete a team
// @route   DELETE /api/teams/:id
// @access  Private (Leader only)
// ==========================================
const deleteTeam = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid Team ID format"
            });
        }

        const team = await Team.findById(id);

        if (!team) {
            return res.status(404).json({
                message: "Team not found"
            });
        }

        // Only the team leader can delete the team
        if (team.leader.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                message: "Only the team leader can delete this team"
            });
        }

        await Team.findByIdAndDelete(id);

        res.status(200).json({
            message: "Team deleted successfully"
        });
    } catch (error) {
        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};

// ==========================================
// @desc    Leave a team
// @route   POST /api/teams/:id/leave
// @access  Private (Member only)
// ==========================================
const leaveTeam = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid Team ID format"
            });
        }

        const team = await Team.findById(id);

        if (!team) {
            return res.status(404).json({
                message: "Team not found"
            });
        }

        // Team leader cannot leave the team (must delete or transfer)
        if (team.leader.toString() === req.user._id.toString()) {
            return res.status(400).json({
                message: "Team leader cannot leave the team. You must delete the team instead."
            });
        }

        // Check if user is actually a member of this team
        const isMember = team.members.some(
            (memberId) => memberId.toString() === req.user._id.toString()
        );

        if (!isMember) {
            return res.status(400).json({
                message: "You are not a member of this team"
            });
        }

        // Remove user from members array
        team.members = team.members.filter(
            (memberId) => memberId.toString() !== req.user._id.toString()
        );

        await team.save();

        res.status(200).json({
            message: "You have left the team successfully",
            team
        });
    } catch (error) {
        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};

module.exports = {
    createTeam,
    getTeams,
    getTeamById,
    getMyTeams, 
    updateTeam,
    deleteTeam,
    leaveTeam
};
