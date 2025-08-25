import React, { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useLocation,
} from "react-router-dom";

import Home from "./pages/Home";
import Header from "./layouts/Header";
import Footer from "./layouts/Footer";
import { footerData } from "../server/data/footerData";

import AOS from "aos";
import "aos/dist/aos.css";

// Import page thật
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

// Dummy pages (chỉ giữ lại mấy cái test thôi)
const Airlines = () => <h2>Airlines Page</h2>;
const Vacation = () => <h2>Vacation Page</h2>;
const FindMore = () => <h2>Find More Page</h2>;
const Admin = () => <h2>Admin Dashboard</h2>;

function Layout() {
  const location = useLocation();

  // init AOS mỗi khi Layout mount
  useEffect(() => {
    AOS.init({
      duration: 800,
      delay: 100,
      once: true,
    });
    AOS.refresh();
  }, []);

  // Các route KHÔNG hiện header + footer
  const hiddenLayoutRoutes = ["/login", "/register", "/admin"];
  const isHidden = hiddenLayoutRoutes.some((route) =>
    location.pathname.startsWith(route)
  );

  return (
    <div id="app">
      {/* HEADER */}
      {!isHidden && (
        <>
          {location.pathname === "/" ? (
            <Header />
          ) : (
            <nav>
              <Link to="/">Hotels</Link> | <Link to="/airlines">Airlines</Link>{" "}
              | <Link to="/vacation">Vacation</Link> |{" "}
              <Link to="/find-more">Find More</Link>
            </nav>
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
        <Route path="/admin" element={<Admin />} />
      </Routes>

      {/* FOOTER */}
      {!isHidden && <Footer list={footerData} />}
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Layout />
    </Router>
  );
}
