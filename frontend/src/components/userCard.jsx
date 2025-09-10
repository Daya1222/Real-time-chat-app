import "../css/userCard.css";

function UserCard({ userName, profilePic, onClick }) {
  return (
    <div className="userCard" onClick={onClick}>
      <div className="profilePic">
        <img src={profilePic} alt="" className="profilePic" />
      </div>
      <div className="userName">{userName}</div>
    </div>
  );
}

export default UserCard;
