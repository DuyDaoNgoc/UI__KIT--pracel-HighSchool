import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import AuthButtons from "../../Components/settings/auth/AuthButtons";
export default function MobileMenu({ item }) {
    return (_jsxs("div", { className: "mobile-menu ", children: [_jsxs("ul", { children: [_jsx("li", { children: _jsx("a", { href: "/", children: item.hotels }) }), _jsx("li", { children: _jsx("a", { href: "/airlines", children: item.airlines }) }), _jsx("li", { children: _jsx("a", { href: "/vacation", children: item.vacation }) }), _jsx("li", { children: _jsx("a", { href: "/find-more", children: item.find_more }) })] }), _jsx("div", { className: "mobile-auth creater__user creater__user--mobile", children: _jsx(AuthButtons, {}) })] }));
}
