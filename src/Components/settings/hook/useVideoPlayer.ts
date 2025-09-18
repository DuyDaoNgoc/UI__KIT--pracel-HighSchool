import { useRef, useState, useEffect } from "react";

// tạo hàm formatTime để định dạng thời gian từ giây sang mm:ss
const formatTime = (time: number) => {
  // nếu time không phải số thì trả về 00:00
  if (isNaN(time)) return "00:00";
  // tính phút và giây
  // tạo phút bằng cách chia time cho 60 và làm tròn xuống
  const minutes = Math.floor(time / 60);
  // tạo giây bằng cách lấy phần dư của time chia cho 60 và làm tròn xuống
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
    // tay video hiện tại để thêm sự kiện event listener vào video element
    const video = videoRef.current;
    // nếu video null thì không làm gì
    if (!video) return;
    // load metadata để lấy duration
    const loadedMeta = () => setDuration(video.duration);
    // cập nhật tiến độ và thời gian hiện tại của video
    const updateProgress = () => {
      // set thời gian hiện tại của video
      setCurrentTime(video.currentTime);
      // set progress theo phần trăm (0-100) để dễ dùng với input range
      setProgress((video.currentTime / video.duration) * 100);
    };
    // video có thể null nên cần kiểm tra
    // add sự kiện loadedmetadata để lấy duration khi video load xong
    video.addEventListener("loadedmetadata", loadedMeta);
    // add sự kiện timeupdate để cập nhật tiến độ khi video phát
    video.addEventListener("timeupdate", updateProgress);
    // trả về hàm cleanup để tránh rò rỉ bộ nhớ
    return () => {
      // remove sự kiện khi component unmount hoặc video thay đổi
      video.removeEventListener("loadedmetadata", loadedMeta);
      // remove sự kiện timeupdate khi component unmount hoặc video thay đổi
      video.removeEventListener("timeupdate", updateProgress);
    };
  }, []);

  // Xử lý khi người dùng kéo thanh tiến độ
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    // video có thể null nên cần kiểm tra
    const video = videoRef.current;
    // nếu video null thì không làm gì
    if (!video) return;
    // lấy giá trị từ input (0-100)
    const value = Number(e.target.value);
    video.currentTime = (value / 100) * video.duration;
    // set progress để cập nhật giao diện ngay lập tức không cần chờ sự kiện timeupdate
    setProgress(value);
  };

  // Trả về các giá trị và hàm cần thiết cho video player
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
