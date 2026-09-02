const mongoose = require("mongoose");

const teamSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true
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
        }
    },
    {
        timestamps: true
    }
);

const Team = mongoose.model("Team", teamSchema);

module.exports = Team;
