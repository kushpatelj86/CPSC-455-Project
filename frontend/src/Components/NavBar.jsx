import { Link } from "react-router-dom";
import "./Styles/Navbar.css";

export function NavBar() {
    return (
        <div id="navbar">
            <Link className="link-styles" to="/home"><button>Home</button></Link>
            <Link className="link-styles" to="/about"><button>About</button></Link>
            <Link className="link-styles" to="/chat"><button>Chat</button></Link>

        </div>
    );
}