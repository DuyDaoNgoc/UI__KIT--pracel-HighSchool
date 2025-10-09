// src/Components/settings/hook/IOserver/useSocket.tsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { io, type Socket } from "socket.io-client";

const BACKEND_PORT = process.env.REACT_APP_BACKEND_PORT || "8000";

const getSocketURL = (): string => {
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    if (hostname === "localhost" || hostname === "127.0.0.1")
      return `http://localhost:${BACKEND_PORT}`;
    const lanRegex = /^192\.168\.\d+\.\d+$/;
    if (lanRegex.test(hostname)) return `http://${hostname}:${BACKEND_PORT}`;
    if (process.env.NODE_ENV === "production") return `https://UI-kit.com`;
    return window.location.origin;
  }
  return (
    process.env.REACT_APP_BACKEND_URL || `http://localhost:${BACKEND_PORT}`
  );
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
    const socketURL = getSocketURL();
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
      setLoading(false);
      setError(null);
    });

    s.on("disconnect", () => {
      console.warn("⚠️ Socket disconnected");
      setLoading(true);
    });

    s.on("connect_error", (err: any) => {
      console.error("❌ Socket connect_error:", err.message || err);
      setError("Không thể kết nối server");
      setLoading(false);
    });

    // ===== Reconnect events =====
    s.io.on("reconnect_attempt", () => setLoading(true));
    s.io.on("reconnect_failed", () => {
      setLoading(false);
      setError("Không thể kết nối server");
    });

    return () => {
      // @ts-ignore
      s.offAny?.();
      s.disconnect();
      console.log("🔌 Socket disconnected cleanup.");
    };
  }, []);

  return (
    <SocketContext.Provider
      value={{ socket, data, loading: loading || isOffline, error }}
    >
      {children}
    </SocketContext.Provider>
  );
};
