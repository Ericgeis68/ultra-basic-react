import { Toaster } from "@/components/ui/toaster";
import React from "react";

export function ToastProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster />
    </>
  );
}
