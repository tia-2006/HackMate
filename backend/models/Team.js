const mongoose = require("mongoose");

const teamSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true
        },

        description: {
            type: String,
            default: ""
        },

        hackathon: {
            type: String,
            required: true
        },

        leader: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        members: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            }
        ],

        requiredRoles: {
            type: [String],
            default: []
        },

        requiredSkills: {
            type: [String],
            default: []
        },

        maxMembers: {
            type: Number,
            default: 4
        }
    },
    {
        timestamps: true
    }
);

const Team = mongoose.model("Team", teamSchema);

module.exports = Team;
