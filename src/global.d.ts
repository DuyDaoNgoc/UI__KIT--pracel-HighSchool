// Cho phép import file mp4, webm... trong TS
declare module "*.mp4" {
  const src: string;
  export default src;
}

// Fix JSX.Element lỗi undefined
declare namespace JSX {
  interface Element {}
}
