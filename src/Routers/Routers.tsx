// src/Routers/Routers.tsx
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

// Pages
import Home from "../pages/Home";
import Testimonials from "../pages/Contents/home/Testimonials";
import Blog from "../pages/Contents/home/Blog";
import News from "../pages/Contents/home/News";
import Documentation from "../pages/Contents/home/Documentation";
import Help from "../pages/Contents/home/Help";
import Privacy from "../pages/Contents/home/Privacy";

// Profile
import Profile from "../pages/Profile/Students/Profile";
import TeacherProfile from "../pages/Profile/teacher/TeacherProfile";
import ParentProfile from "../pages/Profile/Parents/ParentProfile";
import AdminProfile from "../pages/Profile/admin/AdminProfile";

// Layout
import Header from "../layouts/Header";
import Footer from "../layouts/Footer";

// Animation
import { pageVariants } from "../configs/animations/pageVariants";

// ----------------------
// PageWrapper: animate riêng cho mỗi page (chỉ dùng zoom/fade)
// ----------------------
type PageWrapperProps = {
  children: React.ReactNode;
  variant?: "fade" | "zoom";
};

const PageWrapper: React.FC<PageWrapperProps> = ({
  children,
  variant = "zoom",
}) => (
  <motion.div
    variants={pageVariants[variant]}
    initial="initial"
    animate="animate"
    exit="exit"
    style={{ minHeight: "80vh" }}
  >
    {children}
  </motion.div>
);

// ----------------------
// Layout mặc định (Header + Footer tĩnh)
// ----------------------
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

// ----------------------
// Layout Profile (KHÔNG Header/Footer)
// ----------------------
const ProfileLayout: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => <main>{children}</main>;

// ----------------------
// Router riêng cho /profile/*
// ----------------------
const ProfileRouter: React.FC = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route
          index
          element={
            <PageWrapper>
              <Profile />
            </PageWrapper>
          }
        />
        <Route
          path="teacher"
          element={
            <PageWrapper>
              <TeacherProfile />
            </PageWrapper>
          }
        />
        <Route
          path="parent"
          element={
            <PageWrapper>
              <ParentProfile />
            </PageWrapper>
          }
        />
        <Route
          path="admin/*"
          element={
            <PageWrapper>
              <AdminProfile />
            </PageWrapper>
          }
        />
      </Routes>
    </AnimatePresence>
  );
};

// ----------------------
// AppRouter chính
// ----------------------
const AppRouter: React.FC = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        {/* Default Layout */}
        <Route
          path="/"
          element={
            <DefaultLayout>
              <PageWrapper>
                <Home />
              </PageWrapper>
            </DefaultLayout>
          }
        />
        <Route
          path="/testimonials"
          element={
            <DefaultLayout>
              <PageWrapper>
                <Testimonials />
              </PageWrapper>
            </DefaultLayout>
          }
        />
        <Route
          path="/blog"
          element={
            <DefaultLayout>
              <PageWrapper>
                <Blog />
              </PageWrapper>
            </DefaultLayout>
          }
        />
        <Route
          path="/news"
          element={
            <DefaultLayout>
              <PageWrapper>
                <News />
              </PageWrapper>
            </DefaultLayout>
          }
        />
        <Route
          path="/documentation"
          element={
            <DefaultLayout>
              <PageWrapper>
                <Documentation />
              </PageWrapper>
            </DefaultLayout>
          }
        />
        <Route
          path="/help"
          element={
            <DefaultLayout>
              <PageWrapper>
                <Help />
              </PageWrapper>
            </DefaultLayout>
          }
        />
        <Route
          path="/privacy"
          element={
            <DefaultLayout>
              <PageWrapper>
                <Privacy />
              </PageWrapper>
            </DefaultLayout>
          }
        />

        {/* Profile routes */}
        <Route
          path="/profile/*"
          element={
            <ProfileLayout>
              <ProfileRouter />
            </ProfileLayout>
          }
        />
      </Routes>
    </AnimatePresence>
  );
};

// ----------------------
// Router ngoài cùng
// ----------------------
const RootRouter: React.FC = () => (
  <Router>
    <AppRouter />
  </Router>
);

export default RootRouter;
