const http = require("http");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const app = require("../server");
const User = require("../models/User");
const Request = require("../models/Request");

const PORT = 5099;
const BASE_URL = `http://localhost:${PORT}`;
const JWT_SECRET = process.env.JWT_SECRET || "hackmate_secret_key";

const generateToken = (id) => {
    return jwt.sign({ id }, JWT_SECRET, { expiresIn: "1h" });
};

async function runTests() {
    console.log("==========================================");
    console.log("🚀 Starting Requests & Invitations Tests...");
    console.log("==========================================");

    // Ensure database connection
    if (mongoose.connection.readyState !== 1) {
        await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/hackmate");
    }

    const server = http.createServer(app);
    await new Promise((resolve) => server.listen(PORT, resolve));
    console.log(`Test server running on port ${PORT}`);

    let userA, userB, userC;
    let tokenA, tokenB, tokenC;

    try {
        // 1. Clean up old test data
        await User.deleteMany({ email: { $in: ["test_user_a@example.com", "test_user_b@example.com", "test_user_c@example.com"] } });

        // 2. Create test users
        userA = await User.create({
            name: "Alice Test",
            email: "test_user_a@example.com",
            password: "hashedpassword123"
        });
        userB = await User.create({
            name: "Bob Test",
            email: "test_user_b@example.com",
            password: "hashedpassword123"
        });
        userC = await User.create({
            name: "Charlie Test",
            email: "test_user_c@example.com",
            password: "hashedpassword123"
        });

        tokenA = generateToken(userA._id);
        tokenB = generateToken(userB._id);
        tokenC = generateToken(userC._id);

        await Request.deleteMany({
            $or: [
                { sender: { $in: [userA._id, userB._id, userC._id] } },
                { receiver: { $in: [userA._id, userB._id, userC._id] } }
            ]
        });

        console.log("✅ Test users initialized.");

        // Helper for HTTP requests
        const api = async (method, path, body = null, token = null) => {
            const headers = { "Content-Type": "application/json" };
            if (token) headers["Authorization"] = `Bearer ${token}`;
            const res = await fetch(`${BASE_URL}${path}`, {
                method,
                headers,
                body: body ? JSON.stringify(body) : null
            });
            const data = await res.json().catch(() => ({}));
            return { status: res.status, data };
        };

        // -------------------------------------------------------------
        // Test 1: Authentication Requirement on All Endpoints
        // -------------------------------------------------------------
        console.log("\n🔒 Test 1: Authentication Checks");
        {
            const resPost = await api("POST", "/api/requests", { receiverId: userB._id.toString() });
            if (resPost.status !== 401) throw new Error(`POST /api/requests expected 401 without auth, got ${resPost.status}`);

            const resGetRecv = await api("GET", "/api/requests/received");
            if (resGetRecv.status !== 401) throw new Error(`GET /api/requests/received expected 401 without auth, got ${resGetRecv.status}`);

            const resGetSent = await api("GET", "/api/requests/sent");
            if (resGetSent.status !== 401) throw new Error(`GET /api/requests/sent expected 401 without auth, got ${resGetSent.status}`);

            const resAccept = await api("PUT", `/api/requests/${new mongoose.Types.ObjectId()}/accept`);
            if (resAccept.status !== 401) throw new Error(`PUT /api/requests/:id/accept expected 401 without auth, got ${resAccept.status}`);

            const resReject = await api("PUT", `/api/requests/${new mongoose.Types.ObjectId()}/reject`);
            if (resReject.status !== 401) throw new Error(`PUT /api/requests/:id/reject expected 401 without auth, got ${resReject.status}`);

            console.log("  ✔ All 5 endpoints properly reject unauthenticated requests with 401");
        }

        // -------------------------------------------------------------
        // Test 2: Validation on POST /api/requests
        // -------------------------------------------------------------
        console.log("\n📩 Test 2: POST /api/requests Validations");
        {
            // Missing receiverId
            const resNoReceiver = await api("POST", "/api/requests", {}, tokenA);
            if (resNoReceiver.status !== 400) throw new Error(`Expected 400 for missing receiverId, got ${resNoReceiver.status}`);
            console.log("  ✔ Missing receiverId rejected with 400");

            // Invalid format
            const resInvalidFormat = await api("POST", "/api/requests", { receiverId: "invalid-id" }, tokenA);
            if (resInvalidFormat.status !== 400) throw new Error(`Expected 400 for invalid ID format, got ${resInvalidFormat.status}`);
            console.log("  ✔ Invalid ObjectId format rejected with 400");

            // Self request
            const resSelf = await api("POST", "/api/requests", { receiverId: userA._id.toString() }, tokenA);
            if (resSelf.status !== 400) throw new Error(`Expected 400 for self-request, got ${resSelf.status}`);
            console.log("  ✔ Self-request rejected with 400");

            // Non-existent user
            const fakeId = new mongoose.Types.ObjectId().toString();
            const resNonExistent = await api("POST", "/api/requests", { receiverId: fakeId }, tokenA);
            if (resNonExistent.status !== 404) throw new Error(`Expected 404 for non-existent receiver, got ${resNonExistent.status}`);
            console.log("  ✔ Non-existent receiver rejected with 404");
        }

        // -------------------------------------------------------------
        // Test 3: Successful Send & Duplicate Prevention
        // -------------------------------------------------------------
        console.log("\n✉️ Test 3: POST /api/requests Success & Duplicate Prevention");
        let requestId1;
        {
            // User A sends request to User B
            const resSend = await api("POST", "/api/requests", { receiverId: userB._id.toString() }, tokenA);
            if (resSend.status !== 201) throw new Error(`Expected 201 for valid request, got ${resSend.status}: ${JSON.stringify(resSend.data)}`);
            if (!resSend.data.request || resSend.data.request.status !== "pending") throw new Error("Request status should be 'pending'");
            if (resSend.data.request.sender.email !== "test_user_a@example.com") throw new Error("Sender info was not populated");
            if (resSend.data.request.receiver.email !== "test_user_b@example.com") throw new Error("Receiver info was not populated");

            requestId1 = resSend.data.request._id;
            console.log(`  ✔ Request created successfully (ID: ${requestId1}) with status 'pending'`);

            // Duplicate send from User A to User B
            const resDup = await api("POST", "/api/requests", { receiverId: userB._id.toString() }, tokenA);
            if (resDup.status !== 400) throw new Error(`Expected 400 for duplicate pending request, got ${resDup.status}`);
            console.log("  ✔ Duplicate pending request from sender rejected with 400");

            // Reverse send from User B to User A while request is pending
            const resReverse = await api("POST", "/api/requests", { receiverId: userA._id.toString() }, tokenB);
            if (resReverse.status !== 400) throw new Error(`Expected 400 for reverse request when already pending, got ${resReverse.status}`);
            console.log("  ✔ Reverse request while pending rejected with 400");
        }

        // -------------------------------------------------------------
        // Test 4: GET /api/requests/received
        // -------------------------------------------------------------
        console.log("\n📥 Test 4: GET /api/requests/received");
        {
            // User B receives 1 request from User A
            const resRecvB = await api("GET", "/api/requests/received", null, tokenB);
            if (resRecvB.status !== 200) throw new Error(`Expected 200, got ${resRecvB.status}`);
            if (!Array.isArray(resRecvB.data.requests) || resRecvB.data.requests.length !== 1) {
                throw new Error(`Expected 1 received request for User B, got ${resRecvB.data.requests?.length}`);
            }
            const reqItem = resRecvB.data.requests[0];
            if (reqItem.sender.email !== "test_user_a@example.com") throw new Error("Sender name/email missing in received request");
            console.log("  ✔ User B received pending request with populated sender info");

            // User A has received 0 requests
            const resRecvA = await api("GET", "/api/requests/received", null, tokenA);
            if (resRecvA.status !== 200 || resRecvA.data.requests.length !== 0) {
                throw new Error(`Expected 0 received requests for User A, got ${resRecvA.data.requests?.length}`);
            }
            console.log("  ✔ User A has 0 received requests");
        }

        // -------------------------------------------------------------
        // Test 5: GET /api/requests/sent
        // -------------------------------------------------------------
        console.log("\n📤 Test 5: GET /api/requests/sent");
        {
            // User A has sent 1 request to User B
            const resSentA = await api("GET", "/api/requests/sent", null, tokenA);
            if (resSentA.status !== 200) throw new Error(`Expected 200, got ${resSentA.status}`);
            if (!Array.isArray(resSentA.data.requests) || resSentA.data.requests.length !== 1) {
                throw new Error(`Expected 1 sent request for User A, got ${resSentA.data.requests?.length}`);
            }
            const reqItem = resSentA.data.requests[0];
            if (reqItem.receiver.email !== "test_user_b@example.com") throw new Error("Receiver name/email missing in sent request");
            console.log("  ✔ User A sent pending request with populated receiver info");

            // User B has sent 0 requests
            const resSentB = await api("GET", "/api/requests/sent", null, tokenB);
            if (resSentB.status !== 200 || resSentB.data.requests.length !== 0) {
                throw new Error(`Expected 0 sent requests for User B, got ${resSentB.data.requests?.length}`);
            }
            console.log("  ✔ User B has 0 sent requests");
        }

        // -------------------------------------------------------------
        // Test 6: PUT /api/requests/:id/accept
        // -------------------------------------------------------------
        console.log("\n🤝 Test 6: PUT /api/requests/:id/accept");
        {
            // Sender (User A) cannot accept their own request
            const resAcceptSelf = await api("PUT", `/api/requests/${requestId1}/accept`, null, tokenA);
            if (resAcceptSelf.status !== 403) throw new Error(`Expected 403 for sender accepting own request, got ${resAcceptSelf.status}`);
            console.log("  ✔ Sender cannot accept their own request (403)");

            // Third party (User C) cannot accept
            const resAcceptThird = await api("PUT", `/api/requests/${requestId1}/accept`, null, tokenC);
            if (resAcceptThird.status !== 403) throw new Error(`Expected 403 for unauthorized user accepting, got ${resAcceptThird.status}`);
            console.log("  ✔ Non-receiver cannot accept request (403)");

            // Receiver (User B) accepts request
            const resAcceptB = await api("PUT", `/api/requests/${requestId1}/accept`, null, tokenB);
            if (resAcceptB.status !== 200) throw new Error(`Expected 200, got ${resAcceptB.status}: ${JSON.stringify(resAcceptB.data)}`);
            if (resAcceptB.data.request.status !== "accepted") throw new Error("Status should be 'accepted'");
            console.log("  ✔ Receiver accepted request successfully (status: 'accepted')");

            // Cannot accept already accepted request
            const resAcceptAgain = await api("PUT", `/api/requests/${requestId1}/accept`, null, tokenB);
            if (resAcceptAgain.status !== 400) throw new Error(`Expected 400 for accepting already accepted request, got ${resAcceptAgain.status}`);
            console.log("  ✔ Re-accepting already accepted request rejected with 400");

            // Cannot reject already accepted request
            const resRejectAccepted = await api("PUT", `/api/requests/${requestId1}/reject`, null, tokenB);
            if (resRejectAccepted.status !== 400) throw new Error(`Expected 400 for rejecting already accepted request, got ${resRejectAccepted.status}`);
            console.log("  ✔ Rejecting already accepted request rejected with 400");
        }

        // -------------------------------------------------------------
        // Test 7: PUT /api/requests/:id/reject
        // -------------------------------------------------------------
        console.log("\n❌ Test 7: PUT /api/requests/:id/reject");
        {
            // Create second request from User A to User B
            const resSend2 = await api("POST", "/api/requests", { receiverId: userB._id.toString() }, tokenA);
            if (resSend2.status !== 201) throw new Error(`Expected 201 for second request, got ${resSend2.status}`);
            const requestId2 = resSend2.data.request._id;

            // Sender (User A) cannot reject their own request
            const resRejectSelf = await api("PUT", `/api/requests/${requestId2}/reject`, null, tokenA);
            if (resRejectSelf.status !== 403) throw new Error(`Expected 403 for sender rejecting own request, got ${resRejectSelf.status}`);
            console.log("  ✔ Sender cannot reject their own request (403)");

            // Third party (User C) cannot reject
            const resRejectThird = await api("PUT", `/api/requests/${requestId2}/reject`, null, tokenC);
            if (resRejectThird.status !== 403) throw new Error(`Expected 403 for unauthorized user rejecting, got ${resRejectThird.status}`);
            console.log("  ✔ Non-receiver cannot reject request (403)");

            // Receiver (User B) rejects request
            const resRejectB = await api("PUT", `/api/requests/${requestId2}/reject`, null, tokenB);
            if (resRejectB.status !== 200) throw new Error(`Expected 200, got ${resRejectB.status}: ${JSON.stringify(resRejectB.data)}`);
            if (resRejectB.data.request.status !== "rejected") throw new Error("Status should be 'rejected'");
            console.log("  ✔ Receiver rejected request successfully (status: 'rejected')");

            // Cannot reject already rejected request
            const resRejectAgain = await api("PUT", `/api/requests/${requestId2}/reject`, null, tokenB);
            if (resRejectAgain.status !== 400) throw new Error(`Expected 400 for rejecting already rejected request, got ${resRejectAgain.status}`);
            console.log("  ✔ Re-rejecting already rejected request rejected with 400");

            // Cannot accept already rejected request
            const resAcceptRejected = await api("PUT", `/api/requests/${requestId2}/accept`, null, tokenB);
            if (resAcceptRejected.status !== 400) throw new Error(`Expected 400 for accepting already rejected request, got ${resAcceptRejected.status}`);
            console.log("  ✔ Accepting already rejected request rejected with 400");
        }

        console.log("\n==========================================");
        console.log("🎉 ALL TESTS PASSED SUCCESSFULLY! 🎉");
        console.log("==========================================");

    } finally {
        // Cleanup test data
        if (userA || userB || userC) {
            await Request.deleteMany({
                $or: [
                    { sender: { $in: [userA?._id, userB?._id, userC?._id].filter(Boolean) } },
                    { receiver: { $in: [userA?._id, userB?._id, userC?._id].filter(Boolean) } }
                ]
            });
            await User.deleteMany({ email: { $in: ["test_user_a@example.com", "test_user_b@example.com", "test_user_c@example.com"] } });
            console.log("🧹 Test cleanup completed.");
        }
        await new Promise((resolve) => server.close(resolve));
        await mongoose.disconnect();
    }
}

runTests().catch((err) => {
    console.error("\n❌ TEST FAILED:", err.message);
    process.exit(1);
});
