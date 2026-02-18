import { createContext, useCallback } from "react";
import { Alert } from "react-native";
import Toast from "react-native-toast-message";

export const AppContext = createContext();

const AppProvider = ({children}) => {
    // 🔴 Critical Errors (Blocking)
    const showCriticalError = useCallback((message, title = "Critical Error") => {
        console.error("[CRITICAL ERROR]:", message);

        Alert.alert(title, message, [{ text: "OK" }], {
        cancelable: true,
        });
    }, []);

    // 🟡 Minor Errors (Non-blocking Toast)
    const showErrorToast = useCallback((message, title = "Error") => {
        console.warn("[ERROR]:", message);

        Toast.show({
        type: "error",
        text1: title,
        text2: message,
        position: "top",
        visibilityTime: 4000,
        });
    }, []);

    // 🟢 Success Toast (very useful for auth & API)
    const showSuccessToast = useCallback((message, title = "Success") => {
        Toast.show({
        type: "success",
        text1: title,
        text2: message,
        position: "top",
        visibilityTime: 3000,
        });
    }, []);

    const value = {
        showCriticalError,
        showErrorToast,
        showSuccessToast,
    };

    return (
        <AppContext.Provider value={value}>
            {children}
            <Toast />
        </AppContext.Provider>
    );
}

export default AppProvider;