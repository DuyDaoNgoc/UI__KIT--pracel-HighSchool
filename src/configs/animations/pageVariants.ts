// src/configs/animations/pageVariants.ts
import type { Variants } from "framer-motion";

/**
 * Professional page variants:
 * - Không có x/y translate (không đẩy sang trái/phải).
 * - Vào dùng spring nhẹ để "pop" tự nhiên.
 * - Thoát dùng fade + tiny scale để mượt.
 */
export const pageVariants: Record<string, Variants> = {
  fade: {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: {
        duration: 0.45,
        ease: [0.22, 1, 0.36, 1], // mềm, hơi nhanh ở cuối
      },
    },
    exit: {
      opacity: 0,
      transition: {
        duration: 0.35,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  },

  // Zoom nhẹ, chuyên nghiệp: bắt đầu hơi nhỏ -> pop bằng spring
  zoom: {
    initial: { opacity: 0, scale: 0.985 },
    animate: {
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring", // natural movement
        stiffness: 220, // controls "snappiness"
        damping: 26, // controls "settling"
        mass: 1,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.992, // very slight shrink on exit (keeps edges stable)
      transition: {
        duration: 0.28,
        ease: "easeInOut",
      },
    },
  },
};
