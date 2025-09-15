// src/Routers/Routers.tsx
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Home from "../pages/Home";
import Testimonials from "../pages/Contents/Testimonials";
import Blog from "../pages/Contents/Blog";
import News from "../pages/Contents/News";
import Documentation from "../pages/Contents/Documentation";
import Help from "../pages/Contents/Help";
import Privacy from "../pages/Contents/Privacy";

import Profile from "../pages/Profile/Profile";
import TeacherProfile from "../pages/Profile/teacher/TeacherProfile";
import ParentProfile from "../pages/Profile/ParentProfile";
import AdminProfile from "../pages/Profile/admin/AdminProfile";

import Header from "../layouts/Header";
import Footer from "../layouts/Footer";

type FooterItem = {
  logo: string;
  content: string;
  subtitle: string;
  subscribe: string;
};

// Layout mặc định: có Header + Footer
const DefaultLayout: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <>
    <Header />
    <main>{children}</main>
    <Footer
      list={[
        { logo: "L1", content: "Home", subtitle: "Trang chủ", subscribe: "" },
        { logo: "L2", content: "Blog", subtitle: "Bài viết", subscribe: "" },
        {
          logo: "L3",
          content: "Privacy",
          subtitle: "Chính sách",
          subscribe: "",
        },
      ]}
    />
  </>
);

// Layout riêng cho Profile: KHÔNG Header + Footer
const ProfileLayout: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => <main>{children}</main>;

// ProfileRouter để map tất cả /profile/* subpage
const ProfileRouter: React.FC = () => (
  <Routes>
    <Route index element={<Profile />} />
    <Route path="teacher" element={<TeacherProfile />} />
    <Route path="parent" element={<ParentProfile />} />
    <Route path="admin/*" element={<AdminProfile />} />
  </Routes>
);

const AppRouter: React.FC = () => (
  <Router>
    <Routes>
      {/* Routes mặc định có Header + Footer */}
      <Route
        path="/"
        element={
          <DefaultLayout>
            <Home />
          </DefaultLayout>
        }
      />
      <Route
        path="/testimonials"
        element={
          <DefaultLayout>
            <Testimonials />
          </DefaultLayout>
        }
      />
      <Route
        path="/blog"
        element={
          <DefaultLayout>
            <Blog />
          </DefaultLayout>
        }
      />
      <Route
        path="/news"
        element={
          <DefaultLayout>
            <News />
          </DefaultLayout>
        }
      />
      <Route
        path="/documentation"
        element={
          <DefaultLayout>
            <Documentation />
          </DefaultLayout>
        }
      />
      <Route
        path="/help"
        element={
          <DefaultLayout>
            <Help />
          </DefaultLayout>
        }
      />
      <Route
        path="/privacy"
        element={
          <DefaultLayout>
            <Privacy />
          </DefaultLayout>
        }
      />

      {/* Tất cả /profile/* dùng ProfileLayout (không Header/Footer) */}
      <Route
        path="/profile/*"
        element={
          <ProfileLayout>
            <ProfileRouter />
          </ProfileLayout>
        }
      />
    </Routes>
  </Router>
);

export default AppRouter;
