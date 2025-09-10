import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../css/login.css";
import axios from "axios";

function Login() {
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  async function handleSubmit() {
    try {
      const response = await axios.post("http://localhost:3000/login", {
        creds: { userName, password },
      });

      const token = response.data.token;
      localStorage.setItem("token", token);
      navigate("/home");
    } catch (err) {
      setError(err.response?.data?.msg || "Login failed");
    }
  }

  return (
    <div className="login-page">
      <div className="app-info">
        <h1>Welcome</h1>
        <p>Some info about your app can go here.</p>
      </div>
      <div className="login-side">
        <div className="login-card">
          <h2 className="login-text">Login</h2>
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
              className="userName"
              autoComplete="userName"
              onChange={(e) => setUserName(e.target.value)}
            />
            <input
              type="password"
              placeholder="********"
              value={password}
              className="password"
              autoComplete="current-password"
              onChange={(e) => setPassword(e.target.value)}
            />
            <button type="submit" className="login-button">
              Login
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;
