const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");
const userRoutes = require("./routes/userRoutes");
const profileRoutes = require("./routes/profileRoutes");
const teammateRoutes = require("./routes/teammateRoutes");
const teamRoutes = require("./routes/teamRoutes");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
connectDB();

// API Routes
app.use("/api/users", userRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/teammates", teammateRoutes);
app.use("/api/teams", teamRoutes);

// Test Route
app.get("/", (req, res) => {
    res.json({
        message: "HackMate Backend is running!"
    });
});

// Error Handling Middleware (must be after all routes)
app.use(notFound);
app.use(errorHandler);

// Port
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});