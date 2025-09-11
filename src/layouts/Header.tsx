import React, { useState } from "react";
import HeaderImg from "../../public/assets/imgs/background/background.png";
import HamburgerIcon from "../icons/Hamburger";
import VideoFrame from "../Components/settings/VideoFrame";
import AuthButtons from "../Components/settings/auth/AuthButtons";
import NavDesktop from "./header/NavDesktop";
import MobileMenu from "./header/MobileMenu";
import FacebookIcon from "../icons/Facebook";
import Twitter from "../icons/Twitter";
import Instagram from "../icons/Instagram";
export type HeaderItem = {
  hotels: string;
  airlines: string;
  vacation: string;
  find_more: string;
};

interface HeaderProps {
  list?: HeaderItem[];
}

export default function Header({ list }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const data: HeaderItem[] =
    list && list.length
      ? list
      : [
          {
            hotels: "Trang chủ",
            airlines: "Giới thiệu",
            vacation: "Đội ngũ",
            find_more: "Tuyển sinh",
          },
        ];

  return (
    <>
      {data.map((item, index) => (
        <section className="wd-hg" key={index}>
          {/* BACKGROUND */}
          <img src={HeaderImg} alt="background" className="background" />

          {/* HEADER */}
          <header className="header">
            {/* Logo */}
            <div>
              <h1 className="logo">
                <a href="#">H.</a>
              </h1>
            </div>

            {/* NAV DESKTOP */}
            <NavDesktop item={item} />

            <div className="icon--flex-mobile items__icons--size ">
              <FacebookIcon />
              <Instagram />
              <Twitter />
            </div>
            {/* AUTH BUTTONS - desktop */}
            <div className="creater__user  creater__user--desktop">
              <AuthButtons />
            </div>

            {/* HAMBURGER */}
            <div
              className="hamburger"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <HamburgerIcon />
            </div>
          </header>

          {/* MOBILE MENU */}
          {isMenuOpen && <MobileMenu item={item} />}

          {/* VIDEO FRAME */}
          <VideoFrame
            list={[
              {
                title: "Trải nghiệm môi trường học tập toàn diện",
              },
            ]}
          />
        </section>
      ))}
    </>
  );
}
