const mongoose = require("mongoose");

const matchSchema = new mongoose.Schema(
    {
        user1: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        user2: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        score: {
            type: Number,
            required: true,
            min: 0,
            max: 100
        },

        commonSkills: {
            type: [String],
            default: []
        },

        commonInterests: {
            type: [String],
            default: []
        }
    },
    {
        timestamps: true
    }
);

const Match = mongoose.model("Match", matchSchema);

module.exports = Match;
