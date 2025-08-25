import React from "react";

interface DotsProps {
  total?: number; // số lượng dots, mặc định 5
  activeIndex?: number; // dot nào active (0-based)
}

export default function Dots({ total = 5, activeIndex = 0 }: DotsProps) {
  return (
    <div className="nav-dots">
      {Array.from({ length: total }).map((_, idx) => (
        <div
          key={idx}
          className={`nav-dots--items ${
            idx === activeIndex ? "dots--active" : ""
          }`}
        ></div>
      ))}
    </div>
  );
}
