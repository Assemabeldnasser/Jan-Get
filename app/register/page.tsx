"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

import { useLanguage } from "@/components/LanguageProvider";
import { authClient } from "@/lib/auth-client";

type Language = "en" | "de" | "ar";

type RegisterTranslations = {
  badge: string;
  title: string;
  subtitle: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  apartment: string;
  apartmentOptional: string;
  postalCode: string;
  city: string;
  country: string;
  password: string;
  confirmPassword: string;
  showPassword: string;
  hidePassword: string;
  createAccount: string;
  creatingAccount: string;
  alreadyHaveAccount: string;
  signIn: string;
  required: string;
  passwordMismatch: string;
  passwordLength: string;
  emailAlreadyRegistered: string;
  registrationFailed: string;
  verificationTitle: string;
  verificationMessage: string;
  verificationEmail: string;
  backToLogin: string;
};

const translations: Record<Language, RegisterTranslations> = {
  en: {
    badge: "Create your account",
    title: "Join JAN-GET",
    subtitle:
      "Create your account to manage your profile, orders, and future purchases.",
    firstName: "First name",
    lastName: "Last name",
    email: "Email address",
    phone: "Phone number",
    address: "Street and house number",
    apartment: "Apartment / additional address",
    apartmentOptional: "Optional",
    postalCode: "Postal code",
    city: "City",
    country: "Country",
    password: "Password",
    confirmPassword: "Confirm password",
    showPassword: "Show password",
    hidePassword: "Hide password",
    createAccount: "Create account",
    creatingAccount: "Creating account...",
    alreadyHaveAccount: "Already have an account?",
    signIn: "Sign in",
    required: "This field is required.",
    passwordMismatch: "The passwords do not match.",
    passwordLength: "Password must be at least 8 characters.",
    emailAlreadyRegistered:
      "This email address is already registered. Please sign in instead.",
    registrationFailed:
      "We could not create your account. Please check your information and try again.",
    verificationTitle: "Check your email",
    verificationMessage:
      "Your account was created successfully. We sent a verification link to:",
    verificationEmail:
      "Please verify your email address before signing in.",
    backToLogin: "Go to login",
  },

  de: {
    badge: "Konto erstellen",
    title: "Willkommen bei JAN-GET",
    subtitle:
      "Erstelle dein Konto, um dein Profil, deine Bestellungen und zukünftige Einkäufe zu verwalten.",
    firstName: "Vorname",
    lastName: "Nachname",
    email: "E-Mail-Adresse",
    phone: "Telefonnummer",
    address: "Straße und Hausnummer",
    apartment: "Wohnung / zusätzliche Adresse",
    apartmentOptional: "Optional",
    postalCode: "Postleitzahl",
    city: "Stadt",
    country: "Land",
    password: "Passwort",
    confirmPassword: "Passwort bestätigen",
    showPassword: "Passwort anzeigen",
    hidePassword: "Passwort ausblenden",
    createAccount: "Konto erstellen",
    creatingAccount: "Konto wird erstellt...",
    alreadyHaveAccount: "Du hast bereits ein Konto?",
    signIn: "Anmelden",
    required: "Dieses Feld ist erforderlich.",
    passwordMismatch: "Die Passwörter stimmen nicht überein.",
    passwordLength:
      "Das Passwort muss mindestens 8 Zeichen lang sein.",
    emailAlreadyRegistered:
      "Diese E-Mail-Adresse ist bereits registriert. Bitte melde dich stattdessen an.",
    registrationFailed:
      "Das Konto konnte nicht erstellt werden. Bitte überprüfe deine Angaben und versuche es erneut.",
    verificationTitle: "E-Mail überprüfen",
    verificationMessage:
      "Dein Konto wurde erfolgreich erstellt. Wir haben einen Bestätigungslink gesendet an:",
    verificationEmail:
      "Bitte bestätige deine E-Mail-Adresse, bevor du dich anmeldest.",
    backToLogin: "Zum Login",
  },

  ar: {
    badge: "إنشاء حساب",
    title: "انضم إلى JAN-GET",
    subtitle:
      "أنشئ حسابك لإدارة بياناتك وطلباتك وعمليات الشراء المستقبلية.",
    firstName: "الاسم الأول",
    lastName: "اسم العائلة",
    email: "البريد الإلكتروني",
    phone: "رقم الهاتف",
    address: "الشارع ورقم المنزل",
    apartment: "رقم الشقة / عنوان إضافي",
    apartmentOptional: "اختياري",
    postalCode: "الرمز البريدي",
    city: "المدينة",
    country: "الدولة",
    password: "كلمة المرور",
    confirmPassword: "تأكيد كلمة المرور",
    showPassword: "إظهار كلمة المرور",
    hidePassword: "إخفاء كلمة المرور",
    createAccount: "إنشاء الحساب",
    creatingAccount: "جارٍ إنشاء الحساب...",
    alreadyHaveAccount: "لديك حساب بالفعل؟",
    signIn: "تسجيل الدخول",
    required: "هذا الحقل مطلوب.",
    passwordMismatch: "كلمتا المرور غير متطابقتين.",
    passwordLength:
      "يجب أن تتكون كلمة المرور من 8 أحرف على الأقل.",
    emailAlreadyRegistered:
      "هذا البريد الإلكتروني مسجل بالفعل. يرجى تسجيل الدخول بدلًا من إنشاء حساب جديد.",
    registrationFailed:
      "تعذر إنشاء الحساب. يرجى مراجعة البيانات والمحاولة مرة أخرى.",
    verificationTitle: "تحقق من بريدك الإلكتروني",
    verificationMessage:
      "تم إنشاء حسابك بنجاح. أرسلنا رابط التحقق إلى:",
    verificationEmail:
      "يرجى تأكيد بريدك الإلكتروني قبل تسجيل الدخول.",
    backToLogin: "الانتقال إلى تسجيل الدخول",
  },
};

export default function RegisterPage() {
  const { language } = useLanguage();

  const t = translations[language];

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [apartment, setApartment] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");

  const isArabic = language === "ar";

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");

    const normalizedFirstName = firstName.trim();
    const normalizedLastName = lastName.trim();
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPhone = phone.trim();
    const normalizedAddress = address.trim();
    const normalizedApartment = apartment.trim();
    const normalizedPostalCode = postalCode.trim();
    const normalizedCity = city.trim();

    if (
      !normalizedFirstName ||
      !normalizedLastName ||
      !normalizedEmail ||
      !normalizedPhone ||
      !normalizedAddress ||
      !normalizedPostalCode ||
      !normalizedCity
    ) {
      setError(t.required);
      return;
    }

    if (password.length < 8) {
      setError(t.passwordLength);
      return;
    }

    if (password !== confirmPassword) {
      setError(t.passwordMismatch);
      return;
    }

    setIsLoading(true);

    try {
      const result = await authClient.signUp.email({
        email: normalizedEmail,
        password,
        name: `${normalizedFirstName} ${normalizedLastName}`.trim(),
        firstName: normalizedFirstName,
        lastName: normalizedLastName,
        phone: normalizedPhone,
        address: normalizedAddress,
        apartment: normalizedApartment,
        postalCode: normalizedPostalCode,
        city: normalizedCity,
        country: "Germany",
      });

      if (result.error) {
        const errorCode =
          result.error.code?.toString().toUpperCase() ?? "";

        const errorMessage =
          result.error.message?.toLowerCase() ?? "";

        if (
          errorCode === "USER_ALREADY_EXISTS" ||
          errorCode === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL" ||
          errorMessage.includes("user already exists") ||
          errorMessage.includes("already registered")
        ) {
          setError(t.emailAlreadyRegistered);
        } else {
          setError(
            result.error.message || t.registrationFailed
          );
        }

        return;
      }

      setRegisteredEmail(normalizedEmail);
    } catch {
      setError(t.registrationFailed);
    } finally {
      setIsLoading(false);
    }
  }

  if (registeredEmail) {
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
              JAN-GET
            </p>

            <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
              {t.verificationTitle}
            </h1>

            <p className="mx-auto mt-5 max-w-lg text-sm leading-7 text-[var(--text-secondary)] sm:text-base">
              {t.verificationMessage}
            </p>

            <p className="mt-3 break-all font-semibold text-[var(--brand-strong)]">
              {registeredEmail}
            </p>

            <p className="mx-auto mt-5 max-w-lg text-sm leading-7 text-[var(--text-secondary)]">
              {t.verificationEmail}
            </p>

            <Link
              href="/login"
              className="mt-8 inline-flex w-full items-center justify-center rounded-full bg-[var(--brand)] px-7 py-3.5 text-sm font-bold text-white transition hover:opacity-90 sm:w-auto"
            >
              {t.backToLogin}
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
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand)] sm:text-sm">
            {t.badge}
          </p>

          <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
            {t.title}
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[var(--text-secondary)] sm:text-base">
            {t.subtitle}
          </p>
        </div>

        <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm sm:p-9 lg:p-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                label={t.firstName}
                value={firstName}
                onChange={setFirstName}
                required
                autoComplete="given-name"
              />

              <Field
                label={t.lastName}
                value={lastName}
                onChange={setLastName}
                required
                autoComplete="family-name"
              />

              <Field
                label={t.email}
                value={email}
                onChange={setEmail}
                required
                type="email"
                autoComplete="email"
              />

              <Field
                label={t.phone}
                value={phone}
                onChange={setPhone}
                required
                type="tel"
                autoComplete="tel"
              />

              <div className="sm:col-span-2">
                <Field
                  label={t.address}
                  value={address}
                  onChange={setAddress}
                  required
                  autoComplete="street-address"
                />
              </div>

              <Field
                label={t.apartment}
                hint={t.apartmentOptional}
                value={apartment}
                onChange={setApartment}
                autoComplete="address-line2"
              />

              <Field
                label={t.postalCode}
                value={postalCode}
                onChange={setPostalCode}
                required
                autoComplete="postal-code"
              />

              <Field
                label={t.city}
                value={city}
                onChange={setCity}
                required
                autoComplete="address-level2"
              />

              <div className="flex flex-col justify-end">
                <label className="mb-2 block text-sm font-semibold">
                  {t.country}
                </label>

                <div className="flex h-12 items-center rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 text-sm font-semibold">
                  Germany
                </div>
              </div>

              <PasswordField
                label={t.password}
                value={password}
                onChange={setPassword}
                required
                autoComplete="new-password"
                visible={showPassword}
                onToggle={() =>
                  setShowPassword((current) => !current)
                }
                showLabel={t.showPassword}
                hideLabel={t.hidePassword}
              />

              <PasswordField
                label={t.confirmPassword}
                value={confirmPassword}
                onChange={setConfirmPassword}
                required
                autoComplete="new-password"
                visible={showConfirmPassword}
                onToggle={() =>
                  setShowConfirmPassword((current) => !current)
                }
                showLabel={t.showPassword}
                hideLabel={t.hidePassword}
              />
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium leading-6 text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-400"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-full bg-[var(--brand)] px-7 py-4 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 sm:text-base"
            >
              {isLoading
                ? t.creatingAccount
                : t.createAccount}
            </button>

            <div className="border-t border-[var(--border)] pt-6 text-center text-sm text-[var(--text-secondary)]">
              {t.alreadyHaveAccount}{" "}
              <Link
                href="/login"
                className="font-bold text-[var(--brand-strong)] underline-offset-4 hover:underline"
              >
                {t.signIn}
              </Link>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}

type FieldProps = {
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: string;
  autoComplete?: string;
};

function Field({
  label,
  hint,
  value,
  onChange,
  required = false,
  type = "text",
  autoComplete,
}: FieldProps) {
  return (
    <div>
      <label className="mb-2 flex items-center gap-2 text-sm font-semibold">
        <span>{label}</span>

        {hint && (
          <span className="font-normal text-[var(--text-muted)]">
            ({hint})
          </span>
        )}
      </label>

      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        autoComplete={autoComplete}
        className="h-12 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand-soft)]"
      />
    </div>
  );
}

type PasswordFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  autoComplete?: string;
  visible: boolean;
  onToggle: () => void;
  showLabel: string;
  hideLabel: string;
};

function PasswordField({
  label,
  value,
  onChange,
  required = false,
  autoComplete,
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
      <label className="mb-2 block text-sm font-semibold">
        {label}
      </label>

      <div className="relative">
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          required={required}
          autoComplete={autoComplete}
          className="h-12 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 pe-12 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand-soft)]"
        />

        <button
          type="button"
          onClick={onToggle}
          aria-label={accessibilityLabel}
          title={accessibilityLabel}
          className="absolute end-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-[var(--text-secondary)] transition hover:bg-[var(--surface)] hover:text-[var(--brand-strong)]"
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
      <path d="M6.2 6.3C3.9 8 2.5 12 2.5 12s3.5 6 9.5 6c1.2 0 2.3-.2 3.3-.6" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    </svg>
  );
}