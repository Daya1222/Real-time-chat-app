import { useNavigate } from "react-router-dom";
import { useContext, useEffect } from "react";
import { RefreshContext } from "./refreshContext";
import logo from "../assets/logo.png";
import "../css/dashboard.css";
import { disconnectSocket } from "./socket";

function Dashboard({ children, hide }) {
  const { globalUser } = useContext(RefreshContext);
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
          <div className="text">SocketTalk</div>
        </div>

        {hide !== "button" ? (
          globalUser.role === "admin" ? (
            <button className="admin" onClick={() => navigate("/admin-page")}>
              Admin
            </button>
          ) : (
            <div />
          )
        ) : (
          <button className="chats" onClick={() => navigate("/home")}>
            Chats
          </button>
        )}

        <div className="current-user">{globalUser.userName}</div>
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
