const Profile = require("../models/Profile");

// ==========================================
// @desc    Create user profile
// @route   POST /api/profile
// @access  Private (Protected by JWT)
// ==========================================
const createProfile = async (req, res) => {
    try {
        const {
            fullName,
            college,
            year,
            course,
            bio,
            photo,
            preferredRole,
            technicalSkills,
            nonTechnicalSkills,
            hackathonsAttended,
            availability,
            interests
        } = req.body;

        // Check required fields based on Profile Model
        if (!fullName || !college || !year || !course || !preferredRole || !availability) {
            return res.status(400).json({
                message: "Please provide all required fields: fullName, college, year, course, preferredRole, availability"
            });
        }

        // Check if profile already exists for this user
        const existingProfile = await Profile.findOne({ userId: req.user._id });
        if (existingProfile) {
            return res.status(400).json({
                message: "Profile already exists for this user. Use PUT /api/profile to update."
            });
        }

        // Create new profile
        const profile = await Profile.create({
            userId: req.user._id,
            fullName,
            college,
            year,
            course,
            bio: bio || "",
            photo: photo || "",
            preferredRole,
            technicalSkills: technicalSkills || [],
            nonTechnicalSkills: nonTechnicalSkills || [],
            hackathonsAttended: hackathonsAttended || 0,
            availability,
            interests: interests || []
        });

        res.status(201).json({
            message: "Profile created successfully",
            profile
        });
    } catch (error) {
        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};

// ==========================================
// @desc    Get logged-in user's profile
// @route   GET /api/profile/me
// @access  Private
// ==========================================
const getMyProfile = async (req, res) => {
    try {
        const profile = await Profile.findOne({ userId: req.user._id }).populate(
            "userId",
            "name email"
        );

        if (!profile) {
            return res.status(404).json({
                message: "Profile not found for this user"
            });
        }

        res.status(200).json({
            message: "Profile fetched successfully",
            profile
        });
    } catch (error) {
        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};

// ==========================================
// @desc    Update logged-in user's profile
// @route   PUT /api/profile/me (or PUT /api/profile)
// @access  Private
// ==========================================
const updateProfile = async (req, res) => {
    try {
        const updateData = req.body;

        // Prevent updating userId
        delete updateData.userId;

        const updatedProfile = await Profile.findOneAndUpdate(
            { userId: req.user._id },
            { $set: updateData },
            { new: true, runValidators: true }
        ).populate("userId", "name email");

        if (!updatedProfile) {
            return res.status(404).json({
                message: "Profile not found to update"
            });
        }

        res.status(200).json({
            message: "Profile updated successfully",
            profile: updatedProfile
        });
    } catch (error) {
        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};

// ==========================================
// @desc    Get profile by User ID (view others)
// @route   GET /api/profile/user/:userId
// @access  Private
// ==========================================
const getProfileByUserId = async (req, res) => {
    try {
        const profile = await Profile.findOne({ userId: req.params.userId }).populate(
            "userId",
            "name email"
        );

        if (!profile) {
            return res.status(404).json({
                message: "Profile not found"
            });
        }

        res.status(200).json({
            profile
        });
    } catch (error) {
        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};

// ==========================================
// @desc    Get all profiles (Explore teammates)
// @route   GET /api/profile
// @access  Private
// ==========================================
const getAllProfiles = async (req, res) => {
    try {
        const profiles = await Profile.find().populate("userId", "name email");

        res.status(200).json({
            count: profiles.length,
            profiles
        });
    } catch (error) {
        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};

module.exports = {
    createProfile,
    getMyProfile,
    updateProfile,
    getProfileByUserId,
    getAllProfiles
};
