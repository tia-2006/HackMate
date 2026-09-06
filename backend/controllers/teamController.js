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

module.exports = {
    createTeam
};
