import { onAuthStateChanged } from "firebase/auth";
import { createContext, useEffect, useMemo, useState } from "react";
import { auth } from "../config/firebase";
import useApp from "../hooks/useApp";
import { loginUser, logoutUser, registerUser } from "../services/authService";

export const AuthContext = createContext();

const AuthProvider = ({children}) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const {showErrorToast, showSuccessToast, showCriticalError} = useApp();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            setUser(firebaseUser);
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const login = async (email, password) => {
        try {
            const authUser = await loginUser(email, password);

            setUser(authUser);

            showSuccessToast("User logged in successfully!!", "Success");
        }catch(error) {
            showErrorToast(error.message, "Login error!!");
        }
    };

    const register = async (username, email, password) => {
        try {
            const registeredUser = await registerUser(username, email, password);

            setUser(registeredUser);
            
            showSuccessToast("Registration successful!!", "Success");
        }catch(error) {
            showErrorToast(error.message, "Registration error!!");
        }
    };

    const logout = async () => {
        try {
            await logoutUser();
            showSuccessToast("Log out successfully!!");
        }catch(error) {
            showCriticalError(error.message, "Logout error");
        }
    };

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