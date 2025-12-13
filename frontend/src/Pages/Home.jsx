import './Styles/Home.css'
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const navigate = useNavigate();

  function handleLogout() {
    console.log("Logging out...");
    setIsLoggedIn(false);
    localStorage.setItem('currentUser', "");
    if(isLoggedIn == false)
    {
        navigate("/", { replace: true });

    }
  }

  return (
    <div id="home">
      <h1>Welcome to Kush in Tech Chat</h1>

      <button
        onClick={handleLogout}
        style={{ marginTop: "10px", color: "white" }}
      >
        Logout
      </button>
    </div>
  );
}
