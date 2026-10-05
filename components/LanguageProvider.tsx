"use client";

import {
  createContext,
  useContext,
  useEffect,
  useSyncExternalStore,
  type ReactNode,
} from "react";

export type Language = "en" | "de" | "ar";

type LanguageContextType = {
  language: Language;
  setLanguage: (language: Language) => void;
};

const LanguageContext = createContext<
  LanguageContextType | undefined
>(undefined);

/*
 * German is the default language for first-time visitors.
 *
 * If the user has already selected another language, the value
 * saved in localStorage will be used instead.
 */
const SERVER_LANGUAGE: Language = "de";

let currentLanguage: Language = SERVER_LANGUAGE;

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

function getLanguageSnapshot() {
  return currentLanguage;
}

function getServerLanguageSnapshot() {
  return SERVER_LANGUAGE;
}

function notifyLanguageChange() {
  listeners.forEach((listener) => {
    listener();
  });
}

function isValidLanguage(
  value: string | null
): value is Language {
  return (
    value === "en" ||
    value === "de" ||
    value === "ar"
  );
}

function initializeLanguage() {
  if (typeof window === "undefined") {
    return;
  }

  const savedLanguage = localStorage.getItem("language");

  if (isValidLanguage(savedLanguage)) {
    currentLanguage = savedLanguage;
  } else {
    currentLanguage = SERVER_LANGUAGE;
  }

  notifyLanguageChange();
}

export function LanguageProvider({
  children,
}: {
  children: ReactNode;
}) {
  const language = useSyncExternalStore(
    subscribe,
    getLanguageSnapshot,
    getServerLanguageSnapshot
  );

  useEffect(() => {
    initializeLanguage();
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir =
      language === "ar" ? "rtl" : "ltr";
  }, [language]);

  const setLanguage = (newLanguage: Language) => {
    currentLanguage = newLanguage;

    if (typeof window !== "undefined") {
      localStorage.setItem("language", newLanguage);
    }

    notifyLanguageChange();
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error(
      "useLanguage must be used inside LanguageProvider"
    );
  }

  return context;
}