import { onAuthStateChanged } from "firebase/auth";
import { createContext, useEffect, useMemo, useState } from "react";
import { auth } from "../config/firebase";
import { loginUser, logoutUser, registerUser } from "../services/authService";

export const AuthContext = createContext();

const AuthProvider = ({children}) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            setUser(firebaseUser);
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const login = async (email, password) => await loginUser(email, password);
    const register = async (email, password) => await registerUser(email, password);
    const logout = async () => await logoutUser();

    const value = useMemo(() => ({
        user,
        loading,
        login,
        logout,
        register
    }), [user, loading]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export default AuthProvider;