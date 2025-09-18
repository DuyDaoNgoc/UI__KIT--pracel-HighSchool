import React from "react";
import { useAuth } from "../../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import LogoutIcon from "../../../icons/LogoutIcon";
export default function Logout() {
  const { logout } = useAuth() as { logout: () => void };
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <ul className="radius__flex">
      <li
        className="dropdown-menu--list-logout radius__flex"
        onClick={handleLogout}
      >
        <LogoutIcon /> Đăng xuất
      </li>
    </ul>
  );
}
// Note: Ensure that the CSS class "dropdown-menu--list-logout" is styled appropriately in your stylesheet.
