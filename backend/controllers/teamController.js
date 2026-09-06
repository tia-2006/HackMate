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
        const team = await Team.findById(req.params.id)
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

module.exports = {
    createTeam,
    getTeams,
    getTeamById,
    getMyTeams
};
