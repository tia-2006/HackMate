const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const Team = require('../models/Team');
const Request = require('../models/Request');
const Profile = require('../models/Profile');
const User = require('../models/User');

async function sync() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const acceptedRequests = await Request.find({ status: 'accepted' });
        console.log(`Found ${acceptedRequests.length} accepted requests.`);

        for (const req of acceptedRequests) {
            console.log(`\nProcessing request ID: ${req._id}`);
            let team = null;

            if (req.team) {
                team = await Team.findById(req.team);
            }

            if (!team) {
                // Find team where sender or receiver is leader
                team = await Team.findOne({ leader: req.sender }) || await Team.findOne({ members: req.sender });
                if (!team) {
                    team = await Team.findOne({ leader: req.receiver }) || await Team.findOne({ members: req.receiver });
                }
                if (team) {
                    req.team = team._id;
                    console.log(`  Assigned team "${team.name}" (${team._id}) to request.`);
                }
            }

            // Fill requestedRole if missing
            if (!req.requestedRole) {
                const receiverProfile = await Profile.findOne({ userId: req.receiver });
                if (receiverProfile && receiverProfile.preferredRole) {
                    req.requestedRole = receiverProfile.preferredRole;
                    console.log(`  Assigned requestedRole "${req.requestedRole}" to request.`);
                }
            }

            await req.save();

            // Add member to team
            if (team) {
                const senderIn = team.leader.toString() === req.sender.toString() ||
                    team.members.some(m => m.toString() === req.sender.toString());
                const receiverIn = team.leader.toString() === req.receiver.toString() ||
                    team.members.some(m => m.toString() === req.receiver.toString());

                let targetUserId = req.receiver;
                if (senderIn && !receiverIn) {
                    targetUserId = req.receiver;
                } else if (receiverIn && !senderIn) {
                    targetUserId = req.sender;
                }

                const alreadyMember = team.members.some(m => m.toString() === targetUserId.toString());
                if (!alreadyMember) {
                    team.members.push(targetUserId);
                    await team.save();
                    console.log(`  Added user ${targetUserId} to team "${team.name}" members!`);
                } else {
                    console.log(`  User ${targetUserId} is already a member of "${team.name}".`);
                }
            }
        }

        console.log('\n--- VERIFICATION ---');
        const drago = await Team.findOne({ name: 'Drago' }).populate('members', 'name email');
        if (drago) {
            console.log('Team Drago members count:', drago.members.length);
            console.log('Members:', drago.members.map(m => m.name));
        }

        console.log('\nSync finished successfully!');
        process.exit(0);
    } catch (err) {
        console.error('Sync failed:', err);
        process.exit(1);
    }
}

sync();
