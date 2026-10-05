"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

import { useLanguage } from "@/components/LanguageProvider";
import { authClient } from "@/lib/auth-client";

const translations = {
  en: {
    back: "← Back to login",
    badge: "Password recovery",
    title: "Forgot your password?",
    subtitle:
      "Enter your email address and we will send you a secure link to reset your password.",
    email: "Email address",
    send: "Send reset link",
    sending: "Sending...",
    successTitle: "Check your email",
    successMessage:
      "If an account exists for this email address, we sent a password reset link to:",
    successNote:
      "Please check your inbox and follow the link to choose a new password.",
    error:
      "We could not process your request. Please check your email address and try again.",
    login: "Back to login",
  },

  de: {
    back: "← Zurück zum Login",
    badge: "Passwort zurücksetzen",
    title: "Passwort vergessen?",
    subtitle:
      "Gib deine E-Mail-Adresse ein. Wir senden dir einen sicheren Link zum Zurücksetzen deines Passworts.",
    email: "E-Mail-Adresse",
    send: "Reset-Link senden",
    sending: "Wird gesendet...",
    successTitle: "E-Mail überprüfen",
    successMessage:
      "Falls ein Konto mit dieser E-Mail-Adresse existiert, haben wir einen Link zum Zurücksetzen des Passworts gesendet an:",
    successNote:
      "Bitte überprüfe deinen Posteingang und folge dem Link, um ein neues Passwort festzulegen.",
    error:
      "Die Anfrage konnte nicht verarbeitet werden. Bitte überprüfe deine E-Mail-Adresse und versuche es erneut.",
    login: "Zurück zum Login",
  },

  ar: {
    back: "→ العودة إلى تسجيل الدخول",
    badge: "استعادة كلمة المرور",
    title: "هل نسيت كلمة المرور؟",
    subtitle:
      "أدخل بريدك الإلكتروني وسنرسل لك رابطًا آمنًا لإعادة تعيين كلمة المرور.",
    email: "البريد الإلكتروني",
    send: "إرسال رابط إعادة التعيين",
    sending: "جارٍ الإرسال...",
    successTitle: "تحقق من بريدك الإلكتروني",
    successMessage:
      "إذا كان هناك حساب مرتبط بهذا البريد الإلكتروني، فقد أرسلنا رابطًا لإعادة تعيين كلمة المرور إلى:",
    successNote:
      "تحقق من صندوق الوارد واتبع الرابط لاختيار كلمة مرور جديدة.",
    error:
      "تعذر معالجة الطلب. يرجى التأكد من البريد الإلكتروني والمحاولة مرة أخرى.",
    login: "العودة إلى تسجيل الدخول",
  },
} as const;

export default function ForgotPasswordPage() {
  const { language } = useLanguage();

  const t = translations[language];

  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sentEmail, setSentEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const isArabic = language === "ar";

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setError(t.error);
      return;
    }

    setLoading(true);

    try {
      const result =
        await authClient.requestPasswordReset({
          email: normalizedEmail,
          redirectTo: `${window.location.origin}/reset-password`,
        });

      if (result.error) {
        setError(
          result.error.message || t.error
        );
        return;
      }

      setSentEmail(normalizedEmail);
    } catch {
      setError(t.error);
    } finally {
      setLoading(false);
    }
  }

  if (sentEmail) {
    return (
      <main
        dir={isArabic ? "rtl" : "ltr"}
        className="min-h-screen bg-[var(--background)] px-4 py-10 text-[var(--text-primary)] sm:px-6 sm:py-14 lg:py-20"
      >
        <div className="mx-auto flex min-h-[70vh] max-w-2xl items-center justify-center">
          <section className="w-full rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-7 text-center shadow-sm sm:p-10">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[var(--brand-soft)] text-4xl">
              ✉️
            </div>

            <p className="mt-7 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand)] sm:text-sm">
              {t.badge}
            </p>

            <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
              {t.successTitle}
            </h1>

            <p className="mx-auto mt-5 max-w-lg text-sm leading-7 text-[var(--text-secondary)] sm:text-base">
              {t.successMessage}
            </p>

            <p className="mt-3 break-all font-semibold text-[var(--brand-strong)]">
              {sentEmail}
            </p>

            <p className="mx-auto mt-5 max-w-lg text-sm leading-7 text-[var(--text-secondary)]">
              {t.successNote}
            </p>

            <Link
              href="/login"
              className="mt-8 inline-flex w-full items-center justify-center rounded-full bg-[var(--brand)] px-7 py-3.5 text-sm font-bold text-white transition hover:opacity-90 sm:w-auto"
            >
              {t.login}
            </Link>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main
      dir={isArabic ? "rtl" : "ltr"}
      className="min-h-screen bg-[var(--background)] px-4 py-10 text-[var(--text-primary)] sm:px-6 sm:py-14 lg:py-20"
    >
      <div className="mx-auto max-w-md">
        <Link
          href="/login"
          className="inline-flex items-center rounded-full border border-[var(--brand-soft)] bg-[var(--surface)] px-4 py-2 text-sm font-semibold text-[var(--brand-strong)] shadow-sm transition hover:bg-[var(--brand-soft)]"
        >
          {t.back}
        </Link>

        <section className="mt-8 rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm sm:mt-10 sm:p-8">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
              {t.badge}
            </p>

            <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
              {t.title}
            </h1>

            <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
              {t.subtitle}
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="mt-8 space-y-5"
          >
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-semibold"
              >
                {t.email}
              </label>

              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                autoComplete="email"
                required
                className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[var(--text-primary)] outline-none transition focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand-soft)]"
              />
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-600 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-400"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-[var(--brand)] px-7 py-3.5 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? t.sending : t.send}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}