const mongoose = require("mongoose");
const Match = require("../models/Match");
const Profile = require("../models/Profile");
const Team = require("../models/Team");
const User = require("../models/User");

// ==========================================
// Helper: Calculate user-to-user match metrics
// Exact formula from frontend/src/pages/FindTeammatesPage.jsx
// ==========================================
const calculateUserMatchMetrics = (myProfile, candidateProfile) => {
    const mySkills = new Set((myProfile.technicalSkills || []).map(s => s.toLowerCase().trim()));
    const myInterests = new Set((myProfile.interests || []).map(i => i.toLowerCase().trim()));

    const candidateSkills = candidateProfile.technicalSkills || [];
    const candidateInterests = candidateProfile.interests || [];
    const theirSkillsLower = candidateSkills.map(s => s.toLowerCase().trim());
    const theirInterestsLower = candidateInterests.map(i => i.toLowerCase().trim());

    let overlap = 0;
    let total = 0;

    theirSkillsLower.forEach(s => {
        total++;
        if (mySkills.has(s)) overlap++;
    });

    theirInterestsLower.forEach(i => {
        total++;
        if (myInterests.has(i)) overlap++;
    });

    const base = total > 0 ? Math.round((overlap / total) * 70) : 50;
    const hackathonBonus = Math.min((candidateProfile.hackathonsAttended || 0) * 3, 15);
    const score = Math.min(base + hackathonBonus + 20, 99);

    const commonSkills = candidateSkills.filter(s => mySkills.has(s.toLowerCase().trim()));
    const commonInterests = candidateInterests.filter(i => myInterests.has(i.toLowerCase().trim()));

    return {
        score,
        commonSkills,
        commonInterests
    };
};

// ==========================================
// @desc    Get recommended teammate matches for logged-in user
// @route   GET /api/matches
// @access  Private (Protected by JWT)
// ==========================================
const getMatches = async (req, res) => {
    try {
        const myProfile = await Profile.findOne({ userId: req.user._id });

        if (!myProfile) {
            return res.status(404).json({
                message: "Profile not found for current user. Please create a profile first."
            });
        }

        // Fetch all other profiles excluding the logged-in user
        const otherProfiles = await Profile.find({ userId: { $ne: req.user._id } })
            .populate("userId", "name email");

        const matches = otherProfiles.map(candidate => {
            const { score, commonSkills, commonInterests } = calculateUserMatchMetrics(
                myProfile,
                candidate
            );
            const candObj = candidate.toObject();

            return {
                ...candObj,
                score,
                commonSkills,
                commonInterests
            };
        });

        // Sort matches by score descending
        matches.sort((a, b) => b.score - a.score);

        res.status(200).json({
            count: matches.length,
            matches
        });
    } catch (error) {
        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};

// ==========================================
// @desc    Get team matches for logged-in user
// @route   GET /api/matches/teams
// @access  Private (Protected by JWT)
// ==========================================
const getTeamMatches = async (req, res) => {
    try {
        const myProfile = await Profile.findOne({ userId: req.user._id });

        if (!myProfile) {
            return res.status(404).json({
                message: "Profile not found for current user. Please create a profile first."
            });
        }

        const { hackathon } = req.query;
        const query = {};

        if (hackathon) {
            query.hackathon = { $regex: hackathon.trim(), $options: "i" };
        }

        const allTeams = await Team.find(query)
            .populate("leader", "name email")
            .populate("members", "name email");

        const userSkills = new Set((myProfile.technicalSkills || []).map(s => s.toLowerCase().trim()));
        const userRole = (myProfile.preferredRole || "").toLowerCase().trim();

        const eligibleTeams = [];

        for (const team of allTeams) {
            // Exclude teams where user is the leader
            if (team.leader && team.leader._id.toString() === req.user._id.toString()) {
                continue;
            }

            // Exclude teams where user is already a member
            const isMember = (team.members || []).some(
                m => (m._id ? m._id.toString() : m.toString()) === req.user._id.toString()
            );
            if (isMember) {
                continue;
            }

            // Exclude full teams
            const currentMembersCount = team.members ? team.members.length : 0;
            const maxMembers = team.maxMembers || 4;
            if (currentMembersCount >= maxMembers) {
                continue;
            }

            // 1. Role match = 30 points
            const requiredRoles = team.requiredRoles || [];
            const matchedRoles = requiredRoles.filter(r => r.toLowerCase().trim() === userRole);
            const roleScore = matchedRoles.length > 0 ? 30 : 0;

            // 2. Skill coverage = up to 55 points
            const requiredSkills = team.requiredSkills || [];
            const matchedSkills = requiredSkills.filter(s => userSkills.has(s.toLowerCase().trim()));
            const skillScore = requiredSkills.length > 0
                ? Math.round((matchedSkills.length / requiredSkills.length) * 55)
                : 0;

            // 3. Hackathon experience = up to 15 points
            const hackathonScore = Math.min((myProfile.hackathonsAttended || 0) * 3, 15);

            // Total capped at 100
            const totalScore = Math.min(roleScore + skillScore + hackathonScore, 100);

            const openSlots = Math.max(maxMembers - currentMembersCount, 0);

            const teamObj = team.toObject();
            teamObj.score = totalScore;
            teamObj.matchedSkills = matchedSkills;
            teamObj.matchedRoles = matchedRoles;
            teamObj.openSlots = openSlots;

            eligibleTeams.push(teamObj);
        }

        // Sort by score descending
        eligibleTeams.sort((a, b) => b.score - a.score);

        res.status(200).json({
            count: eligibleTeams.length,
            teams: eligibleTeams
        });
    } catch (error) {
        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};

// ==========================================
// @desc    Save a calculated match between two users
// @route   POST /api/matches/save
// @access  Private (Protected by JWT)
// ==========================================
const saveMatch = async (req, res) => {
    try {
        const targetUserId = req.body.targetUserId || req.body.user2;

        // 1. Validate targetUserId presence
        if (!targetUserId) {
            return res.status(400).json({
                message: "Please provide targetUserId"
            });
        }

        // 2. Validate targetUserId format
        if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
            return res.status(400).json({
                message: "Invalid targetUserId format"
            });
        }

        // 3. Prevent saving a match with oneself
        if (req.user._id.toString() === targetUserId.toString()) {
            return res.status(400).json({
                message: "You cannot save a match with yourself"
            });
        }

        // 4. Verify target user exists
        const targetUser = await User.findById(targetUserId);
        if (!targetUser) {
            return res.status(404).json({
                message: "Target user not found"
            });
        }

        // 5. Verify target user's profile exists
        const targetProfile = await Profile.findOne({ userId: targetUserId });
        if (!targetProfile) {
            return res.status(404).json({
                message: "Target user profile not found"
            });
        }

        // 6. Verify authenticated user's profile exists
        const myProfile = await Profile.findOne({ userId: req.user._id });
        if (!myProfile) {
            return res.status(404).json({
                message: "Profile not found for current user. Please create a profile first."
            });
        }

        // 7. Prevent duplicate match records between the same two users
        const existingMatch = await Match.findOne({
            $or: [
                { user1: req.user._id, user2: targetUserId },
                { user1: targetUserId, user2: req.user._id }
            ]
        });

        if (existingMatch) {
            return res.status(400).json({
                message: "Match record already exists between these users",
                match: existingMatch
            });
        }

        // 8. Calculate score/commonSkills/commonInterests server-side using the exact matching logic
        const { score, commonSkills, commonInterests } = calculateUserMatchMetrics(
            myProfile,
            targetProfile
        );

        // 9. Create match using existing Match model
        const match = await Match.create({
            user1: req.user._id,
            user2: targetUserId,
            score,
            commonSkills,
            commonInterests
        });

        await match.populate([
            { path: "user1", select: "name email" },
            { path: "user2", select: "name email" }
        ]);

        res.status(201).json({
            message: "Match saved successfully",
            match
        });
    } catch (error) {
        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};

module.exports = {
    getMatches,
    getTeamMatches,
    saveMatch
};
