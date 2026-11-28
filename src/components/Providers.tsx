"use client";

import { Toast } from "@heroui/react";
import { MotionConfig } from "framer-motion";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user" transition={{ type: "spring", stiffness: 380, damping: 32 }}>
      {children}
      <Toast.Provider />
    </MotionConfig>
  );
}
