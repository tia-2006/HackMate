const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { validateEmail } = require("../utils/emailValidator");

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || "hackmate_secret_key", {
        expiresIn: "30d"
    });
};

const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                message: "Please provide name, email and password"
            });
        }

        // Validate email requirements according to strict email specification checklist
        const emailError = validateEmail(email);
        if (emailError) {
            return res.status(400).json({
                message: emailError
            });
        }

        // Validate password requirements
        if (typeof password !== "string" || password.length < 6) {
            return res.status(400).json({
                message: "Password must be at least 6 characters long"
            });
        }

        if (!/[A-Z]/.test(password)) {
            return res.status(400).json({
                message: "Password must contain at least one uppercase letter"
            });
        }

        if (!/[^A-Za-z0-9\s]/.test(password)) {
            return res.status(400).json({
                message: "Password must contain at least one special character"
            });
        }

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(400).json({
                message: "User with this email already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name,
            email,
            password: hashedPassword
        });

        const token = generateToken(user._id);

        res.status(201).json({
            message: "User registered successfully",
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            },
            token
        });

    } catch (error) {
        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Please provide email and password"
            });
        }

        const emailError = validateEmail(email);
        if (emailError) {
            return res.status(400).json({
                message: emailError
            });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const token = generateToken(user._id);

        res.status(200).json({
            message: "Login successful",
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            },
            token
        });

    } catch (error) {
        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};

const getMe = async (req, res) => {
    try {
        // req.user is populated by protect middleware
        res.status(200).json({
            user: req.user
        });
    } catch (error) {
        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};

module.exports = {
    registerUser,
    loginUser,
    getMe
};
