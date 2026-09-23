const http = require("http");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "../.env") });

const app = require("../server");
const User = require("../models/User");
const Profile = require("../models/Profile");
const Team = require("../models/Team");
const Request = require("../models/Request");

const PORT = 5098;
const BASE_URL = `http://localhost:${PORT}`;

function api(method, endpoint, body = null, token = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(endpoint, BASE_URL);
        const headers = { "Content-Type": "application/json" };
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const req = http.request(url, { method, headers }, (res) => {
            let data = "";
            res.on("data", (chunk) => (data += chunk));
            res.on("end", () => {
                let parsed;
                try {
                    parsed = JSON.parse(data);
                } catch {
                    parsed = data;
                }
                resolve({ status: res.statusCode, data: parsed });
            });
        });

        req.on("error", reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function runTest() {
    let server;
    try {
        console.log("==========================================");
        console.log("🚀 Testing Team Member Acceptance Flow...");
        console.log("==========================================");

        await new Promise((resolve) => {
            server = app.listen(PORT, () => {
                console.log(`Test server running on port ${PORT}`);
                resolve();
            });
        });

        await mongoose.connect(process.env.MONGO_URI);

        // Clean up test fixtures
        await User.deleteMany({ email: { $in: ["leader_test@hm.io", "member_test@hm.io"] } });
        await Team.deleteMany({ name: "Alpha Squad Test" });

        // 1. Create Leader
        const resRegLeader = await api("POST", "/api/users/register", {
            name: "Leader Alpha",
            email: "leader_test@hm.io",
            password: "Password123!"
        });
        if (resRegLeader.status !== 201) throw new Error(`Leader reg failed: ${JSON.stringify(resRegLeader.data)}`);
        const tokenLeader = resRegLeader.data.token;
        const leaderId = resRegLeader.data.user.id;

        // 2. Create Candidate Member
        const resRegMember = await api("POST", "/api/users/register", {
            name: "Candidate Beta",
            email: "member_test@hm.io",
            password: "Password123!"
        });
        if (resRegMember.status !== 201) throw new Error(`Member reg failed: ${JSON.stringify(resRegMember.data)}`);
        const tokenMember = resRegMember.data.token;
        const memberId = resRegMember.data.user.id;

        // Create Member's Profile
        const resProf = await api("POST", "/api/profile", {
            fullName: "Candidate Beta",
            college: "Test University",
            year: 3,
            course: "Computer Science",
            preferredRole: "Frontend Dev",
            availability: "full-time",
            technicalSkills: ["React", "CSS"]
        }, tokenMember);
        if (resProf.status !== 201 && resProf.status !== 200) {
            throw new Error(`Profile creation failed: ${JSON.stringify(resProf.data)}`);
        }

        console.log("  ✔ Test users and profile created");

        // 3. Leader creates Team
        const resCreateTeam = await api("POST", "/api/teams", {
            name: "Alpha Squad Test",
            hackathon: "Testathon 2026",
            requiredRoles: ["Frontend Dev"],
            maxMembers: 3
        }, tokenLeader);
        if (resCreateTeam.status !== 201) throw new Error(`Create team failed: ${JSON.stringify(resCreateTeam.data)}`);
        const teamId = resCreateTeam.data.team._id;
        console.log("  ✔ Team created by Leader");

        // 4. Leader sends request to Candidate Beta (without explicitly passing teamId or role)
        const resSendReq = await api("POST", "/api/requests", {
            receiverId: memberId
        }, tokenLeader);
        if (resSendReq.status !== 201) throw new Error(`Send request failed: ${JSON.stringify(resSendReq.data)}`);
        const reqDoc = resSendReq.data.request;
        if (!reqDoc.team) throw new Error("Expected team to be auto-attached to request");
        if (reqDoc.requestedRole !== "Frontend Dev") throw new Error(`Expected role 'Frontend Dev', got: ${reqDoc.requestedRole}`);
        console.log("  ✔ Request automatically attached team & preferredRole");

        // 5. Candidate Beta accepts the request
        const resAccept = await api("PUT", `/api/requests/${reqDoc._id}/accept`, null, tokenMember);
        if (resAccept.status !== 200) throw new Error(`Accept failed: ${JSON.stringify(resAccept.data)}`);
        console.log("  ✔ Candidate accepted the request");

        // 6. Verify Team has 2 members
        const resGetMyTeams = await api("GET", "/api/teams/my-teams", null, tokenLeader);
        if (resGetMyTeams.status !== 200) throw new Error(`getMyTeams failed: ${JSON.stringify(resGetMyTeams.data)}`);
        const currentTeam = resGetMyTeams.data.teams.find(t => t._id === teamId);
        if (!currentTeam) throw new Error("Team not found in getMyTeams");
        if (currentTeam.members.length !== 2) throw new Error(`Expected 2 members in team, got: ${currentTeam.members.length}`);

        const memberNames = currentTeam.members.map(m => m.name || m.profile?.fullName);
        console.log("  ✔ Team members successfully updated:", memberNames);
        if (!memberNames.includes("Candidate Beta")) throw new Error("Candidate Beta not in team members!");

        // 7. Verify Candidate Beta also sees the team in getMyTeams
        const resGetMemberTeams = await api("GET", "/api/teams/my-teams", null, tokenMember);
        if (!resGetMemberTeams.data.teams.some(t => t._id === teamId)) {
            throw new Error("Candidate Beta should have Alpha Squad in their teams!");
        }
        console.log("  ✔ New member also has team listed in their dashboard");

        console.log("==========================================");
        console.log("🎉 ALL TEAM ACCEPTANCE TESTS PASSED! 🎉");
        console.log("==========================================");

        // Cleanup
        await User.deleteMany({ email: { $in: ["leader_test@hm.io", "member_test@hm.io"] } });
        await Profile.deleteMany({ userId: { $in: [leaderId, memberId] } });
        await Team.deleteMany({ name: "Alpha Squad Test" });
        await Request.deleteMany({ sender: leaderId });

        server.close();
        process.exit(0);
    } catch (err) {
        console.error("Test failed:", err);
        if (server) server.close();
        process.exit(1);
    }
}

runTest();
