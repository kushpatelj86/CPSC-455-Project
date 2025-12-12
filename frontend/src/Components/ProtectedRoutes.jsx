import {Outlet, Navigate} from "react-router-dom";

export function ProtectedRoutes (){
    const user =null;
    return user ? <Outlet /> : <Navigate to="/login"/>
}