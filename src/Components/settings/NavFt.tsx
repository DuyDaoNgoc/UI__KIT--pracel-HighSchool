import React from "react";
import { Link } from "react-router-dom";

const NavFt: React.FC = () => {
  return (
    <div className="nav__footer">
      <ul className="nav__footer--items text__content--size-18">
        <li>
          <Link to="/about">About Us</Link>
        </li>
        <li>
          <Link to="/explore">Explore</Link>
        </li>
        <li>
          <Link to="/contact">Contact</Link>
        </li>
      </ul>
      <ul className="nav__footer--items text__content--size-18">
        <li>
          <Link to="/testimonials">Testimonials</Link>
        </li>
        <li>
          <Link to="/blog">Blog</Link>
        </li>
        <li>
          <Link to="/news">News</Link>
        </li>
      </ul>
      <ul className="nav__footer--items text__content--size-18">
        <li>
          <Link to="/documentation">Documentation</Link>
        </li>
        <li>
          <Link to="/help">Help</Link>
        </li>
        <li>
          <Link to="/privacy">Privacy</Link>
        </li>
      </ul>
    </div>
  );
};

export default NavFt;
