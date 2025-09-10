import { useState, useContext } from "react";
import { RefreshContext } from "../components/refreshContext";
import "../css/chatBubbles.css";

function ChatBubble({ text, sender }) {
  const { globalUser } = useContext(RefreshContext);
  if (sender === globalUser.userName) {
    return <div className="right-side-textbox">{text}</div>;
  } else {
    return <div className="left-side-textbox">{text}</div>;
  }
}

export default ChatBubble;
