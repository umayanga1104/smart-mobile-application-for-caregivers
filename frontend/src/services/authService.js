import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "../config/firebase";
import api from "./api";

export const registerUser = async (username, email, password) => {
    const userCredentials = await createUserWithEmailAndPassword(auth, email, password);

    await api.post("/user/register", {
        username: username
    });

    return userCredentials.user;
}

export const loginUser = async (email, password) => {
    const userCredentials = await signInWithEmailAndPassword(auth, email, password);

    await api.post("/user/login");

    return userCredentials.user;
}

export const logoutUser = async () => signOut(auth);