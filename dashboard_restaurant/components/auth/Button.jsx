"use client";

export default function Button({ children, className = "", ...props }) {
  return (
    <button
      className={`inline-flex h-12 items-center justify-center rounded-lg bg-[#77A9AD] px-6 text-white font-medium hover:opacity-95 active:opacity-90 disabled:opacity-50 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}