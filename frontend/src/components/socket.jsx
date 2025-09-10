import { io } from "socket.io-client";

let socket;

export function getSocket({ token }) {
  if (!socket)
    socket = io("http://localhost:3000", {
      auth: { token: token },
    });
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
