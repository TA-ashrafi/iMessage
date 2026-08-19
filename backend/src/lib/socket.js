import express from "express";
import http from "http";
import { Server } from "socket.io";

const app = express();

const server = http.createServer(app);

const allowedOrigin = process.env.FRONTEND_URL
  ? [
      process.env.FRONTEND_URL,
      "http://localhost:5173",
      "http://localhost:3000",
    ]
  : true;

const io = new Server(server, {
  cors: {
    origin: allowedOrigin,
    credentials: true,
  },

  transports: ["websocket", "polling"],
});

// --------------------------------------------------
// Online users
// userId -> Set of socket IDs
// --------------------------------------------------

const userSocketMap = new Map();

function getReceiverSocketId(userId) {
  const sockets = userSocketMap.get(String(userId));

  if (!sockets || sockets.size === 0) {
    return null;
  }

  // Return one active socket
  return [...sockets][0];
}

function emitOnlineUsers() {
  const onlineUsers = [...userSocketMap.keys()];

  console.log("Online users:", onlineUsers);

  io.emit("getOnlineUsers", onlineUsers);
}

io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;

  console.log("Socket connected:", socket.id);
  console.log("Socket user ID:", userId);

  if (!userId) {
    console.warn("Socket connected without userId:", socket.id);
    return;
  }

  const normalizedUserId = String(userId);

  // Get existing sockets for this user
  let sockets = userSocketMap.get(normalizedUserId);

  if (!sockets) {
    sockets = new Set();
    userSocketMap.set(normalizedUserId, sockets);
  }

  sockets.add(socket.id);

  emitOnlineUsers();

  socket.on("disconnect", (reason) => {
    console.log(
      "Socket disconnected:",
      socket.id,
      "User:",
      normalizedUserId,
      "Reason:",
      reason
    );

    const userSockets = userSocketMap.get(normalizedUserId);

    if (userSockets) {
      userSockets.delete(socket.id);

      // Only mark user offline if they have no other sockets
      if (userSockets.size === 0) {
        userSocketMap.delete(normalizedUserId);
      }
    }

    emitOnlineUsers();
  });
});

export {
  app,
  server,
  io,
  getReceiverSocketId,
};