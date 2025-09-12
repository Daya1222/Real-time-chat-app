import "../css/admin.css";
import UserCard from "../components/userCard";
import profilePic from "../assets/profile.png";
import axios from "axios";
import { useContext } from "react";
import { RefreshContext } from "../components/refreshContext";

function Admin() {
  const { users, setUsers, globalUser, filter, setFilter, onlineUsers } =
    useContext(RefreshContext);

  // Delete user API call
  async function deleteUser(userNameToDelete) {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "http://localhost:3000/api/delete-user",
        { userName: userNameToDelete },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("Deleted:", response.data);

      setUsers((prevUsers) =>
        prevUsers.filter((user) => user.userName !== userNameToDelete)
      );
    } catch (err) {
      console.error(err.response?.data || err.message);
    }
  }

  // Filtered users to display
  const displayedUsers =
    filter === "all"
      ? users.filter((user) => user.userName !== globalUser.userName)
      : users.filter(
          (user) =>
            user.userName !== globalUser.userName &&
            onlineUsers.includes(user.userName)
        );

  return (
    <div className="admin-page">
      <div className="header">
        <button onClick={() => setFilter("all")}>All Users</button>
        <button onClick={() => setFilter("online")}>Online Users</button>
      </div>

      <div className="user-list">
        {displayedUsers.length > 0 ? (
          displayedUsers.map((user) => (
            <UserCard
              key={user._id}
              profilePic={profilePic}
              userName={user.userName}
              page="admin"
              onClick={() => deleteUser(user.userName)}
            />
          ))
        ) : (
          <div style={{ textAlign: "center", marginTop: "20px", fontSize: 20 }}>
            {filter === "online" ? "No users online" : "No users available"}
          </div>
        )}
      </div>
    </div>
  );
}

export default Admin;
