import {Outlet, Navigate} from "react-router-dom";

export function ProtectedRoutes (){
    const user =null;
    if (user) {
        return <Outlet />;
    }
    else
    {
        return <Navigate to="/login" />;
    }
}