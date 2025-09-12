import "../css/userCard.css";
import { useContext } from "react";
import { RefreshContext } from "./refreshContext";
import deleteImg from "../assets/delete.png";

function UserCard({ userName, profilePic, onClick, page, lastMessage }) {
  const { globalUser } = useContext(RefreshContext);

  if (page === "admin") {
    return (
      <div className="userCard">
        <div className="profile-pic">
          <img src={profilePic} alt="" className="pic" />
        </div>
        <div className="userName">{userName}</div>
        <button className="delete-button" onClick={onClick}>
          <img src={deleteImg} alt="" height={30} className="delete-img" />
        </button>
      </div>
    );
  }
  return (
    <div className="userCard" onClick={onClick}>
      <div className="profile-pic">
        <img src={profilePic} alt="" className="pic" />
      </div>
      <div className="user-info">
        <div className="userName">{userName}</div>
        <div className="last-message">{lastMessage}</div>
      </div>
    </div>
  );
}

export default UserCard;
