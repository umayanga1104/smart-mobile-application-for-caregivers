import { User } from "../models/User.js";

const userService = {
    verify: async(req, res) => {
        console.log("Verify request came");

        try {
            const uid = req.firebaseUser.uid;

            const user = await User.findOne({firebaseUID: uid});

            if(!user) {
                return res.status(404).json({
                    message: "User does not exisit"
                });
            }

            res.status(200).json({
                uid:uid,
                username: user.username,
                email: user.email,
                profilePicture: user.profilePicture || null,
            });
            
        }catch(error) {
            console.log(error);
            res.status(500).json({error: "Server error"});
        }
    },

    register: async(req, res) => {
        console.log("Register request came");
        try {
            const uid = req.firebaseUser.uid;
            const email = req.firebaseUser.email;
            const { username } = req.body;
    
            const user = await User.findOne({firebaseUID: uid});
    
            if(user) {
                return res.status(400).json({
                    message: "User already existing"
                });
            }
    
            const newUser = new User({
                firebaseUID: uid,
                email: email,
                username: username
            });
    
            await newUser.save();
    
            res.status(200).json({
                uid: uid,
                username: username,
                email: email,
                profilePicture: null,
            });
        } catch (error) {
            console.log(error);
            res.status(500).json({ error: "Server error" });
        }
    },

    updateProfilePicture: async (req, res) => {
        try {
            const uid = req.firebaseUser.uid;
            const { profilePicture } = req.body;

            if (!profilePicture || typeof profilePicture !== 'string') {
                return res.status(400).json({ error: 'Valid profile picture data is required' });
            }

            if (profilePicture.length > 2 * 1024 * 1024) {
                return res.status(400).json({ error: 'Image too large. Maximum size is 2MB.' });
            }

            const user = await User.findOneAndUpdate(
                { firebaseUID: uid },
                { profilePicture },
                { new: true }
            );

            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            res.status(200).json({
                message: 'Profile picture updated',
                profilePicture: user.profilePicture,
            });
        } catch (error) {
            console.error('Update profile picture error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    },

    removeProfilePicture: async (req, res) => {
        try {
            const uid = req.firebaseUser.uid;

            const user = await User.findOneAndUpdate(
                { firebaseUID: uid },
                { profilePicture: null },
                { new: true }
            );

            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            res.status(200).json({ message: 'Profile picture removed' });
        } catch (error) {
            console.error('Remove profile picture error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    },
}

export default userService;