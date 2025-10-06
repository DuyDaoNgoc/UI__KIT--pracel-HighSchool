import React from "react";
import videohc from "../../../public/assets/videos/videoframe.mp4";
import { useVideoPlayer } from "./hook/useVideoPlayer";

const VideoFrame = ({
  list,
}: {
  list: { title: string; class?: string }[];
}) => {
  const {
    videoRef,
    isPlaying,
    togglePlay,
    progress,
    handleSeek,
    showControls,
    setShowControls,
    currentTime,
    duration,
    formatTime,
  } = useVideoPlayer();

  return (
    <>
      {list.map((item, idx) => (
        <section className="content__title section" key={idx}>
          <h2 className="text__content--large text--min">{item.title}</h2>

          <div
            className="main--video relative group"
            onMouseEnter={() => setShowControls(true)}
            onMouseLeave={() => setShowControls(false)}
          >
            <div className="position--video">
              <video
                ref={videoRef}
                className="w-full rounded-xl video-frame"
                onClick={togglePlay}
                data-aos="fade-up"
              >
                <source src={videohc} type="video/mp4" />
                Trình duyệt của bạn không hỗ trợ video.
              </video>
              {showControls && (
                <div className="video--items">
                  <button
                    onClick={togglePlay}
                    className="play--video text-white text-lg font-bold"
                  >
                    {isPlaying ? "⏸" : "▶"}
                  </button>
                  <div className="poniter flex items-center gap-2 flex-1">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={progress}
                      onChange={handleSeek}
                      className="flex-1 cursor-pointer"
                    />
                    <span className="text-white text-sm">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="scroll-down">
            <a href="#main">
              <svg
                width="18"
                height="9"
                viewBox="0 0 18 9"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M1 1.00488L9 7.67155L17 1"
                  stroke="white"
                  strokeWidth={2}
                  strokeLinecap="round"
                />
              </svg>
            </a>
          </div>
        </section>
      ))}
    </>
  );
};

export default VideoFrame;
