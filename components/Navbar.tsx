"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

import ThemeToggle from "./ThemeToggle";
import { useLanguage, type Language } from "./LanguageProvider";
import { translations } from "@/data/translations";
import { useCart } from "@/components/CartProvider";
import { authClient, useSession } from "@/lib/auth-client";

const navLinks = [
  { key: "home", href: "/" },
  { key: "shop", href: "/shop" },
  { key: "categories", href: "/#categories" },
  { key: "help", href: "/help" },
];
const languageOptions: {
  code: Language;
  label: string;
  flag: string;
}[] = [
  {
    code: "en",
    label: "English",
    flag: "/images/flags/GB.jpg",
  },
  {
    code: "de",
    label: "Deutsch",
    flag: "/images/flags/DE.jpg",
  },
  {
    code: "ar",
    label: "العربية",
    flag: "/images/flags/EG.jpg",
  },
];

const accountLabels: Record<Language, string> = {
  en: "My Account",
  de: "Mein Konto",
  ar: "حسابي",
};

const profileLabels: Record<Language, string> = {
  en: "View Profile",
  de: "Profil ansehen",
  ar: "عرض الملف الشخصي",
};

const ordersLabels: Record<Language, string> = {
  en: "View Orders",
  de: "Bestellungen ansehen",
  ar: "عرض الطلبات",
};

const logoutLabels: Record<Language, string> = {
  en: "Logout",
  de: "Abmelden",
  ar: "تسجيل الخروج",
};

const loginLabels: Record<Language, string> = {
  en: "Login",
  de: "Anmelden",
  ar: "تسجيل الدخول",
};

const registerLabels: Record<Language, string> = {
  en: "Register",
  de: "Registrieren",
  ar: "إنشاء حساب",
};

const appearanceLabels: Record<Language, string> = {
  en: "Appearance",
  de: "Darstellung",
  ar: "المظهر",
};

export default function Navbar() {
  const router = useRouter();

  const [menuOpen, setMenuOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // مهم: Ref منفصل للـ Desktop والـ Mobile
  const desktopAccountRef = useRef<HTMLDivElement>(null);
  const mobileAccountRef = useRef<HTMLDivElement>(null);

  const { language, setLanguage } = useLanguage();
  const { totalItems } = useCart();
  const { data: session } = useSession();

  const t = translations[language].navbar;

  const accountLabel = accountLabels[language];
  const loginLabel = loginLabels[language];
  const registerLabel = registerLabels[language];
  const appearanceLabel = appearanceLabels[language];

  const currentLanguage = languageOptions.find(
    (option) => option.code === language
  );

  const closeMenu = () => {
    setMenuOpen(false);
  };

  const handleLanguageChange = (newLanguage: Language) => {
    setLanguage(newLanguage);
    setLanguageOpen(false);
  };

  const closeAccountMenu = () => {
    setAccountOpen(false);
  };

  const handleLogout = async () => {
    if (loggingOut) return;

    setLoggingOut(true);
    setAccountOpen(false);
    setMenuOpen(false);

    try {
      await authClient.signOut();

      // مهم:
      // Navbar موجود داخل الـ layout وقد لا يتم عمل unmount له
      // لذلك يجب إعادة loggingOut إلى false بعد نجاح logout.
      setLoggingOut(false);

      router.push("/");
      router.refresh();
    } catch {
      setLoggingOut(false);
    }
  };

  useEffect(() => {
    if (!accountOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      const clickedInsideDesktop =
        desktopAccountRef.current?.contains(target);

      const clickedInsideMobile =
        mobileAccountRef.current?.contains(target);

      if (!clickedInsideDesktop && !clickedInsideMobile) {
        setAccountOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [accountOpen]);

  return (
    <nav className="sticky top-0 z-50 border-b bg-[var(--surface)]/95 backdrop-blur">
      <div className="mx-auto max-w-7xl px-3 py-3 sm:px-6 sm:py-4">

        {/* =========================================================
            DESKTOP
            ========================================================= */}
        <div className="hidden lg:flex lg:items-center">

          {/* BRAND */}
          <div className="flex shrink-0 items-center gap-3">
            <Link
              href="/"
              onClick={closeMenu}
              className="shrink-0"
              aria-label="JAN-GET Home"
            >
              <div
                className="h-16 w-10 bg-[var(--brand)]"
                style={{
                  maskImage: "url('/images/brand/logo.png')",
                  WebkitMaskImage:
                    "url('/images/brand/logo.png')",
                  maskRepeat: "no-repeat",
                  WebkitMaskRepeat: "no-repeat",
                  maskPosition: "center",
                  WebkitMaskPosition: "center",
                  maskSize: "contain",
                  WebkitMaskSize: "contain",
                }}
                aria-label="JAN-GET logo"
              />
            </Link>

            <Link
              href="/"
              onClick={closeMenu}
              className="shrink-0"
              aria-label="JAN-GET Home"
            >
              <div className="flex flex-col leading-none">
                <span className="whitespace-nowrap text-2xl font-black tracking-[0.12em] text-[var(--brand)]">
                  JAN-GET
                </span>

                <span className="mt-1 whitespace-nowrap text-[8px] font-medium uppercase tracking-[0.18em] text-[var(--brand)]">
                  3D Printed Creations
                </span>
              </div>
            </Link>
          </div>

          {/* NAVIGATION */}
          <div className="ml-8 flex min-w-0 flex-1 items-center justify-start gap-1 xl:ml-10 xl:gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.key}
                href={link.href}
                className="whitespace-nowrap rounded-full px-3 py-2 font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--brand-soft)] hover:text-[var(--brand)] xl:px-4"
              >
                {t[link.key as keyof typeof t]}
              </Link>
            ))}
          </div>

          {/* ACTIONS */}
          <div className="ml-4 flex shrink-0 items-center gap-2 xl:gap-3">

            {/* ACCOUNT */}
            {session?.user ? (
              <div
                ref={desktopAccountRef}
                className="relative shrink-0"
              >
                <button
                  type="button"
                  onClick={() =>
                    setAccountOpen((open) => !open)
                  }
                  aria-expanded={accountOpen}
                  aria-haspopup="menu"
                  className="flex h-10 min-w-[104px] items-center justify-center gap-2 whitespace-nowrap rounded-full bg-[var(--brand-soft)] px-4 text-sm font-semibold text-[var(--brand-strong)] transition hover:opacity-80"
                >
                  <span>{accountLabel}</span>

                  <span
                    className={`text-xs transition-transform ${
                      accountOpen ? "rotate-180" : ""
                    }`}
                  >
                    ⌄
                  </span>
                </button>

                {accountOpen && (
                  <div
                    className="absolute right-0 top-full z-[60] mt-2 w-56 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-2 shadow-xl"
                    role="menu"
                  >
                    <Link
                      href="/account"
                      onClick={closeAccountMenu}
                      className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-[var(--text-primary)] transition hover:bg-[var(--surface-soft)]"
                      role="menuitem"
                    >
                      <span className="text-base">👤</span>
                      <span>{profileLabels[language]}</span>
                    </Link>

                    <Link
                      href="/account/orders"
                      onClick={closeAccountMenu}
                      className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-[var(--text-primary)] transition hover:bg-[var(--surface-soft)]"
                      role="menuitem"
                    >
                      <span className="text-base">📦</span>
                      <span>{ordersLabels[language]}</span>
                    </Link>

                    <div className="my-1 border-t border-[var(--border)]" />

                    <button
                      type="button"
                      onClick={handleLogout}
                      disabled={loggingOut}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-red-950/30"
                      role="menuitem"
                    >
                      <span className="text-base">🚪</span>

                      <span>
                        {loggingOut
                          ? "..."
                          : logoutLabels[language]}
                      </span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="flex h-10 min-w-[76px] items-center justify-center whitespace-nowrap rounded-full bg-[var(--brand-soft)] px-4 text-sm font-semibold text-[var(--brand-strong)] transition hover:opacity-80"
                >
                  {loginLabel}
                </Link>

                <Link
                  href="/register"
                  className="flex h-10 min-w-[96px] items-center justify-center whitespace-nowrap rounded-full bg-[var(--brand-soft)] px-4 text-sm font-semibold text-[var(--brand-strong)] transition hover:opacity-80"
                >
                  {registerLabel}
                </Link>
              </>
            )}

            {/* DESKTOP LANGUAGE */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() =>
                  setLanguageOpen((open) => !open)
                }
                aria-expanded={languageOpen}
                aria-label={t.language}
                className="flex h-10 w-[86px] items-center justify-center gap-2 rounded-full bg-[var(--brand-soft)] px-3 text-sm font-semibold text-[var(--brand-strong)] transition hover:opacity-80"
              >
                {currentLanguage && (
                  <Image
                    src={currentLanguage.flag}
                    alt=""
                    width={24}
                    height={16}
                    className="h-4 w-6 shrink-0 rounded-sm object-cover"
                  />
                )}

                <span>{language.toUpperCase()}</span>

                <span className="shrink-0 text-xs leading-none">
                  ⌄
                </span>
              </button>

              {languageOpen && (
                <div className="absolute right-0 top-full z-50 mt-2 w-44 overflow-hidden rounded-2xl border bg-[var(--surface)] p-2 shadow-lg">
                  {languageOptions.map((option) => (
                    <button
                      key={option.code}
                      type="button"
                      onClick={() =>
                        handleLanguageChange(option.code)
                      }
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                        language === option.code
                          ? "bg-[var(--brand-soft)] font-semibold text-[var(--brand-strong)]"
                          : "text-[var(--text-primary)] hover:bg-[var(--surface-soft)]"
                      }`}
                    >
                      <Image
                        src={option.flag}
                        alt=""
                        width={24}
                        height={16}
                        className="h-4 w-6 rounded-sm object-cover"
                      />

                      <span>{option.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* THEME */}
            <div className="flex h-10 w-10 shrink-0 items-center justify-center">
              <ThemeToggle />
            </div>

            {/* CART */}
            <Link
              href="/cart"
              aria-label={t.cart}
              className="flex h-10 min-w-[104px] shrink-0 items-center justify-center gap-1 whitespace-nowrap rounded-full bg-[var(--brand-soft)] px-4 text-sm font-semibold text-[var(--brand-strong)] transition hover:opacity-80"
            >
              <span aria-hidden="true">🛍</span>

              <span>{t.cart}</span>

              {totalItems > 0 && (
                <span className="ml-1 inline-flex min-w-5 items-center justify-center rounded-full bg-[var(--brand)] px-1.5 py-0.5 text-xs font-bold text-white">
                  {totalItems}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* =========================================================
            MOBILE / TABLET
            ========================================================= */}
        <div className="flex min-w-0 items-center gap-2 lg:hidden">

          {/* MOBILE BRAND */}
          <Link
            href="/"
            onClick={closeMenu}
            className="flex min-w-0 shrink-0 flex-col leading-none"
            aria-label="JAN-GET Home"
          >
            <span className="whitespace-nowrap text-lg font-black tracking-[0.08em] text-[var(--brand)] sm:text-xl">
              JAN-GET
            </span>

            <span className="mt-1 whitespace-nowrap text-[7px] font-medium uppercase tracking-[0.13em] text-[var(--brand)] sm:text-[8px] sm:tracking-[0.18em]">
              3D Printed Creations
            </span>
          </Link>

          {/* MOBILE MENU */}
          <button
            type="button"
            onClick={() =>
              setMenuOpen((open) => !open)
            }
            aria-label={
              menuOpen ? "Close menu" : "Open menu"
            }
            aria-expanded={menuOpen}
            className="ml-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--brand-soft)] text-lg text-[var(--brand-strong)] transition hover:opacity-80 sm:h-10 sm:w-10 sm:text-xl"
          >
            {menuOpen ? "✕" : "☰"}
          </button>

          {/* MOBILE ACTIONS */}
          <div className="ml-auto flex min-w-0 shrink-0 items-center gap-1">

            {/* ACCOUNT / LOGIN */}
            {session?.user ? (
              <div
                ref={mobileAccountRef}
                className="relative shrink-0"
              >
                <button
                  type="button"
                  onClick={() =>
                    setAccountOpen((open) => !open)
                  }
                  aria-expanded={accountOpen}
                  aria-haspopup="menu"
                  className="flex h-9 max-w-[110px] items-center justify-center gap-1.5 overflow-hidden whitespace-nowrap rounded-full bg-[var(--brand-soft)] px-2.5 text-xs font-semibold text-[var(--brand-strong)] transition hover:opacity-80 sm:h-10 sm:max-w-none sm:px-3 sm:text-sm"
                >
                  <span className="truncate">
                    {accountLabel}
                  </span>

                  <span
                    className={`shrink-0 text-[10px] transition-transform ${
                      accountOpen ? "rotate-180" : ""
                    }`}
                  >
                    ⌄
                  </span>
                </button>

                {accountOpen && (
                  <div
                    className="absolute right-0 top-full z-[60] mt-2 w-52 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-2 shadow-xl"
                    role="menu"
                  >
                    <Link
                      href="/account"
                      onClick={closeAccountMenu}
                      className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-[var(--text-primary)] transition hover:bg-[var(--surface-soft)]"
                      role="menuitem"
                    >
                      <span>👤</span>
                      <span>{profileLabels[language]}</span>
                    </Link>

                    <Link
                      href="/account/orders"
                      onClick={closeAccountMenu}
                      className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-[var(--text-primary)] transition hover:bg-[var(--surface-soft)]"
                      role="menuitem"
                    >
                      <span>📦</span>
                      <span>{ordersLabels[language]}</span>
                    </Link>

                    <div className="my-1 border-t border-[var(--border)]" />

                    <button
                      type="button"
                      onClick={handleLogout}
                      disabled={loggingOut}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-red-950/30"
                      role="menuitem"
                    >
                      <span>🚪</span>

                      <span>
                        {loggingOut
                          ? "..."
                          : logoutLabels[language]}
                      </span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="flex h-9 items-center justify-center whitespace-nowrap rounded-full bg-[var(--brand-soft)] px-2.5 text-xs font-semibold text-[var(--brand-strong)] transition hover:opacity-80 sm:h-10 sm:px-3 sm:text-sm"
              >
                {loginLabel}
              </Link>
            )}

            {/* MOBILE LANGUAGE */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() =>
                  setLanguageOpen((open) => !open)
                }
                aria-expanded={languageOpen}
                aria-label={t.language}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--brand-soft)] text-[var(--brand-strong)] transition hover:opacity-80 sm:h-10 sm:w-10"
              >
                {currentLanguage && (
                  <Image
                    src={currentLanguage.flag}
                    alt=""
                    width={24}
                    height={16}
                    className="h-4 w-6 rounded-sm object-cover"
                  />
                )}
              </button>

              {languageOpen && (
                <div className="absolute right-0 top-full z-50 mt-2 w-44 overflow-hidden rounded-2xl border bg-[var(--surface)] p-2 shadow-lg">
                  {languageOptions.map((option) => (
                    <button
                      key={option.code}
                      type="button"
                      onClick={() =>
                        handleLanguageChange(option.code)
                      }
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                        language === option.code
                          ? "bg-[var(--brand-soft)] font-semibold text-[var(--brand-strong)]"
                          : "text-[var(--text-primary)] hover:bg-[var(--surface-soft)]"
                      }`}
                    >
                      <Image
                        src={option.flag}
                        alt=""
                        width={24}
                        height={16}
                        className="h-4 w-6 rounded-sm object-cover"
                      />

                      <span>{option.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* MOBILE CART */}
            <Link
              href="/cart"
              aria-label={t.cart}
              className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--brand-soft)] text-[var(--brand-strong)] transition hover:opacity-80 sm:h-10 sm:w-10"
            >
              <span aria-hidden="true">🛍</span>

              {totalItems > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--brand)] px-1 text-[10px] font-bold text-white">
                  {totalItems}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>

      {/* MOBILE / TABLET MENU */}
      {menuOpen && (
        <div className="border-t bg-[var(--surface)] px-4 py-4 lg:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-2">

            {navLinks.map((link) => (
              <Link
                key={link.key}
                href={link.href}
                onClick={closeMenu}
                className="rounded-2xl px-4 py-3 font-medium text-[var(--text-primary)] transition hover:bg-[var(--surface-soft)] hover:text-[var(--brand)]"
              >
                {t[link.key as keyof typeof t]}
              </Link>
            ))}

            {!session?.user && (
              <Link
                href="/register"
                onClick={closeMenu}
                className="mt-2 flex items-center justify-center rounded-2xl bg-[var(--brand)] px-5 py-3.5 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:opacity-90"
              >
                {registerLabel}
              </Link>
            )}

            {/* MOBILE THEME */}
            <div className="mt-2 flex items-center justify-between rounded-2xl bg-[var(--surface-soft)] px-4 py-3">
              <span className="font-medium text-[var(--text-primary)]">
                {appearanceLabel}
              </span>

              <ThemeToggle />
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}