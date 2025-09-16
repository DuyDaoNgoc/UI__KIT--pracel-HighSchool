import React, { useState } from "react";
import NavDesktop from "./header/NavDesktop";
import MobileMenu from "./header/MobileMenu";
import AuthButtons from "../Components/settings/auth/AuthButtons";
import HamburgerIcon from "../icons/Hamburger";
import FacebookIcon from "../icons/Facebook";
import Twitter from "../icons/Twitter";
import Instagram from "../icons/Instagram";

type HeaderItem = {
  hotels: string;
  airlines: string;
  vacation: string;
  find_more: string;
};

interface SubHeaderProps {
  item: HeaderItem;
}

export default function SubHeader({ item }: SubHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sub-header">
      {/* Logo */}
      <div style={{ zIndex: 99 }}>
        <h1 className="logo">
          <a href="#">H.</a>
        </h1>
      </div>

      {/* NAV DESKTOP */}
      <NavDesktop item={item} />

      {/* ICONS */}
      <div className="icon--flex-mobile items__icons--size ">
        <button className="btn--sub">
          <FacebookIcon />
        </button>
        <button className="btn--sub">
          <Instagram />
        </button>
        <button className="btn--sub">
          <Twitter />
        </button>
      </div>

      {/* AUTH BUTTONS - desktop */}
      <div className="creater__user creater__user--desktop">
        <AuthButtons />
      </div>

      {/* HAMBURGER */}
      <div className="hamburger" onClick={() => setIsMenuOpen(!isMenuOpen)}>
        <HamburgerIcon />
      </div>

      {/* MOBILE MENU */}
      {isMenuOpen && <MobileMenu item={item} />}
    </header>
  );
}
