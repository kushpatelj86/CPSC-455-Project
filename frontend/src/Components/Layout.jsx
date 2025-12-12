import {NavBar} from "./NavBar"
import { Outlet } from "react-router-dom"
import "./Styles/Layout.css"

export function Layout(){

    return (
        <div id="layout">
            <NavBar/>
            <main>
                <Outlet/>
            </main>
        </div>
    )
}