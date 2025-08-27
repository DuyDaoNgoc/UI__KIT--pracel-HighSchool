import React from "react";
import { HeaderItem } from "../Header";

interface NavDesktopProps {
  item: HeaderItem;
}

export default function NavDesktop({ item }: NavDesktopProps) {
  return (
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
  );
}
