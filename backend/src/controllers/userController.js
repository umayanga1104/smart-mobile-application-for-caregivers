import User from "../models/User.js";

export const loginUser = async (req, res) => {
    console.log("Login request recieved");
    try {
        const { uid, email } = req.user;

        let user = await User.findOne({ firebaseUID: uid });

        res.status(200).json(user);
        console.log("Authentication successfull");
    }catch(error) {
        res.status(500).json({message: error.message});
        console.log("Email not found!!");
    }
};

export const registerUser = async(req, res) => {
    console.log("Registration request recieved");

    try {
        const { uid, email } = req.user;
        const {username} = req.body;

        //If a user found, if statement won;t execute and return found user
        let newUser = await User.findOne({ firebaseUID: uid });

        if (!newUser) {
            newUser = await User.create({
                firebaseUID: uid,
                email,
                username,
            })   
        }

        res.status(200).json(newUser);
        console.log("Registration successfull");
    }catch(error) {
        res.status(500).json({message: error.message});
        console.log("Registration error");
    }
}