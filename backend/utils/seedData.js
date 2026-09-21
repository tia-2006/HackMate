const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config({ path: "../.env" });

const User = require("../models/User");
const Profile = require("../models/Profile");
const Team = require("../models/Team");
const Request = require("../models/Request");
const Match = require("../models/Match");

async function seedData() {
    try {
        const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/hackmate";
        await mongoose.connect(mongoUri);
        console.log("Connected to MongoDB for seeding...");

        // Clear existing collection data
        await User.deleteMany({});
        await Profile.deleteMany({});
        await Team.deleteMany({});
        await Request.deleteMany({});
        await Match.deleteMany({});

        console.log("Existing data cleared.");

        const hashedPassword = await bcrypt.hash("password123", 10);

        // 1. Create Users
        const userAlex = await User.create({
            name: "Alex Chen",
            email: "alex@hackmate.io",
            password: hashedPassword
        });

        const userSarah = await User.create({
            name: "Sarah Jenkins",
            email: "sarah@hackmate.io",
            password: hashedPassword
        });

        const userDavid = await User.create({
            name: "David Kim",
            email: "david@hackmate.io",
            password: hashedPassword
        });

        const userMaya = await User.create({
            name: "Maya Patel",
            email: "maya@hackmate.io",
            password: hashedPassword
        });

        console.log("Users created.");

        // 2. Create Profiles
        const profileAlex = await Profile.create({
            userId: userAlex._id,
            fullName: "Alex Chen",
            college: "Stanford University",
            year: 3,
            course: "Computer Science",
            preferredRole: "Full Stack Developer",
            technicalSkills: ["React", "Node.js", "TypeScript", "UI/UX", "GraphQL"],
            interests: ["Web Dev", "AI/ML", "Open Source"],
            bio: "Building next-gen tools for hackathons.",
            hackathonsAttended: 5,
            availability: "Full-Time",
            photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
        });

        const profileSarah = await Profile.create({
            userId: userSarah._id,
            fullName: "Sarah Jenkins",
            college: "MIT",
            year: 4,
            course: "Design & Interaction",
            preferredRole: "UX Designer",
            technicalSkills: ["Figma", "User Research", "Prototyping", "CSS/Sass", "Design Systems"],
            interests: ["UI/UX Design", "Accessibility", "Product Design"],
            bio: "Crafting modern user experiences.",
            hackathonsAttended: 4,
            availability: "Flexible",
            photo: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80"
        });

        const profileDavid = await Profile.create({
            userId: userDavid._id,
            fullName: "David Kim",
            college: "Carnegie Mellon",
            year: 3,
            course: "Software Engineering",
            preferredRole: "Backend Developer",
            technicalSkills: ["Python", "FastAPI", "PostgreSQL", "Docker", "AWS"],
            interests: ["Distributed Systems", "Cloud Computing"],
            bio: "High performance APIs & databases.",
            hackathonsAttended: 6,
            availability: "Part-Time",
            photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80"
        });

        const profileMaya = await Profile.create({
            userId: userMaya._id,
            fullName: "Maya Patel",
            college: "UC Berkeley",
            year: 2,
            course: "Data Science",
            preferredRole: "ML/AI Specialist",
            technicalSkills: ["Python", "PyTorch", "TensorFlow", "Pandas", "Scikit-Learn"],
            interests: ["Computer Vision", "NLP"],
            bio: "Machine learning research enthusiast.",
            hackathonsAttended: 3,
            availability: "Weekends",
            photo: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80"
        });

        console.log("Profiles created.");

        // 3. Create Teams
        const team1 = await Team.create({
            name: "Data Wizards",
            description: "Building an AI-driven predictive analytics dashboard.",
            hackathon: "Smart India Hackathon 2024",
            leader: userAlex._id,
            members: [userAlex._id, userMaya._id],
            requiredRoles: ["Frontend Dev", "DevOps"],
            requiredSkills: ["React", "TypeScript", "Docker"],
            maxMembers: 4
        });

        const team2 = await Team.create({
            name: "Hack & Slash",
            description: "Gamified learning platform for computer science students.",
            hackathon: "Global AI Hackathon 2024",
            leader: userSarah._id,
            members: [userSarah._id, userDavid._id],
            requiredRoles: ["UX Designer", "Full Stack"],
            requiredSkills: ["Figma", "Node.js"],
            maxMembers: 4
        });

        console.log("Teams created.");

        // 4. Create Requests
        // Request 1: Alex Chen -> David Kim (Inviting to Data Wizards for Frontend Dev)
        await Request.create({
            sender: userAlex._id,
            receiver: userDavid._id,
            team: team1._id,
            requestedRole: "Frontend Dev",
            status: "pending"
        });

        // Request 2: Sarah Jenkins -> David Kim (Inviting to Hack & Slash for UX Designer)
        await Request.create({
            sender: userSarah._id,
            receiver: userDavid._id,
            team: team2._id,
            requestedRole: "UX Designer",
            status: "pending"
        });

        // Request 3: Sent request from David Kim to Alex Chen
        await Request.create({
            sender: userDavid._id,
            receiver: userAlex._id,
            team: team1._id,
            requestedRole: "Backend Dev",
            status: "pending"
        });

        console.log("Requests created successfully!");
        console.log("Accounts created:");
        console.log("- Alex Chen (alex@hackmate.io / password123)");
        console.log("- Sarah Jenkins (sarah@hackmate.io / password123)");
        console.log("- David Kim (david@hackmate.io / password123)");
        process.exit(0);
    } catch (err) {
        console.error("Seeding error:", err);
        process.exit(1);
    }
}

seedData();
