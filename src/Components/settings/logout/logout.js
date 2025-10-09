import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useAuth } from "../../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import LogoutIcon from "../../../icons/LogoutIcon";
export default function Logout() {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const handleLogout = () => {
        logout();
        navigate("/login");
    };
    return (_jsx("ul", { className: "radius__flex", children: _jsxs("li", { className: "dropdown-menu--list-logout radius__flex", onClick: handleLogout, children: [_jsx(LogoutIcon, {}), " \u0110\u0103ng xu\u1EA5t"] }) }));
}
