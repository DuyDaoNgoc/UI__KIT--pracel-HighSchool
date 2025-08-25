import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// import các page
import Home from "../pages/Home";
import Testimonials from "../pages/Contents/Testimonials";
import Blog from "../pages/Contents/Blog";
import News from "../pages/Contents/News";
import Documentation from "../pages/Contents/Documentation";
import Help from "../pages/Contents/Help";
import Privacy from "../pages/Contents/Privacy";

const AppRouter: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/testimonials" element={<Testimonials />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/news" element={<News />} />
        <Route path="/documentation" element={<Documentation />} />
        <Route path="/help" element={<Help />} />
        <Route path="/privacy" element={<Privacy />} />
      </Routes>
    </Router>
  );
};

export default AppRouter;
