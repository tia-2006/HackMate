const Profile = require("../models/Profile");

// ==========================================
// @desc    Get all teammates with optional filters and search
// @route   GET /api/teammates
// @access  Private (Protected by JWT)
// ==========================================
const getTeammates = async (req, res) => {
    try {
        const { role, skill, college, interest, search } = req.query;

        // Base query: always exclude the currently logged-in user
        const query = {
            userId: { $ne: req.user._id }
        };

        // 🎯 1. Filter by Preferred Role
        if (role) {
            query.preferredRole = { $regex: role.trim(), $options: "i" };
        }

        // 🎓 2. Filter by College
        if (college) {
            query.college = { $regex: college.trim(), $options: "i" };
        }

        // 💻 3. Filter by Technical Skills (supports single or comma-separated)
        if (skill) {
            const skillList = skill.split(",").map(s => s.trim()).filter(Boolean);
            if (skillList.length > 0) {
                query.technicalSkills = {
                    $in: skillList.map(s => new RegExp(s, "i"))
                };
            }
        }

        // ❤️ 4. Filter by Interests (supports single or comma-separated)
        if (interest) {
            const interestList = interest.split(",").map(i => i.trim()).filter(Boolean);
            if (interestList.length > 0) {
                query.interests = {
                    $in: interestList.map(i => new RegExp(i, "i"))
                };
            }
        }

        // 🔎 5. Keyword Search across multiple fields
        if (search) {
            const searchRegex = { $regex: search.trim(), $options: "i" };
            query.$or = [
                { fullName: searchRegex },
                { bio: searchRegex },
                { college: searchRegex },
                { preferredRole: searchRegex },
                { course: searchRegex },
                { technicalSkills: searchRegex },
                { interests: searchRegex }
            ];
        }

        const teammates = await Profile.find(query)
            .populate("userId", "name email")
            .sort({ createdAt: -1 });

        res.status(200).json({
            count: teammates.length,
            teammates
        });
    } catch (error) {
        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};

module.exports = {
    getTeammates
};
