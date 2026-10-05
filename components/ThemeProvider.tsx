"use client";

import {
  createContext,
  useContext,
  useEffect,
  useSyncExternalStore,
  type ReactNode,
} from "react";

type Theme = "light" | "dark" | "system";

type ThemeContextType = {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<
  ThemeContextType | undefined
>(undefined);

const SERVER_THEME: Theme = "light";

let currentTheme: Theme = SERVER_THEME;
let systemTheme: "light" | "dark" = "light";
let initialized = false;

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

function getThemeSnapshot() {
  return currentTheme;
}

function getServerThemeSnapshot() {
  return SERVER_THEME;
}

function notifyThemeChange() {
  listeners.forEach((listener) => {
    listener();
  });
}

function getSystemTheme(): "light" | "dark" {
  if (
    typeof window === "undefined" ||
    !window.matchMedia
  ) {
    return "light";
  }

  return window.matchMedia(
    "(prefers-color-scheme: dark)"
  ).matches
    ? "dark"
    : "light";
}

function initializeTheme() {
  if (
    initialized ||
    typeof window === "undefined"
  ) {
    return;
  }

  initialized = true;

  const savedTheme = localStorage.getItem("theme");

  if (
    savedTheme === "light" ||
    savedTheme === "dark" ||
    savedTheme === "system"
  ) {
    currentTheme = savedTheme;
  } else {
    currentTheme = "system";
  }

  systemTheme = getSystemTheme();

  notifyThemeChange();
}

function getResolvedTheme(): "light" | "dark" {
  return currentTheme === "system"
    ? systemTheme
    : currentTheme;
}

export function ThemeProvider({
  children,
}: {
  children: ReactNode;
}) {
  const theme = useSyncExternalStore(
    subscribe,
    getThemeSnapshot,
    getServerThemeSnapshot
  );

  const resolvedTheme = getResolvedTheme();

  useEffect(() => {
    initializeTheme();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const mediaQuery = window.matchMedia(
      "(prefers-color-scheme: dark)"
    );

    const handleSystemThemeChange = (
      event: MediaQueryListEvent
    ) => {
      systemTheme = event.matches
        ? "dark"
        : "light";

      if (currentTheme === "system") {
        notifyThemeChange();
      }
    };

    systemTheme = mediaQuery.matches
      ? "dark"
      : "light";

    mediaQuery.addEventListener(
      "change",
      handleSystemThemeChange
    );

    return () => {
      mediaQuery.removeEventListener(
        "change",
        handleSystemThemeChange
      );
    };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const activeTheme = getResolvedTheme();

    root.classList.toggle(
      "dark",
      activeTheme === "dark"
    );

    root.style.colorScheme = activeTheme;
  }, [theme, resolvedTheme]);

  const setTheme = (newTheme: Theme) => {
    currentTheme = newTheme;

    if (typeof window !== "undefined") {
      localStorage.setItem("theme", newTheme);
    }

    notifyThemeChange();
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        resolvedTheme,
        setTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error(
      "useTheme must be used inside ThemeProvider"
    );
  }

  return context;
}

export default ThemeProvider;