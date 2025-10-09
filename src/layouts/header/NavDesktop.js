import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export default function NavDesktop({ item }) {
    return (_jsx("nav", { className: "nav-desktop", children: _jsxs("ul", { className: "main__menu", children: [_jsx("li", { className: "li", children: _jsx("a", { className: "items__icons--size", href: "/", children: item.hotels }) }), _jsx("li", { className: "li", children: _jsx("a", { className: "items__icons--size", href: "/airlines", children: item.airlines }) }), _jsx("li", { className: "li", children: _jsx("a", { className: "items__icons--size", href: "/vacation", children: item.vacation }) }), _jsx("li", { className: "li", children: _jsx("a", { className: "items__icons--size", href: "/find-more", children: item.find_more }) })] }) }));
}
