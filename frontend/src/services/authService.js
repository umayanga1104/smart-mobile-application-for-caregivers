import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "../config/firebase";
import api from "./api";

export const registerUser = async (email, password) => {
    const userCredentials = await createUserWithEmailAndPassword(auth, email, password);
    const uid = userCredentials.user.uid;

    //save user in db
    await api.post("/users", {uid, email});

    return userCredentials.user;
}

export const loginUser = async (email, password) => {
    const userCredentials = await signInWithEmailAndPassword(auth, email, password);
    return userCredentials.user;
}

export const logoutUser = async () => signOut(auth);