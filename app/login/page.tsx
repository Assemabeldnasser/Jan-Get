"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { useLanguage } from "@/components/LanguageProvider";
import { authClient } from "@/lib/auth-client";

const translations = {
  en: {
    back: "← Back to home",
    title: "Welcome back",
    subtitle: "Sign in to continue to your JAN-GET account.",
    email: "Email address",
    password: "Password",
    showPassword: "Show password",
    hidePassword: "Hide password",
    login: "Sign in",
    loggingIn: "Signing in...",
    noAccount: "Don't have an account?",
    register: "Create an account",
    forgot: "Forgot your password?",
    verification:
      "Please verify your email address before signing in.",
    resendVerification: "Resend verification email",
    resendingVerification:
      "Sending verification email...",
    verificationSent:
      "Verification email sent. Please check your inbox.",
    invalid: "Invalid email or password.",
    success: "Signed in successfully.",
  },

  de: {
    back: "← Zurück zur Startseite",
    title: "Willkommen zurück",
    subtitle:
      "Melde dich an, um mit deinem JAN-GET-Konto fortzufahren.",
    email: "E-Mail-Adresse",
    password: "Passwort",
    showPassword: "Passwort anzeigen",
    hidePassword: "Passwort ausblenden",
    login: "Anmelden",
    loggingIn: "Anmeldung läuft...",
    noAccount: "Noch kein Konto?",
    register: "Konto erstellen",
    forgot: "Passwort vergessen?",
    verification:
      "Bitte bestätige deine E-Mail-Adresse, bevor du dich anmeldest.",
    resendVerification:
      "Bestätigungs-E-Mail erneut senden",
    resendingVerification:
      "Bestätigungs-E-Mail wird gesendet...",
    verificationSent:
      "Die Bestätigungs-E-Mail wurde gesendet. Bitte überprüfe deinen Posteingang.",
    invalid: "E-Mail-Adresse oder Passwort ist ungültig.",
    success: "Erfolgreich angemeldet.",
  },

  ar: {
    back: "→ العودة إلى الرئيسية",
    title: "مرحبًا بعودتك",
    subtitle:
      "سجّل الدخول للمتابعة إلى حسابك في JAN-GET.",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    showPassword: "إظهار كلمة المرور",
    hidePassword: "إخفاء كلمة المرور",
    login: "تسجيل الدخول",
    loggingIn: "جارٍ تسجيل الدخول...",
    noAccount: "ليس لديك حساب؟",
    register: "إنشاء حساب",
    forgot: "هل نسيت كلمة المرور؟",
    verification:
      "يرجى تأكيد بريدك الإلكتروني قبل تسجيل الدخول.",
    resendVerification:
      "إعادة إرسال رسالة تأكيد البريد الإلكتروني",
    resendingVerification:
      "جارٍ إرسال رسالة تأكيد البريد الإلكتروني...",
    verificationSent:
      "تم إرسال رسالة تأكيد البريد الإلكتروني. يرجى التحقق من بريدك الوارد.",
    invalid:
      "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
    success: "تم تسجيل الدخول بنجاح.",
  },
} as const;

export default function LoginPage() {
  const { language } = useLanguage();
  const router = useRouter();

  const t = translations[language];

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [verificationRequired, setVerificationRequired] =
    useState(false);

  const [resendingVerification, setResendingVerification] =
    useState(false);

  const [verificationSent, setVerificationSent] =
    useState(false);

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");
    setVerificationRequired(false);
    setVerificationSent(false);
    setLoading(true);

    try {
      const normalizedEmail = email.trim().toLowerCase();

      const result = await authClient.signIn.email({
        email: normalizedEmail,
        password,
      });

      if (result.error) {
        const errorCode =
          result.error.code?.toString().toUpperCase() ?? "";

        const message =
          result.error.message?.toLowerCase() ?? "";

        const emailNotVerified =
          errorCode === "EMAIL_NOT_VERIFIED" ||
          message.includes("verify") ||
          message.includes("verification") ||
          message.includes("email not verified");

        if (emailNotVerified) {
          setError(t.verification);
          setVerificationRequired(true);
        } else {
          setError(t.invalid);
        }

        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError(t.invalid);
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setError(t.invalid);
      return;
    }

    setError("");
    setVerificationSent(false);
    setResendingVerification(true);

    try {
      const result =
        await authClient.sendVerificationEmail({
          email: normalizedEmail,
          callbackURL: "/login",
        });

      if (result.error) {
        setError(
          result.error.message || t.verification
        );
        return;
      }

      setVerificationSent(true);
    } catch {
      setError(t.verification);
    } finally {
      setResendingVerification(false);
    }
  };

  return (
    <main
      dir={language === "ar" ? "rtl" : "ltr"}
      className="min-h-screen bg-[var(--background)] px-4 py-10 text-[var(--text-primary)] sm:px-6 sm:py-14 lg:py-20"
    >
      <div className="mx-auto max-w-md">
        <Link
          href="/"
          className="inline-flex items-center rounded-full border border-[var(--brand-soft)] bg-[var(--surface)] px-4 py-2 text-sm font-semibold text-[var(--brand-strong)] shadow-sm transition hover:bg-[var(--brand-soft)]"
        >
          {t.back}
        </Link>

        <div className="mt-8 rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm sm:mt-10 sm:p-8">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
              JAN-GET
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

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-semibold"
              >
                {t.password}
              </label>

              <div className="relative">
                <input
                  id="password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  autoComplete="current-password"
                  required
                  className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 pe-12 text-[var(--text-primary)] outline-none transition focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand-soft)]"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      (current) => !current
                    )
                  }
                  aria-label={
                    showPassword
                      ? t.hidePassword
                      : t.showPassword
                  }
                  title={
                    showPassword
                      ? t.hidePassword
                      : t.showPassword
                  }
                  className="absolute end-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-[var(--text-secondary)] transition hover:bg-[var(--surface-soft)] hover:text-[var(--brand-strong)]"
                >
                  {showPassword ? (
                    <EyeOffIcon />
                  ) : (
                    <EyeIcon />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-600 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-400"
              >
                {error}
              </div>
            )}

            {verificationSent && (
              <div
                role="status"
                className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm leading-6 text-green-700 dark:border-green-900/40 dark:bg-green-950/20 dark:text-green-400"
              >
                {t.verificationSent}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-[var(--brand)] px-7 py-3.5 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? t.loggingIn : t.login}
            </button>

            {verificationRequired && (
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={resendingVerification}
                className="w-full rounded-full border border-[var(--brand)] bg-transparent px-7 py-3.5 text-sm font-bold text-[var(--brand-strong)] transition hover:bg-[var(--brand-soft)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {resendingVerification
                  ? t.resendingVerification
                  : t.resendVerification}
              </button>
            )}
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/forgot-password"
              className="text-sm font-semibold text-[var(--brand-strong)] hover:underline"
            >
              {t.forgot}
            </Link>
          </div>

          <div className="my-6 border-t border-[var(--border)]" />

          <p className="text-center text-sm text-[var(--text-secondary)]">
            {t.noAccount}{" "}
            <Link
              href="/register"
              className="font-bold text-[var(--brand-strong)] hover:underline"
            >
              {t.register}
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

function EyeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="m3 3 18 18" />
      <path d="M10.6 6.2A9.7 9.7 0 0 1 12 6c6 0 9.5 6 9.5 6a16.8 16.8 0 0 1-3.2 3.7" />
      <path d="M6.2 6.3C3.9 8 2.5 12 2.5 12s3.5 6 9.5 6c1.2 0 2.3-.2 3.3-.6" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    </svg>
  );
}
