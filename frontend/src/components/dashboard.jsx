import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import "../css/dashboard.css";
import { disconnectSocket } from "./socket";

function Dashboard({ children }) {
  const navigate = useNavigate();
  function logout() {
    localStorage.removeItem("token");
    disconnectSocket();
    navigate("/");
  }
  return (
    <>
      <div className="dashboard">
        <div
          className="logo"
          onClick={() => {
            navigate("/home");
          }}
        >
          <img src={logo} alt="chatapp.png" height={40} className="image" />
          <div className="text">Chat app</div>
        </div>
        <button className="chat">Chats</button>
        <button className="Groups">Groups</button>
        <button
          className="Logout"
          onClick={() => {
            logout();
          }}
        >
          Logout
        </button>
      </div>
      {children}
    </>
  );
}

export default Dashboard;
