import { useContext } from "react";
import { AppContext } from "../context/AppProvider";

const useApp = () => {
    const appContext = useContext(AppContext);
    
    if(!appContext) {
        throw new Error("useApp must only be used inside AppProvider");
    }

    return appContext;
}

export default useApp;