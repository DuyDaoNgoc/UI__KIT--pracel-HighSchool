import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from "react";
import HeaderImg from "../../public/assets/imgs/background/background.png";
import HamburgerIcon from "../icons/Hamburger";
import VideoFrame from "../Components/settings/VideoFrame";
import AuthButtons from "../Components/settings/auth/AuthButtons";
import NavDesktop from "./header/NavDesktop";
import MobileMenu from "./header/MobileMenu";
import FacebookIcon from "../icons/Facebook";
import Twitter from "../icons/Twitter";
import Instagram from "../icons/Instagram";
export default function Header({ list }) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const data = list && list.length
        ? list
        : [
            {
                hotels: "Trang chủ",
                airlines: "Giới thiệu",
                vacation: "Đội ngũ",
                find_more: "Tuyển sinh",
            },
        ];
    return (_jsx(_Fragment, { children: data.map((item, index) => (_jsxs("section", { className: "wd-hg section", children: [_jsx("img", { src: HeaderImg, alt: "background", className: "background" }), _jsxs("header", { className: "header", children: [_jsx("div", { children: _jsx("h1", { className: "logo", children: _jsx("a", { href: "#", children: "H." }) }) }), _jsx(NavDesktop, { item: item }), _jsxs("div", { className: "icon--flex-mobile items__icons--size ", children: [_jsx(FacebookIcon, {}), _jsx(Instagram, {}), _jsx(Twitter, {})] }), _jsx("div", { className: "creater__user  creater__user--desktop", children: _jsx(AuthButtons, {}) }), _jsx("div", { className: "hamburger", onClick: () => setIsMenuOpen(!isMenuOpen), children: _jsx(HamburgerIcon, {}) })] }), isMenuOpen && _jsx(MobileMenu, { item: item }), _jsx(VideoFrame, { list: [
                        {
                            title: "Trải nghiệm môi trường học tập toàn diện",
                        },
                    ] })] }, index))) }));
}
