const mongoose = require("mongoose");

const profileSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true
        },

        fullName: {
            type: String,
            required: true
        },

        college: {
            type: String,
            required: true
        },

        year: {
            type: Number,
            required: true
        },

        course: {
            type: String,
            required: true
        },

        bio: {
            type: String,
            default: ""
        },

        photo: {
            type: String,
            default: ""
        },

        preferredRole: {
            type: String,
            required: true
        },

        technicalSkills: {
            type: [String],
            default: []
        },

        nonTechnicalSkills: {
            type: [String],
            default: []
        },

        hackathonsAttended: {
            type: Number,
            default: 0
        },

        availability: {
            type: String,
            required: true
        },

        interests: {
            type: [String],
            default: []
        }
    },
    {
        timestamps: true
    }
);

const Profile = mongoose.model("Profile", profileSchema);

module.exports = Profile;
