import { useNavigate } from "react-router-dom";
import "../css/info.css";

function Info() {
  const navigate = useNavigate();
  return (
    <div className="info-page">
      <div className="Text">
        <h1>Welcome to ChatApp</h1>
        <p>
          This project is a real-time chat application built with React,
          featuring secure user registration and login. It uses WebSockets for
          instant message delivery, ensuring conversations update dynamically
          without page refreshes. The app implements protected routes to keep
          user data safe, and showcases state management, RESTful API
          integration with Axios, and responsive UI design. It’s a practical
          demonstration of modern web development techniques in a full-stack
          environment.
        </p>
      </div>
      <div className="button-class">
        <button className="login-button" onClick={() => navigate("/login")}>
          Login
        </button>
        <button className="register-button" onClick={() => navigate("/login")}>
          Register
        </button>
      </div>
    </div>
  );
}

export default Info;
