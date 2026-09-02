const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")
    ) {
        try {
            // Get token from header (Format: "Bearer <token>")
            token = req.headers.authorization.split(" ")[1];

            // Verify token
            const decoded = jwt.verify(
                token,
                process.env.JWT_SECRET || "hackmate_secret_key"
            );

            // Get user from token payload (exclude password)
            req.user = await User.findById(decoded.id).select("-password");

            if (!req.user) {
                return res.status(401).json({
                    message: "User not found, authorization denied"
                });
            }

            next();
        } catch (error) {
            return res.status(401).json({
                message: "Not authorized, token invalid or expired"
            });
        }
    }

    if (!token) {
        return res.status(401).json({
            message: "Not authorized, no token provided"
        });
    }
};

module.exports = { protect };
