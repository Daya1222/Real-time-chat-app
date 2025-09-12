import { useState, useContext } from "react";
import { RefreshContext } from "../components/refreshContext";
import "../css/chatBubbles.css";

function ChatBubble({ text, sender, msgStatus }) {
  const { globalUser } = useContext(RefreshContext);
  if (sender === globalUser.userName) {
    return (
      <div className="right-side-textbox">
        <div className="text"> {text}</div>

        <div className="read-status">
          {msgStatus === "sent" && <span>✔</span>}
          {msgStatus === "delivered" && <span>✔✔</span>}
          {msgStatus === "read" && <span style={{ color: "blue" }}>✔✔</span>}
        </div>
      </div>
    );
  } else {
    return <div className="left-side-textbox">{text}</div>;
  }
}

export default ChatBubble;
