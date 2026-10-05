"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { authClient, useSession } from "@/lib/auth-client";
import { useLanguage, type Language } from "@/components/LanguageProvider";

const translations = {
  en: {
    title: "My Account",
    subtitle: "Manage your personal information.",
    profile: "Personal Information",
    firstName: "First Name",
    lastName: "Last Name",
    email: "Email",
    phone: "Phone",
    address: "Address",
    apartment: "Apartment / Floor / Door",
    postalCode: "Postal Code",
    city: "City",
    country: "Country",
    save: "Save Changes",
    saving: "Saving...",
    saved: "Your profile has been updated successfully.",
    loginRequired: "Please log in to access your account.",
    login: "Log In",
    error: "Something went wrong. Please try again.",
  },

  de: {
    title: "Mein Konto",
    subtitle: "Verwalte deine persönlichen Daten.",
    profile: "Persönliche Daten",
    firstName: "Vorname",
    lastName: "Nachname",
    email: "E-Mail",
    phone: "Telefon",
    address: "Adresse",
    apartment: "Wohnung / Etage / Tür",
    postalCode: "Postleitzahl",
    city: "Stadt",
    country: "Land",
    save: "Änderungen speichern",
    saving: "Speichern...",
    saved: "Dein Profil wurde erfolgreich aktualisiert.",
    loginRequired: "Bitte melde dich an, um dein Konto zu öffnen.",
    login: "Anmelden",
    error: "Etwas ist schiefgelaufen. Bitte versuche es erneut.",
  },

  ar: {
    title: "حسابي",
    subtitle: "إدارة بياناتك الشخصية.",
    profile: "البيانات الشخصية",
    firstName: "الاسم الأول",
    lastName: "اسم العائلة",
    email: "البريد الإلكتروني",
    phone: "رقم الهاتف",
    address: "العنوان",
    apartment: "الشقة / الطابق / الباب",
    postalCode: "الرمز البريدي",
    city: "المدينة",
    country: "الدولة",
    save: "حفظ التغييرات",
    saving: "جاري الحفظ...",
    saved: "تم تحديث بيانات حسابك بنجاح.",
    loginRequired: "يرجى تسجيل الدخول للوصول إلى حسابك.",
    login: "تسجيل الدخول",
    error: "حدث خطأ. يرجى المحاولة مرة أخرى.",
  },
};

type AccountFormProps = {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    phone?: string | null;
    address?: string | null;
    apartment?: string | null;
    postalCode?: string | null;
    city?: string | null;
    country?: string | null;
  };
  language: Language;
};

function AccountForm({
  user,
  language,
}: AccountFormProps) {
  const t = translations[language];
  const router = useRouter();

  const [firstName, setFirstName] = useState(
    user.firstName ?? ""
  );
  const [lastName, setLastName] = useState(
    user.lastName ?? ""
  );
  const [phone, setPhone] = useState(
    user.phone ?? ""
  );
  const [address, setAddress] = useState(
    user.address ?? ""
  );
  const [apartment, setApartment] = useState(
    user.apartment ?? ""
  );
  const [postalCode, setPostalCode] = useState(
    user.postalCode ?? ""
  );
  const [city, setCity] = useState(
    user.city ?? ""
  );

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const inputClassName =
    "w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-secondary)] focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/20";

  const saveProfile = async () => {
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const result = await authClient.updateUser({
        name: `${firstName} ${lastName}`.trim(),
        firstName,
        lastName,
        phone,
        address,
        apartment,
        postalCode,
        city,
        country: "Germany",
      });

      if (result.error) {
        setError(result.error.message || t.error);
        return;
      }

      setMessage(t.saved);

      await authClient.getSession();

      router.refresh();
    } catch {
      setError(t.error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm sm:p-8">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-[var(--text-primary)]">
          {t.profile}
        </h2>
      </div>

      <div className="grid gap-5 md:grid-cols-2">

        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
            {t.firstName}
          </label>

          <input
            value={firstName}
            onChange={(event) =>
              setFirstName(event.target.value)
            }
            className={inputClassName}
            autoComplete="given-name"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
            {t.lastName}
          </label>

          <input
            value={lastName}
            onChange={(event) =>
              setLastName(event.target.value)
            }
            className={inputClassName}
            autoComplete="family-name"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
            {t.email}
          </label>

          <input
            value={user.email ?? ""}
            readOnly
            className={`${inputClassName} cursor-not-allowed opacity-70`}
            autoComplete="email"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
            {t.phone}
          </label>

          <input
            value={phone}
            onChange={(event) =>
              setPhone(event.target.value)
            }
            className={inputClassName}
            autoComplete="tel"
          />
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
            {t.address}
          </label>

          <input
            value={address}
            onChange={(event) =>
              setAddress(event.target.value)
            }
            className={inputClassName}
            autoComplete="street-address"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
            {t.apartment}
          </label>

          <input
            value={apartment}
            onChange={(event) =>
              setApartment(event.target.value)
            }
            className={inputClassName}
            autoComplete="address-line2"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
            {t.postalCode}
          </label>

          <input
            value={postalCode}
            onChange={(event) =>
              setPostalCode(event.target.value)
            }
            className={inputClassName}
            autoComplete="postal-code"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
            {t.city}
          </label>

          <input
            value={city}
            onChange={(event) =>
              setCity(event.target.value)
            }
            className={inputClassName}
            autoComplete="address-level2"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
            {t.country}
          </label>

          <input
            value="Germany"
            readOnly
            className={`${inputClassName} cursor-not-allowed opacity-70`}
          />
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3">

        {message && (
          <p className="rounded-2xl bg-green-100 px-4 py-3 text-sm text-green-800 dark:bg-green-950/40 dark:text-green-300">
            {message}
          </p>
        )}

        {error && (
          <p className="rounded-2xl bg-red-100 px-4 py-3 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={saveProfile}
          disabled={saving}
          className="w-full rounded-2xl bg-[var(--brand)] px-5 py-3 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 sm:w-fit"
        >
          {saving ? t.saving : t.save}
        </button>
      </div>
    </section>
  );
}

export default function AccountPage() {
  const { language } = useLanguage();
  const { data: session, isPending } = useSession();
  const router = useRouter();

  const t = translations[language];

  if (isPending) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center">
          <p className="text-[var(--text-secondary)]">
            Loading...
          </p>
        </div>
      </main>
    );
  }

  if (!session?.user) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center">
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            {t.title}
          </h1>

          <p className="mt-3 text-[var(--text-secondary)]">
            {t.loginRequired}
          </p>

          <button
            type="button"
            onClick={() => router.push("/login")}
            className="mt-6 rounded-full bg-[var(--brand)] px-6 py-3 font-semibold text-white transition hover:opacity-90"
          >
            {t.login}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main
      dir={language === "ar" ? "rtl" : "ltr"}
      className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14"
    >
      <div className="mb-8">
        <h1 className="text-3xl font-black text-[var(--text-primary)] sm:text-4xl">
          {t.title}
        </h1>

        <p className="mt-2 text-[var(--text-secondary)]">
          {t.subtitle}
        </p>
      </div>

      <AccountForm
        key={session.user.id}
        user={session.user}
        language={language}
      />
    </main>
  );
}