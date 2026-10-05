"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

import { useLanguage } from "@/components/LanguageProvider";
import { authClient } from "@/lib/auth-client";

const translations = {
  en: {
    badge: "Password recovery",
    title: "Create a new password",
    subtitle:
      "Choose a new password for your JAN-GET account.",
    password: "New password",
    confirmPassword: "Confirm new password",
    showPassword: "Show password",
    hidePassword: "Hide password",
    reset: "Reset password",
    resetting: "Resetting password...",
    passwordLength:
      "Password must be at least 8 characters.",
    mismatch: "The passwords do not match.",
    invalidLink:
      "This password reset link is invalid or has expired. Please request a new one.",
    failed:
      "We could not reset your password. Please request a new reset link and try again.",
    successTitle: "Password updated",
    successMessage:
      "Your password has been changed successfully. You can now sign in with your new password.",
    login: "Go to login",
  },

  de: {
    badge: "Passwort zurücksetzen",
    title: "Neues Passwort erstellen",
    subtitle:
      "Wähle ein neues Passwort für dein JAN-GET-Konto.",
    password: "Neues Passwort",
    confirmPassword: "Neues Passwort bestätigen",
    showPassword: "Passwort anzeigen",
    hidePassword: "Passwort ausblenden",
    reset: "Passwort zurücksetzen",
    resetting: "Passwort wird zurückgesetzt...",
    passwordLength:
      "Das Passwort muss mindestens 8 Zeichen lang sein.",
    mismatch: "Die Passwörter stimmen nicht überein.",
    invalidLink:
      "Dieser Link zum Zurücksetzen des Passworts ist ungültig oder abgelaufen. Bitte fordere einen neuen Link an.",
    failed:
      "Das Passwort konnte nicht zurückgesetzt werden. Bitte fordere einen neuen Link an und versuche es erneut.",
    successTitle: "Passwort aktualisiert",
    successMessage:
      "Dein Passwort wurde erfolgreich geändert. Du kannst dich jetzt mit deinem neuen Passwort anmelden.",
    login: "Zum Login",
  },

  ar: {
    badge: "استعادة كلمة المرور",
    title: "إنشاء كلمة مرور جديدة",
    subtitle:
      "اختر كلمة مرور جديدة لحسابك في JAN-GET.",
    password: "كلمة المرور الجديدة",
    confirmPassword: "تأكيد كلمة المرور الجديدة",
    showPassword: "إظهار كلمة المرور",
    hidePassword: "إخفاء كلمة المرور",
    reset: "إعادة تعيين كلمة المرور",
    resetting: "جارٍ إعادة تعيين كلمة المرور...",
    passwordLength:
      "يجب أن تتكون كلمة المرور من 8 أحرف على الأقل.",
    mismatch: "كلمتا المرور غير متطابقتين.",
    invalidLink:
      "رابط إعادة تعيين كلمة المرور غير صالح أو انتهت صلاحيته. يرجى طلب رابط جديد.",
    failed:
      "تعذر إعادة تعيين كلمة المرور. يرجى طلب رابط جديد والمحاولة مرة أخرى.",
    successTitle: "تم تحديث كلمة المرور",
    successMessage:
      "تم تغيير كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول باستخدام كلمة المرور الجديدة.",
    login: "الانتقال إلى تسجيل الدخول",
  },
} as const;

export default function ResetPasswordPage() {
  const { language } = useLanguage();

  const t = translations[language];

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const isArabic = language === "ar";

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");

    const token = new URLSearchParams(
      window.location.search
    ).get("token");

    if (!token) {
      setError(t.invalidLink);
      return;
    }

    if (password.length < 8) {
      setError(t.passwordLength);
      return;
    }

    if (password !== confirmPassword) {
      setError(t.mismatch);
      return;
    }

    setLoading(true);

    try {
      const result = await authClient.resetPassword({
        newPassword: password,
        token,
      });

      if (result.error) {
        setError(
          result.error.message || t.failed
        );
        return;
      }

      setSuccess(true);
    } catch {
      setError(t.failed);
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <main
        dir={isArabic ? "rtl" : "ltr"}
        className="min-h-screen bg-[var(--background)] px-4 py-10 text-[var(--text-primary)] sm:px-6 sm:py-14 lg:py-20"
      >
        <div className="mx-auto flex min-h-[70vh] max-w-2xl items-center justify-center">
          <section className="w-full rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-7 text-center shadow-sm sm:p-10">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[var(--brand-soft)] text-4xl">
              ✓
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
        <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm sm:p-8">
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
            <PasswordField
              id="password"
              label={t.password}
              value={password}
              onChange={setPassword}
              visible={showPassword}
              onToggle={() =>
                setShowPassword((current) => !current)
              }
              showLabel={t.showPassword}
              hideLabel={t.hidePassword}
            />

            <PasswordField
              id="confirm-password"
              label={t.confirmPassword}
              value={confirmPassword}
              onChange={setConfirmPassword}
              visible={showConfirmPassword}
              onToggle={() =>
                setShowConfirmPassword((current) => !current)
              }
              showLabel={t.showPassword}
              hideLabel={t.hidePassword}
            />

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
              {loading ? t.resetting : t.reset}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}

type PasswordFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  visible: boolean;
  onToggle: () => void;
  showLabel: string;
  hideLabel: string;
};

function PasswordField({
  id,
  label,
  value,
  onChange,
  visible,
  onToggle,
  showLabel,
  hideLabel,
}: PasswordFieldProps) {
  const accessibilityLabel = visible
    ? hideLabel
    : showLabel;

  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-sm font-semibold"
      >
        {label}
      </label>

      <div className="relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) =>
            onChange(event.target.value)
          }
          autoComplete="new-password"
          required
          className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 pe-12 text-[var(--text-primary)] outline-none transition focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand-soft)]"
        />

        <button
          type="button"
          onClick={onToggle}
          aria-label={accessibilityLabel}
          title={accessibilityLabel}
          className="absolute end-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-[var(--text-secondary)] transition hover:bg-[var(--surface-soft)] hover:text-[var(--brand-strong)]"
        >
          {visible ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
    </div>
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
      <path d="M6.2 6.3C3.9 8 2.5 12 2.5 12s3.5 6 9.5 6-9.5-6-9.5-6" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    </svg>
  );
}