import * as React from "react";

const ArrowLeftIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    width="11"
    height="18"
    viewBox="0 0 11 18"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props} // cho phép tuỳ biến className, style, v.v.
  >
    <path
      d="M10 1L2 9L10 17"
      stroke="#7D7D7D"
      strokeWidth={2}
      strokeLinecap="round"
    />
  </svg>
);

export default ArrowLeftIcon;
