// src/Components/settings/hook/IOserver/useSocket.tsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { io, type Socket } from "socket.io-client";
import toast, { Toaster } from "react-hot-toast";

const BACKEND_PORT = process.env.REACT_APP_BACKEND_PORT || "8000";
const getSocketURL = async (): Promise<string> => {
  if (typeof window === "undefined")
    return (
      process.env.REACT_APP_BACKEND_URL || `http://localhost:${BACKEND_PORT}`
    );

  const hostname = window.location.hostname;

  // localhost
  if (hostname === "localhost") {
    return `http://localhost:${BACKEND_PORT}`;
  }

  // LAN hiện tại từ server
  if (process.env.NODE_ENV === "production") {
    const res = await fetch("/socket-url");
    const data = await res.json();
    return data.url; // http://<LAN_IP>:PORT
  }

  // LAN IP kiểu 192.168.x.x
  const lanRegex = /^192\.168\.\d+\.\d+$/;
  if (lanRegex.test(hostname)) {
    return `http://${hostname}:${BACKEND_PORT}`;
  }

  // production => fetch từ server để lấy IP LAN
  if (process.env.NODE_ENV === "production") {
    try {
      const res = await fetch("/socket-url");
      if (res.ok) {
        const data = await res.json();
        if (data.url) return data.url; // sẽ là http://<LAN_IP>:PORT
      }
      console.warn("⚠️ /socket-url response chưa có url, fallback");
    } catch (err) {
      console.error("❌ Không lấy được LAN IP từ server, fallback:", err);
    }
    return `http://localhost:${BACKEND_PORT}`;
  }

  // fallback
  return window.location.origin;
};

export type SocketType = Socket | null;
export type SocketEventHandler = (event: string, payload: any) => void;

interface SocketContextType {
  socket: SocketType;
  data: Record<string, any>;
  loading: boolean;
  error: string | null;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  data: {},
  loading: true,
  error: null,
});

export const useSocket = () => useContext(SocketContext);
export const useSocketData = () => useContext(SocketContext).data;

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [socket, setSocket] = useState<SocketType>(null);
  const [data, setData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ===== Offline state =====
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    const initSocket = async () => {
      const socketURL = await getSocketURL();
      console.log("🔗 Kết nối socket đến:", socketURL);

      const s: Socket = io(socketURL, {
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 2000,
      });

      setSocket(s);

      const eventHandler: SocketEventHandler = (event, payload) => {
        setData((prev) => ({ ...prev, [event]: payload }));
      };

      // @ts-ignore
      s.onAny(eventHandler);

      s.on("connect", () => {
        console.log("✅ Socket connected:", s.id);
        toast.success("Đã kết nối");
        setLoading(false);
        setError(null);
        // Auto-join rooms based on logged-in user info (if present in localStorage)
        try {
          const rawUser = window.localStorage.getItem("user");
          const authUser = rawUser ? JSON.parse(rawUser) : null;
          const rooms: string[] = [];
          if (authUser) {
            if (authUser.role) rooms.push(`role:${authUser.role}`);
            if (authUser.studentId) rooms.push(`user:${authUser.studentId}`);
            if (authUser.teacherId) rooms.push(`user:${authUser.teacherId}`);
            if (authUser.parentId) rooms.push(`user:${authUser.parentId}`);
            if (authUser.classCode) rooms.push(`class:${authUser.classCode}`);
          }
          if (rooms.length) {
            s.emit("join", rooms);
            console.log("🔐 Request join rooms:", rooms);
          }
        } catch (err) {
          console.warn("⚠️ Could not auto-join rooms:", err);
        }
      });

      s.on("disconnect", () => {
        console.warn("⚠️ Socket disconnected");
        setLoading(true);
      });

      s.on("connect_error", (err: any) => {
        console.error("❌ Socket connect_error:", err.message || err);
        toast.error("Không có kết nối internet");
        setLoading(false);
      });

      // ===== Reconnect events =====
      s.io.on("reconnect_attempt", () => setLoading(true));
      s.io.on("reconnect_failed", () => {
        setLoading(false);
        toast.error("Không có kết nối internet");
      });

      return () => {
        // @ts-ignore
        s.offAny?.();
        s.disconnect();
        console.log("🔌 Socket disconnected cleanup.");
      };
    };

    initSocket();
  }, []);

  return (
    <SocketContext.Provider
      value={{ socket, data, loading: loading || isOffline, error }}
    >
      {children}
      <Toaster position="top-right" reverseOrder={false} />
    </SocketContext.Provider>
  );
};
