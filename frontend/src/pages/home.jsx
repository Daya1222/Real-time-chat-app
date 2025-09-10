import { getSocket } from "../components/socket";
import UserCard from "../components/userCard";
import "../css/home-page.css";
import { useState } from "react";
import axios from "axios";

function Home({}) {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");

  async function getUsers() {
    const request = await axios.get("http://localhost:3000/api/get-users");
    const users = request.data();
    console.log(users);
    setUsers(users);
  }

  function handleClick(userName) {
    setSelectedUser(userName);
  }

  const token = localStorage.getItem("token");
  getSocket({ token });

  return (
    <div className="home-page">
      <div className="user-list"></div>
      <UserCard
        userName="Daya"
        profilePic=""
        onClick={() => {
          handleClick(userName);
        }}
      />
      <UserCard userName="Daya" profilePic="" />
      <UserCard userName="Daya" profilePic="" />
      <UserCard userName="Daya" profilePic="" />
      <UserCard userName="Daya" profilePic="" />
      <UserCard userName="Daya" profilePic="" />
      <UserCard userName="Daya" profilePic="" />

      <div className="chat-window"></div>
    </div>
  );
}

export default Home;
