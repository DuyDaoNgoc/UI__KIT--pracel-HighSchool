import React, { useEffect } from "react";
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
// profile
import Profile from "./pages/Profile/Profile";
import ParentProfile from "./pages/Profile/ParentProfile";
import TeacherProfile from "./pages/Profile/teacher/TeacherProfile";
import AdminProfile from "./pages/Profile/admin/AdminProfile";

import AOS from "aos";
import "aos/dist/aos.css";

// Import page thật
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

// Import AuthProvider
import { AuthProvider } from "./context/AuthContext";

// SubHeader
import SubHeader from "./layouts/SubHeader";

const Airlines = () => <h2>Airlines Page</h2>;
const Vacation = () => <h2>Vacation Page</h2>;
const FindMore = () => <h2>Find More Page</h2>;
const Admin = () => <h2>Admin Dashboard</h2>;

function Layout() {
  const location = useLocation();

  useEffect(() => {
    AOS.init({ duration: 800, delay: 100, once: true });
    AOS.refresh();
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
      {/* HEADER */}
      {!isHidden && (
        <>
          {location.pathname === "/" ? (
            <Header />
          ) : (
            <SubHeader item={defaultItem} />
          )}
        </>
      )}

      {/* ROUTES */}
      <Routes>
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

      {/* FOOTER */}
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
