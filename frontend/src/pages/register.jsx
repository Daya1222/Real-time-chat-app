import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../css/register.css";
import axios from "axios";
import { useContext } from "react";
import { RefreshContext } from "../components/refreshContext";
import { Socket } from "socket.io-client";

function Register() {
  const { refresh, setRefresh } = useContext(RefreshContext);
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  async function handleSubmit() {
    try {
      const response = await axios.post("http://localhost:3000/register", {
        creds: {
          userName: userName,
          password: password,
          email: email,
        },
      });
      setRefresh((prev) => !prev);
      navigate("/");
      console.log(response.data);
    } catch (err) {
      alert(err.response.data.msg);
    }
  }

  return (
    <div className="Register-page">
      <div className="app-info">
        <h1>Welcome</h1>
        <p>
          Meet your new chat home. Connect with friends, share your vibe, and
          jump into conversations that matter. Say goodbye to endless scrolling
          and hello to a community that gets you.
        </p>
      </div>
      <div className="Register-side">
        <div className="Register-card">
          <h2 className="Register-text">Register</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
          >
            <input
              type="text"
              placeholder="Username"
              value={userName}
              autoComplete="userName"
              className="userName"
              onChange={(e) => setUserName(e.target.value)}
            />
            <input
              type="text"
              placeholder="Email"
              value={email}
              autoComplete="email"
              onChange={(e) => setEmail(e.target.value)}
              className="email"
            />
            <input
              type="password"
              placeholder="********"
              value={password}
              className="password"
              autoComplete="new-password"
              onChange={(e) => setPassword(e.target.value)}
            />

            <button type="submit" className="Register-button">
              Register
            </button>
            <a href="/login">Already have an account?</a>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Register;
