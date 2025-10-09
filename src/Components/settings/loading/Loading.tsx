import React from "react";
import loadingGif from "../../../../public/assets/imgs/loading/loading1.gif";

const Loading: React.FC = () => (
  <div className="loading-overlay">
    <img src={loadingGif} alt="Loading..." className="loading-gif" />
  </div>
);

export default Loading;
