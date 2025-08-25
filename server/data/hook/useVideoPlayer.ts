import { useRef, useState, useEffect } from "react";

const formatTime = (time: number) => {
  if (isNaN(time)) return "00:00";
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes < 10 ? "0" : ""}${minutes}:${
    seconds < 10 ? "0" : ""
  }${seconds}`;
};

export const useVideoPlayer = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showControls, setShowControls] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const loadedMeta = () => setDuration(video.duration);
    const updateProgress = () => {
      setCurrentTime(video.currentTime);
      setProgress((video.currentTime / video.duration) * 100);
    };

    video.addEventListener("loadedmetadata", loadedMeta);
    video.addEventListener("timeupdate", updateProgress);

    return () => {
      video.removeEventListener("loadedmetadata", loadedMeta);
      video.removeEventListener("timeupdate", updateProgress);
    };
  }, []);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const value = Number(e.target.value);
    video.currentTime = (value / 100) * video.duration;
    setProgress(value);
  };

  return {
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
  };
};
