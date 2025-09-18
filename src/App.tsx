// src/App.tsx
import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";

import Home from "./pages/Home";
import Header from "./layouts/Header";
import Footer from "./layouts/Footer";
import { footerData } from "../server/data/footerData";

import Profile from "./pages/Profile/Students/Profile";
import ParentProfile from "./pages/Profile/Parents/ParentProfile";
import TeacherProfile from "./pages/Profile/teacher/TeacherProfile";
import AdminProfile from "./pages/Profile/admin/AdminProfile";

import AOS from "aos";
import "aos/dist/aos.css";
import { AnimatePresence, motion } from "framer-motion";
import { pageVariants } from "./configs/animations/pageVariants";

import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import { AuthProvider } from "./context/AuthContext";
import SubHeader from "./layouts/SubHeader";

import io from "socket.io-client";
import type { Socket } from "socket.io-client";

// Trang demo
const Airlines = () => <h2>Airlines Page</h2>;
const Vacation = () => <h2>Vacation Page</h2>;
const FindMore = () => <h2>Find More Page</h2>;
const Admin = () => <AdminProfile />;

function Layout() {
  const location = useLocation();
  const [socket, setSocket] = useState<typeof Socket | null>(null);
  const [messages, setMessages] = useState<
    { text: string; timestamp: number }[]
  >([]);

  useEffect(() => {
    AOS.init({ duration: 800, delay: 100, once: true });
  }, []);

  // ================= Socket.IO =================
  useEffect(() => {
    const fetchSocketUrl = async () => {
      try {
        // Lấy URL socket từ server
        const res = await fetch("/socket-url");
        const data = await res.json(); // { url: "https://xxxxx.ngrok-free.app" }
        const socketClient = io(data.url) as ReturnType<typeof io>;

        setSocket(socketClient);

        socketClient.on("connect", () =>
          console.log("Socket connected:", socketClient.id)
        );
        socketClient.on("message", (msg: { text: string; timestamp: number }) =>
          setMessages((prev) => [...prev, msg])
        );
        socketClient.on("disconnect", () => console.log("Socket disconnected"));

        return () => socketClient.disconnect();
      } catch (err) {
        console.error("Failed to connect socket:", err);
      }
    };

    fetchSocketUrl();
  }, []);

  const sendMessage = (msg: string) => {
    if (socket) socket.emit("message", { text: msg, timestamp: Date.now() });
  };

  const hiddenLayoutRoutes = [
    "/login",
    "/register",
    "/admin",
    "/profile",
    "/profile/teacher",
    "/profile/parent",
    "/profile/admin",
  ];

  const isHidden = hiddenLayoutRoutes.some((route) =>
    location.pathname.startsWith(route)
  );

  const defaultItem = {
    hotels: "Trang chủ",
    airlines: "Giới thiệu",
    vacation: "Đội ngũ",
    find_more: "Tuyển sinh",
  };

  return (
    <div id="app">
      {!isHidden &&
        (location.pathname === "/" ? (
          <Header />
        ) : (
          <SubHeader item={defaultItem} />
        ))}

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={location.pathname + "-content"}
          variants={pageVariants.zoom}
          initial="initial"
          animate="animate"
          exit="exit"
          style={{ minHeight: "80vh" }}
        >
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Home />} />
            <Route path="/airlines" element={<Airlines />} />
            <Route path="/vacation" element={<Vacation />} />
            <Route path="/find-more" element={<FindMore />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/profile/parent" element={<ParentProfile />} />
            <Route path="/profile/teacher" element={<TeacherProfile />} />
            <Route path="/profile/admin" element={<AdminProfile />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </motion.div>
      </AnimatePresence>

      {!isHidden && <Footer list={footerData} />}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Layout />
      </Router>
    </AuthProvider>
  );
}
