import React from "react";
import AuthButtons from "../../Components/settings/auth/AuthButtons";
import { HeaderItem } from "../Header";

interface MobileMenuProps {
  item: HeaderItem;
}

export default function MobileMenu({ item }: MobileMenuProps) {
  return (
    <div className="mobile-menu ">
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
      <div className="mobile-auth creater__user creater__user--mobile">
        <AuthButtons />
      </div>
    </div>
  );
}
