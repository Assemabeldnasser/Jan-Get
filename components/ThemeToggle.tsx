"use client";

import { useTheme } from "./ThemeProvider";

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() =>
        setTheme(isDark ? "light" : "dark")
      }
      aria-label={
        isDark
          ? "Switch to light mode"
          : "Switch to dark mode"
      }
      className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f4d7e1] text-lg text-[#7d5262] transition hover:bg-[#ecc4d2] dark:bg-[#4a333d] dark:text-[#f9dce7] dark:hover:bg-[#5a3f4a]"
    >
      {isDark ? "☀️" : "🌙"}
    </button>
  );
}