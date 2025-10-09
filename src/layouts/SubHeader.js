import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import NavDesktop from "./header/NavDesktop";
import MobileMenu from "./header/MobileMenu";
import AuthButtons from "../Components/settings/auth/AuthButtons";
import HamburgerIcon from "../icons/Hamburger";
import FacebookIcon from "../icons/Facebook";
import Twitter from "../icons/Twitter";
import Instagram from "../icons/Instagram";
export default function SubHeader({ item }) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    return (_jsxs("header", { className: "sub-header", children: [_jsx("div", { style: { zIndex: 99 }, children: _jsx("h1", { className: "logo", children: _jsx("a", { href: "#", children: "H." }) }) }), _jsx(NavDesktop, { item: item }), _jsxs("div", { className: "icon--flex-mobile items__icons--size ", children: [_jsx("button", { className: "btn--sub", children: _jsx(FacebookIcon, {}) }), _jsx("button", { className: "btn--sub", children: _jsx(Instagram, {}) }), _jsx("button", { className: "btn--sub", children: _jsx(Twitter, {}) })] }), _jsx("div", { className: "creater__user creater__user--desktop", children: _jsx(AuthButtons, {}) }), _jsx("div", { className: "hamburger", onClick: () => setIsMenuOpen(!isMenuOpen), children: _jsx(HamburgerIcon, {}) }), isMenuOpen && _jsx(MobileMenu, { item: item })] }));
}
