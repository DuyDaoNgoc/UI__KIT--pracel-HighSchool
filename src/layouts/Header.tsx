import React, { useState } from "react";
import HeaderImg from "../../public/assets/imgs/background/background.png";
import HamburgerIcon from "../icons/Hamburger";
import VideoFrame from "../Components/settings/VideoFrame";
import AuthButtons from "../Components/settings/auth/AuthButtons";

type HeaderItem = {
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
            hotels: "Hotels",
            airlines: "Airlines",
            vacation: "Vacation",
            find_more: "Find More",
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
            <div>
              <h1 className="logo">
                <a href="#">H.</a>
              </h1>
            </div>

            {/* NAV DESKTOP */}
            <nav className="nav-desktop">
              <ul className="main__menu">
                <li className="li">
                  <a className="items__icons--size" href="/">
                    {item.hotels}
                  </a>
                </li>
                <li className="li">
                  <a className="items__icons--size" href="/airlines">
                    {item.airlines}
                  </a>
                </li>
                <li className="li">
                  <a className="items__icons--size" href="/vacation">
                    {item.vacation}
                  </a>
                </li>
                <li className="li">
                  <a className="items__icons--size" href="/find-more">
                    {item.find_more}
                  </a>
                </li>
              </ul>
            </nav>

            {/* AUTH BUTTONS - desktop */}
            <div className="creater__user">
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
          {isMenuOpen && (
            <div className="mobile-menu">
              <ul>
                <li>
                  <a href="/">{item.hotels}</a>
                </li>
                <li>
                  <a href="/airlines">{item.airlines}</a>
                </li>
                <li>
                  <a href="/vacation">{item.vacation}</a>
                </li>
                <li>
                  <a href="/find-more">{item.find_more}</a>
                </li>
              </ul>
              <div className="mobile-auth">
                <AuthButtons />
              </div>
            </div>
          )}

          {/* VIDEO FRAME */}
          <VideoFrame
            list={[{ title: "See The Unmatched Beauty Of The Great Lakes" }]}
          />
        </section>
      ))}
    </>
  );
}
