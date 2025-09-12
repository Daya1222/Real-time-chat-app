import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import "../css/register.css";
import axios from "axios";
import { RefreshContext } from "../components/refreshContext";

function Register() {
  const { refresh, setRefresh } = useContext(RefreshContext);
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function handleSubmit() {
    try {
      const response = await axios.post("http://localhost:3000/register", {
        creds: {
          userName,
          password,
          email,
        },
      });
      setRefresh((prev) => !prev);
      navigate("/login");
      console.log(response.data);
    } catch (err) {
      setError(err.response?.data?.msg || "Registration failed");
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
            {error && <div className="error-msg">{error}</div>}

            <input
              type="text"
              placeholder="Username"
              value={userName}
              autoComplete="userName"
              className={`userName ${error ? "input-error" : ""}`}
              onChange={(e) => {
                setUserName(e.target.value);
                setError("");
              }}
            />
            <input
              type="text"
              placeholder="Email"
              value={email}
              autoComplete="email"
              className={`email ${error ? "input-error" : ""}`}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
            />
            <input
              type="password"
              placeholder="********"
              value={password}
              className={`password ${error ? "input-error" : ""}`}
              autoComplete="new-password"
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
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
