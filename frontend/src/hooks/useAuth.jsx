import { useContext } from "react";
import { AuthContext } from "../context/AuthProvider";

const useAuth = () =>  {
    const authContext = useContext(AuthContext);
    
    if(!authContext) {
        throw new Error("Make sure to use this inside AuthProvider");
    }

    return authContext;
};

export default useAuth;