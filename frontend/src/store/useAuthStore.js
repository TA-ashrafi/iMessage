import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import { io } from "socket.io-client";

const BASE_URL =
  import.meta.env.MODE === "development"
    ? "http://localhost:3000"
    : window.location.origin;

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isCheckingAuth: true,
  onlineUsers: [],
  socket: null,

  checkAuth: async () => {
    set({ isCheckingAuth: true });

    try {
      const res = await axiosInstance.get("/auth/check");

      const user = res.data;

      set({
        authUser: user,
      });

      // Connect socket only after we have the MongoDB user
      get().connectSocket(user);
    } catch (error) {
      console.error(
        "Error in checkAuth:",
        error.response?.data || error.message
      );

      set({
        authUser: null,
        onlineUsers: [],
      });

      get().disconnectSocket();
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  clearAuth: () => {
    get().disconnectSocket();

    set({
      authUser: null,
      isCheckingAuth: false,
      onlineUsers: [],
    });
  },

  connectSocket: (user) => {
    if (!user?._id) {
      console.warn("Socket connection skipped: MongoDB user ID missing");
      return;
    }

    // Already connected for this user
    const existingSocket = get().socket;

    if (existingSocket?.connected) {
      return;
    }

    // Clean old socket if one exists
    if (existingSocket) {
      existingSocket.removeAllListeners();
      existingSocket.disconnect();
    }

    const socket = io(BASE_URL, {
      query: {
        // IMPORTANT:
        // This MUST be MongoDB _id, NOT Clerk userId
        userId: String(user._id),
      },

      withCredentials: true,

      transports: ["websocket", "polling"],

      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
      console.log("Socket user MongoDB ID:", String(user._id));
    });

    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error.message);
    });

    socket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
    });

    socket.on("getOnlineUsers", (userIds) => {
      console.log("Online users:", userIds);

      set({
        onlineUsers: userIds.map((id) => String(id)),
      });
    });

    set({
      socket,
    });
  },

  disconnectSocket: () => {
    const socket = get().socket;

    if (socket) {
      socket.removeAllListeners();
      socket.disconnect();
    }

    set({
      socket: null,
      onlineUsers: [],
    });
  },
}));