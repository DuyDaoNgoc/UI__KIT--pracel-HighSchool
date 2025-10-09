import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
// src/components/settings/auth/AuthButtons.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import avatar from "../../../../public/assets/imgs/avatar/avatar.jpg";
export default function AuthButtons() {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const handleProfileClick = () => {
        switch (user?.role) {
            case "student":
                navigate("/profile"); // Profile.tsx
                break;
            case "parent":
                navigate("/profile/parent"); // ParentProfile.tsx
                break;
            case "teacher":
                navigate("/profile/teacher"); // TeacherProfile.tsx
                break;
            case "admin":
                navigate("/profile/admin"); // AdminProfile.tsx
                break;
            default:
                navigate("/profile");
        }
    };
    if (user) {
        return (_jsxs("div", { className: "creater__user text__content--size-18", children: [_jsxs("span", { className: "creater__user--color", children: [_jsx("b", { children: user.username }), " (", user.role, ")"] }), _jsx("div", { className: "avatar", onClick: () => setIsMenuOpen(!isMenuOpen), children: _jsx("img", { src: user?.avatar
                            ? user.avatar.startsWith("http")
                                ? user.avatar // ảnh full URL
                                : `http://localhost:5000/${user.avatar}` // ảnh từ backend (thêm base URL)
                            : avatar // ảnh mặc định
                        , alt: "avatar", className: "avatar-image", onError: (e) => (e.currentTarget.src = avatar) }) }), isMenuOpen && (_jsx("div", { className: "dropdown-menu", children: _jsxs("ul", { className: "dropdown-menu--list", children: [_jsx("li", { className: "dropdown-menu--list-item", onClick: handleProfileClick, children: "Th\u00F4ng tin c\u00E1 nh\u00E2n" }), user.role === "student" && (_jsxs(_Fragment, { children: [_jsx("li", { className: "dropdown-menu--list-item", onClick: () => navigate("/schedule"), children: "L\u1ECBch h\u1ECDc" }), _jsx("li", { className: "dropdown-menu--list-item", onClick: () => navigate("/tuition"), children: "H\u1ECDc ph\u00ED" })] })), user.role === "parent" && (_jsxs(_Fragment, { children: [_jsx("li", { className: "dropdown-menu--list-item", onClick: () => navigate("/children"), children: "Qu\u1EA3n l\u00FD con c\u00E1i" }), _jsx("li", { className: "dropdown-menu--list-item", onClick: () => navigate("/report"), children: "B\u00E1o c\u00E1o h\u1ECDc t\u1EADp" })] })), user.role === "teacher" && (_jsxs(_Fragment, { children: [_jsx("li", { className: "dropdown-menu--list-item", onClick: () => navigate("/profile/teacher/class"), children: "Qu\u1EA3n l\u00FD l\u1EDBp" }), _jsx("li", { className: "dropdown-menu--list-item", onClick: () => navigate("/profile/teacher/news"), children: "G\u1EEDi tin t\u1EE9c cho admin duy\u1EC7t" }), _jsx("li", { className: "dropdown-menu--list-item", onClick: () => navigate("/profile/teacher/scores"), children: "Nh\u1EADp \u0111i\u1EC3m" })] })), user.role === "admin" && _jsx(_Fragment, {}), _jsx("li", { className: "dropdown-menu--list-logout", onClick: logout, children: "\u0110\u0103ng xu\u1EA5t" })] }) }))] }));
    }
    return (_jsxs("div", { className: "creater__user", children: [_jsx("button", { className: "creater__user--btn text__content--size-18", onClick: () => navigate("/login"), children: "\u0110\u0103ng nh\u1EADp" }), _jsx("button", { className: "creater__user--btn text__content--size-18 border-register", onClick: () => navigate("/register"), children: "\u0110\u0103ng k\u00FD" })] }));
}
