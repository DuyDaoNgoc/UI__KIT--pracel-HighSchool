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

import Loading from "./Components/settings/loading/Loading";
import {
  SocketProvider,
  useSocket,
} from "./Components/settings/hook/IOserver/useSocket";
import {
  LoadingProvider,
  useGlobalLoading,
} from "./Components/settings/hook/IOserver/loading/LoadingContext";

import { register } from "../server/serviceWorker";
// page
import Introduce from "./pages/Contents/Introduce/index";
const Introduces = () => <Introduce />;
const Vacation = () => <h2>Vacation Page</h2>;
const FindMore = () => <h2>Find More Page</h2>;
const Admin = () => <AdminProfile />;

function Layout() {
  const location = useLocation();
  const { socket, loading: socketLoading, error } = useSocket();
  const { loading: globalLoading, setLoading } = useGlobalLoading();
  const [messages, setMessages] = useState<
    { text: string; timestamp: number }[]
  >([]);

  useEffect(() => {
    AOS.init({ duration: 800, delay: 100, once: true });
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleMessage = (msg: { text: string; timestamp: number }) => {
      setMessages((prev) => [...prev, msg]);
    };

    socket.on("message", handleMessage);

    return () => {
      socket.off("message", handleMessage);
    };
  }, [socket]);

  // ===== Track offline =====
  const [isOffline, setIsOffline] = React.useState(!navigator.onLine);
  React.useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);
  const showLoading = socketLoading || isOffline || globalLoading;

  // CHECK SERVER
  useEffect(() => {
    const checkServer = async () => {
      try {
        const res = await fetch("/socket-url", { cache: "no-store" });
        if (!res.ok) throw new Error("Server offline");
        setIsOffline(false);
      } catch (err) {
        setIsOffline(true);
      }
    };

    checkServer();
    const interval = setInterval(checkServer, 5000);
    return () => clearInterval(interval);
  }, []);

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
    location.pathname.startsWith(route),
  );

  const defaultItem = {
    hotels: "Trang chủ",
    airlines: "Giới thiệu",
    vacation: "Đội ngũ",
    find_more: "Tuyển sinh",
  };

  return (
    <div id="app" style={{ position: "relative" }}>
      {showLoading && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(255,255,255,0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <Loading />
        </div>
      )}

      {error && (
        <div
          style={{
            color: "red",
            textAlign: "center",
            marginTop: "20px",
            position: "fixed",
            top: 0,
            width: "100%",
            zIndex: 9999,
          }}
        >
          {error}
        </div>
      )}

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
            <Route path="/airlines" element={<Introduce />} />
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
  // ===== Nhúng service worker =====
  useEffect(() => {
    register({
      onSuccess: (reg) => console.log("Service Worker registered", reg),
      onUpdate: (reg) => console.log("Service Worker updated", reg),
    });
  }, []);

  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <LoadingProvider>
            <Layout />
          </LoadingProvider>
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}
