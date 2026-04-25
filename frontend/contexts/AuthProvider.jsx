import {
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    signInWithEmailAndPassword
} from "firebase/auth";

import { api } from "../config/axios";
import { cancelAllScheduledNotifications } from "../utils/notificationListener";

import { createContext, useContext, useEffect, useState } from "react";
import { auth } from "../config/firebase";

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used inside AuthProvider");
    return context;
};

export default function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);

    useEffect(() => {
        const verify = async () => {
            try {
                const response = await api.get("/user/verify");
                if (response.status === 404 || response.status === 500) return null;
                return response.data;
            } catch (err) {
                return null;
            }
        };

        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (!firebaseUser) {
                setUser(null);
                setAuthLoading(false);
                return;
            }

            try {
                setUser({ firebaseUser });
                const backendUser = await verify();
                if (backendUser) {
                    setUser(prev => ({ ...prev, ...backendUser }));
                }
            } catch (err) {
                console.error("Critical auth error:", err.message);
                setUser(null);
            } finally {
                setAuthLoading(false);
            }
        });

        return unsubscribe;
    }, []);

    const login = async (email, password) => {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            setUser({ firebaseUser: userCredential.user });
        } catch (error) {
            throw error;
        }
    };

    const register = async (username, email, password) => {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            await api.post("/user/register", { username });
            setUser({ firebaseUser: userCredential.user });
        } catch (error) {
            throw error;
        }
    };

    const signOut = async () => {
        try {
            await cancelAllScheduledNotifications();
            await firebaseSignOut(auth);
            setUser(null);
        } catch (error) {
            console.error("Logout error:", error.message);
        }
    };

    const updateUser = (updates) => {
        setUser(prev => prev ? { ...prev, ...updates } : null);
    };

    return (
        <AuthContext.Provider value={{ user, authLoading, login, register, signOut, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
}
