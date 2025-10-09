import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import NavFt from "../Components/settings/NavFt";
// ICONS
import PinterestIcon from "../icons/Pinterest";
import LinkedinIcon from "../icons/Linkedin";
import GooglePlusIcon from "../icons/GooglePlus";
import TwitterIcon from "../icons/Twitter";
import FacebookIcon from "../icons/Facebook";
import InstagramIcon from "../icons/Instagram";
import NextIcon from "../icons/Next";
const Footer = ({ list }) => {
    return (_jsx(_Fragment, { children: list.map((item, index) => (_jsxs("footer", { className: "footer", children: [_jsxs("div", { className: "footer--logo", children: [_jsx("h3", { className: "text__content--size-36 pricing__text--light-yellow text__content--lh-0", children: item.logo }), _jsx("p", { className: "text__content--size-18 text__content--white text__content--lh-2", children: item.content }), _jsx("p", { className: "text__content--small text__content--white text__content--lh-2 content--ft-hidden", children: item.subtitle }), _jsx("p", { className: "text__content--size-18 text__content--white text__content--lh-0", children: item.subscribe }), _jsxs("div", { className: "footer__email", children: [_jsx("input", { type: "text", placeholder: "Your Email", className: "footer--input text__content--small" }), _jsx("button", { className: "footer--btn", children: _jsx(NextIcon, {}) })] })] }), _jsxs("div", { className: "nav__footer--container", children: [_jsx(NavFt, {}), _jsx("div", { className: "footer__icons--container", children: _jsxs("div", { className: "footer__icons--items", children: [_jsx("p", { className: "text__content--size-18 text__content--white", children: "FOLLOW US" }), _jsxs("div", { className: "icons--items-ft", children: [_jsx(PinterestIcon, {}), _jsx(LinkedinIcon, {}), _jsx(GooglePlusIcon, {}), _jsx(TwitterIcon, {}), _jsx(FacebookIcon, {}), _jsx(InstagramIcon, {})] })] }) }), _jsx("p", { className: "text__content--small text__content--white text__content--lh-2 content--ft-flex", children: item.subtitle })] })] }, index))) }));
};
export default Footer;
