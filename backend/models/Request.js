const mongoose = require("mongoose");

const requestSchema = new mongoose.Schema(
    {
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            alias: "senderId"
        },

        receiver: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            alias: "receiverId"
        },

        team: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Team",
            required: false
        },

        requestedRole: {
            type: String,
            required: false
        },

        status: {
            type: String,
            enum: ["pending", "accepted", "rejected"],
            default: "pending"
        }
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

const Request = mongoose.model("Request", requestSchema);

module.exports = Request;

