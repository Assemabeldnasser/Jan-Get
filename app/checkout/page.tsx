"use client";

import Image from "next/image";

import Link from "next/link";

import { useRouter } from "next/navigation";

import {
  useSyncExternalStore,
  useState,
} from "react";

import { useCart } from "@/components/CartProvider";

import { useLanguage } from "@/components/LanguageProvider";

import { useSession } from "@/lib/auth-client";

import {
  calculateOrderTotal,
  calculateShipping,
} from "@/lib/shipping";

type FormData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  apartment: string;
  postalCode: string;
  city: string;
  country: string;
};

type FormErrors = Partial<Record<keyof FormData, string>>;

type CheckoutTranslations = {
  back: string;
  title: string;
  contact: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  shipping: string;
  address: string;
  apartment: string;
  postalCode: string;
  city: string;
  country: string;
  germany: string;
  order: string;
  subtotal: string;
  discount: string;
  shippingCost: string;
  freeShipping: string;
  shippingFrom: string;
  total: string;
  continue: string;
  required: string;
  invalidEmail: string;
  emptyCart: string;
  browse: string;
  madeWithCare: string;
  shippingGermanyOnly: string;
  deliveryCost: string;
  shippingFree: string;
  shippingTo: string;
  editDetails: string;
  loading: string;
  unavailableItems: string;
  removeUnavailableItems: string;
  backToCart: string;
  voucher: string;
  voucherPlaceholder: string;
  voucherHint: string;
  applyVoucher: string;
  removeVoucher: string;
  voucherChecking: string;
  voucherApplied: string;
  voucherInvalid: string;
  voucherFreeDelivery: string;
  unavailableItem: string;
};

type VoucherPreview = {
  valid: boolean;
  code: string;
  type: "fixed" | "percentage" | "free_delivery";
  discountAmount: number;
  freeDelivery: boolean;
  shipping: number;
  subtotal: number;
  total: number;
  message?: string;
};

const emptyForm: FormData = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  address: "",
  apartment: "",
  postalCode: "",
  city: "",
  country: "Germany",
};

const voucherListeners = new Set<() => void>();

function getStoredVoucherCode() {
  if (typeof window === "undefined") {
    return "";
  }

  return (
    sessionStorage
      .getItem("checkoutVoucherCode")
      ?.trim()
      .toUpperCase() ?? ""
  );
}

function subscribeToVoucherCode(
  callback: () => void,
) {
  voucherListeners.add(callback);

  const handleStorage = (
    event: StorageEvent,
  ) => {
    if (
      event.storageArea === sessionStorage &&
      event.key === "checkoutVoucherCode"
    ) {
      callback();
    }
  };

  window.addEventListener(
    "storage",
    handleStorage,
  );

  return () => {
    voucherListeners.delete(callback);

    window.removeEventListener(
      "storage",
      handleStorage,
    );
  };
}

function getServerVoucherCode() {
  return "";
}

function useStoredVoucherCode() {
  return useSyncExternalStore(
    subscribeToVoucherCode,
    getStoredVoucherCode,
    getServerVoucherCode,
  );
}

function setStoredVoucherCode(
  code: string,
) {
  const normalizedCode = code
    .trim()
    .toUpperCase();

  if (normalizedCode) {
    sessionStorage.setItem(
      "checkoutVoucherCode",
      normalizedCode,
    );
  } else {
    sessionStorage.removeItem(
      "checkoutVoucherCode",
    );
  }

  voucherListeners.forEach(
    (listener) => listener(),
  );
}

const translations: Record<
  "en" | "de" | "ar",
  CheckoutTranslations
> = {
  en: {
    back: "← Back to cart",
    title: "Checkout",
    contact: "Contact information",
    firstName: "First name",
    lastName: "Last name",
    email: "Email address",
    phone: "Phone number",
    shipping: "Shipping address",
    address: "Street and house number",
    apartment: "Apartment, floor, etc. (optional)",
    postalCode: "Postal code",
    city: "City",
    country: "Country",
    germany: "Germany",
    order: "Your order",
    subtotal: "Subtotal",
    discount: "Discount",
    shippingCost: "Shipping",
    freeShipping: "Free shipping",
    shippingFrom: "Free shipping from €50",
    total: "Total",
    continue: "Continue to payment",
    required: "This field is required.",
    invalidEmail: "Please enter a valid email address.",
    emptyCart: "Your cart is empty.",
    browse: "Browse products",
    madeWithCare: "Made with care",
    shippingGermanyOnly:
      "We currently ship within Germany only.",
    deliveryCost: "€3.00",
    shippingFree: "Free",
    shippingTo: "Shipping to",
    editDetails: "Your saved delivery information",
    loading: "Loading...",
    unavailableItems:
      "Some items in your cart are out of stock and cannot be purchased.",
    removeUnavailableItems:
      "Please remove the unavailable items from your cart before continuing to payment.",
    backToCart: "Back to cart",
    voucher: "Voucher / discount code",
    voucherPlaceholder: "Enter voucher code",
    voucherHint:
      "If you have a voucher, enter it here. The code will be checked before payment.",
    applyVoucher: "Apply",
    removeVoucher: "Remove",
    voucherChecking: "Checking voucher...",
    voucherApplied: "Voucher applied successfully.",
    voucherInvalid:
      "This voucher is invalid or cannot be used.",
    voucherFreeDelivery: "Free delivery applied.",
    unavailableItem: "Currently unavailable",
  },

  de: {
    back: "← Zurück zum Warenkorb",
    title: "Kasse",
    contact: "Kontaktinformationen",
    firstName: "Vorname",
    lastName: "Nachname",
    email: "E-Mail-Adresse",
    phone: "Telefonnummer",
    shipping: "Lieferadresse",
    address: "Straße und Hausnummer",
    apartment: "Wohnung, Etage usw. (optional)",
    postalCode: "Postleitzahl",
    city: "Stadt",
    country: "Land",
    germany: "Deutschland",
    order: "Deine Bestellung",
    subtotal: "Zwischensumme",
    discount: "Rabatt",
    shippingCost: "Versand",
    freeShipping: "Kostenloser Versand",
    shippingFrom: "Kostenloser Versand ab 50 €",
    total: "Gesamt",
    continue: "Weiter zur Zahlung",
    required: "Dieses Feld ist erforderlich.",
    invalidEmail:
      "Bitte gib eine gültige E-Mail-Adresse ein.",
    emptyCart: "Dein Warenkorb ist leer.",
    browse: "Produkte ansehen",
    madeWithCare: "Mit Liebe gemacht",
    shippingGermanyOnly:
      "Wir liefern derzeit nur innerhalb Deutschlands.",
    deliveryCost: "3,00 €",
    shippingFree: "Kostenlos",
    shippingTo: "Lieferung an",
    editDetails: "Deine gespeicherten Lieferdaten",
    loading: "Wird geladen...",
    unavailableItems:
      "Einige Artikel in deinem Warenkorb sind nicht auf Lager und können nicht gekauft werden.",
    removeUnavailableItems:
      "Bitte entferne die nicht verfügbaren Artikel aus deinem Warenkorb, bevor du zur Zahlung weitergehst.",
    backToCart: "Zurück zum Warenkorb",
    voucher: "Gutschein / Rabattcode",
    voucherPlaceholder: "Gutscheincode eingeben",
    voucherHint:
      "Wenn du einen Gutschein hast, kannst du ihn hier eingeben. Der Code wird vor der Zahlung geprüft.",
    applyVoucher: "Anwenden",
    removeVoucher: "Entfernen",
    voucherChecking: "Gutschein wird geprüft...",
    voucherApplied: "Gutschein erfolgreich angewendet.",
    voucherInvalid:
      "Dieser Gutschein ist ungültig oder kann nicht verwendet werden.",
    voucherFreeDelivery:
      "Kostenloser Versand wurde angewendet.",
    unavailableItem: "Derzeit nicht verfügbar",
  },

  ar: {
    back: "→ العودة إلى السلة",
    title: "إتمام الطلب",
    contact: "بيانات التواصل",
    firstName: "الاسم الأول",
    lastName: "اسم العائلة",
    email: "البريد الإلكتروني",
    phone: "رقم الهاتف",
    shipping: "عنوان الشحن",
    address: "الشارع ورقم المنزل",
    apartment: "الشقة أو الطابق، إلخ (اختياري)",
    postalCode: "الرمز البريدي",
    city: "المدينة",
    country: "الدولة",
    germany: "ألمانيا",
    order: "طلبك",
    subtotal: "المجموع الفرعي",
    discount: "الخصم",
    shippingCost: "الشحن",
    freeShipping: "شحن مجاني",
    shippingFrom: "شحن مجاني من 50 €",
    total: "الإجمالي",
    continue: "المتابعة إلى الدفع",
    required: "هذا الحقل مطلوب.",
    invalidEmail: "يرجى إدخال بريد إلكتروني صحيح.",
    emptyCart: "السلة فارغة.",
    browse: "تصفح المنتجات",
    madeWithCare: "مصنوع بعناية",
    shippingGermanyOnly:
      "نقوم حاليًا بالشحن داخل ألمانيا فقط.",
    deliveryCost: "3.00 €",
    shippingFree: "مجاني",
    shippingTo: "الشحن إلى",
    editDetails: "بيانات التوصيل المحفوظة",
    loading: "جارٍ التحميل...",
    unavailableItems:
      "بعض المنتجات في سلتك غير متوفرة حاليًا ولا يمكن شراؤها.",
    removeUnavailableItems:
      "يرجى حذف المنتجات غير المتوفرة من السلة قبل المتابعة إلى الدفع.",
    backToCart: "العودة إلى السلة",
    voucher: "قسيمة / كود الخصم",
    voucherPlaceholder: "أدخل كود الخصم",
    voucherHint:
      "إذا كان لديك كود خصم، أدخله هنا. سيتم التحقق من الكود قبل الدفع.",
    applyVoucher: "تطبيق",
    removeVoucher: "إزالة",
    voucherChecking: "جارٍ التحقق من الكود...",
    voucherApplied: "تم تطبيق كود الخصم بنجاح.",
    voucherInvalid:
      "كود الخصم غير صالح أو لا يمكن استخدامه.",
    voucherFreeDelivery: "تم تطبيق الشحن المجاني.",
    unavailableItem: "غير متوفر حاليًا",
  },
};

function getImageUrl(
  image: unknown,
): string | null {
  if (typeof image === "string") {
    return image;
  }

  if (
    image &&
    typeof image === "object" &&
    "url" in image &&
    typeof image.url === "string"
  ) {
    return image.url;
  }

  if (
    image &&
    typeof image === "object" &&
    "imageUrl" in image &&
    typeof image.imageUrl === "string"
  ) {
    return image.imageUrl;
  }

  return null;
}

function resolveCartVariant(
  product: {
    variants?: Array<{
      id?: string;
      active?: boolean;
      inStock?: boolean;
      stock?: number | null;
      color?: {
        en?: string;
        de?: string;
        ar?: string;
      };
      images?: unknown[];
    }>;
  },
  colorKey?: string,
) {
  const variants = product.variants ?? [];

  if (variants.length === 0) {
    return null;
  }

  const normalizedKey = String(
    colorKey ?? "",
  )
    .trim()
    .toLowerCase();

  if (
    !normalizedKey &&
    variants.length === 1
  ) {
    return variants[0];
  }

  const byId = variants.find(
    (variant) =>
      typeof variant.id === "string" &&
      variant.id.trim().toLowerCase() ===
        normalizedKey,
  );

  if (byId) {
    return byId;
  }

  if (/^\d+$/.test(normalizedKey)) {
    const index = Number.parseInt(
      normalizedKey,
      10,
    );

    if (
      Number.isInteger(index) &&
      index >= 0 &&
      index < variants.length
    ) {
      return variants[index];
    }
  }

  return (
    variants.find((variant) => {
      const colors = [
        variant.color?.en,
        variant.color?.de,
        variant.color?.ar,
      ]
        .filter(Boolean)
        .map((value) =>
          value!.trim().toLowerCase(),
        );

      return colors.includes(
        normalizedKey,
      );
    }) ?? null
  );
}

function isCartItemUnavailable(
  item: {
    product: {
      active?: boolean;
      inStock?: boolean;
      stock?: number | null;
      variants?: Array<{
        id?: string;
        active?: boolean;
        inStock?: boolean;
        stock?: number | null;
        color?: {
          en?: string;
          de?: string;
          ar?: string;
        };
        images?: unknown[];
      }>;
    };
    colorKey?: string;
    quantity: number;
  },
) {
  if (
    item.product.active === false ||
    item.product.inStock === false
  ) {
    return true;
  }

  const variant = resolveCartVariant(
    item.product,
    item.colorKey,
  );

  if (variant) {
    if (
      variant.active === false ||
      variant.inStock === false
    ) {
      return true;
    }

    if (
      variant.stock !== null &&
      variant.stock !== undefined &&
      variant.stock < item.quantity
    ) {
      return true;
    }
  } else if (
    item.product.stock !== null &&
    item.product.stock !== undefined &&
    item.product.stock < item.quantity
  ) {
    return true;
  }

  return false;
}

export default function CheckoutPage() {
  const router = useRouter();

  const { language } = useLanguage();

  const {
    items,
    totalPrice,
    hasUnavailableItems,
  } = useCart();

  const {
    data: session,
    isPending,
  } = useSession();

  const t = translations[language];

  const voucherCode =
    useStoredVoucherCode();

  const [formData, setFormData] =
    useState<FormData>(emptyForm);

  const [errors, setErrors] =
    useState<FormErrors>({});

  const [voucherPreview, setVoucherPreview] =
    useState<VoucherPreview | null>(null);

  const [voucherError, setVoucherError] =
    useState("");

  const [isCheckingVoucher, setIsCheckingVoucher] =
    useState(false);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const baseShipping =
    calculateShipping(totalPrice);

  const baseTotal =
    calculateOrderTotal(totalPrice);

  const shipping =
    voucherPreview?.valid
      ? voucherPreview.shipping
      : baseShipping;

  const total =
    voucherPreview?.valid
      ? voucherPreview.total
      : baseTotal;

  const appliedDiscount =
    voucherPreview?.valid
      ? voucherPreview.discountAmount
      : 0;

  const user = session?.user;

  const registeredUser = user
    ? {
        firstName:
          user.firstName ??
          user.name
            ?.trim()
            .split(/\s+/)[0] ??
          "",
        lastName:
          user.lastName ??
          user.name
            ?.trim()
            .split(/\s+/)
            .slice(1)
            .join(" ") ??
          "",
        email: user.email ?? "",
        phone: user.phone ?? "",
        address: user.address ?? "",
        apartment: user.apartment ?? "",
        postalCode: user.postalCode ?? "",
        city: user.city ?? "",
        country: "Germany",
      }
    : null;

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));

    setErrors((current) => ({
      ...current,
      [name as keyof FormData]: "",
    }));
  };

  const validate = () => {
    const newErrors: FormErrors = {};

    const requiredFields: Array<
      keyof FormData
    > = [
      "firstName",
      "lastName",
      "email",
      "phone",
      "address",
      "postalCode",
      "city",
    ];

    requiredFields.forEach((field) => {
      if (!formData[field].trim()) {
        newErrors[field] = t.required;
      }
    });

    if (
      formData.email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        formData.email.trim(),
      )
    ) {
      newErrors.email =
        t.invalidEmail;
    }

    setErrors(newErrors);

    return (
      Object.keys(newErrors).length === 0
    );
  };

  const applyVoucher = async () => {
    const code =
      voucherCode.trim().toUpperCase();

    setVoucherError("");
    setVoucherPreview(null);

    if (!code) {
      setStoredVoucherCode("");
      return;
    }

    if (hasUnavailableItems) {
      return;
    }

    setIsCheckingVoucher(true);

    try {
      const response = await fetch(
        "/api/vouchers/validate",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            code,
            subtotal: totalPrice,
            email:
              session?.user?.email?.trim() ||
              formData.email.trim(),
          }),
        },
      );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data ||
        data.valid !== true
      ) {
        setVoucherError(
          data?.message ||
            t.voucherInvalid,
        );

        setStoredVoucherCode("");

        return;
      }

      const preview: VoucherPreview = {
        valid: true,

        code:
          typeof data.code ===
          "string"
            ? data.code
            : code,

        type:
          data.type ===
            "percentage" ||
          data.type ===
            "free_delivery"
            ? data.type
            : "fixed",

        discountAmount:
          Number(
            data.discountAmount,
          ) || 0,

        freeDelivery:
          data.freeDelivery === true,

        shipping:
          Number.isFinite(
            Number(data.shipping),
          )
            ? Number(data.shipping)
            : 0,

        subtotal:
          Number.isFinite(
            Number(data.subtotal),
          )
            ? Number(data.subtotal)
            : totalPrice,

        total:
          Number.isFinite(
            Number(data.total),
          )
            ? Number(data.total)
            : Math.max(
                0,
                totalPrice -
                  (Number(
                    data.discountAmount,
                  ) || 0) +
                  (Number(
                    data.shipping,
                  ) || 0),
              ),

        message:
          typeof data.message ===
          "string"
            ? data.message
            : undefined,
      };

      setVoucherPreview(preview);

      setStoredVoucherCode(
        preview.code,
      );
    } catch {
      setVoucherError(
        t.voucherInvalid,
      );

      setStoredVoucherCode("");
    } finally {
      setIsCheckingVoucher(false);
    }
  };

  const removeVoucher = () => {
    setVoucherPreview(null);
    setVoucherError("");
    setStoredVoucherCode("");
  };

  const voucherIsBlocking =
    voucherCode.trim().length > 0 &&
    (!voucherPreview?.valid ||
      isCheckingVoucher);

  const continueToPayment = (
    data: FormData,
  ) => {
    if (
      hasUnavailableItems ||
      voucherIsBlocking ||
      isSubmitting
    ) {
      return;
    }

    setIsSubmitting(true);

    sessionStorage.setItem(
      "guestCheckout",
      JSON.stringify(data),
    );

    if (voucherPreview?.valid) {
      setStoredVoucherCode(
        voucherPreview.code,
      );
    } else {
      setStoredVoucherCode("");
    }

    router.push("/payment");
  };

  const handleGuestSubmit = (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (
      hasUnavailableItems ||
      voucherIsBlocking
    ) {
      return;
    }

    if (!validate()) {
      return;
    }

    continueToPayment(formData);
  };

  const handleRegisteredSubmit = () => {
    if (
      !registeredUser ||
      hasUnavailableItems ||
      voucherIsBlocking ||
      isSubmitting
    ) {
      return;
    }

    continueToPayment(registeredUser);
  };

  if (items.length === 0) {
    return (
      <main className="min-h-screen bg-[var(--background)] px-4 py-10 text-[var(--text-primary)] sm:px-6 sm:py-14 lg:py-20">
        <div className="mx-auto max-w-4xl">
          <Link
            href="/cart"
            className="inline-flex items-center rounded-full border border-[var(--brand-soft)] bg-[var(--surface)] px-4 py-2 text-sm font-semibold text-[var(--brand-strong)] shadow-sm transition hover:-translate-y-0.5 hover:bg-[var(--brand-soft)]"
          >
            {t.back}
          </Link>

          <div className="mt-10 rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] px-6 py-16 text-center shadow-sm sm:mt-12 sm:px-10 sm:py-20">
            <div className="text-6xl">
              🛍️
            </div>

            <h1 className="mt-6 text-3xl font-black tracking-tight sm:text-4xl">
              {t.emptyCart}
            </h1>

            <Link
              href="/shop"
              className="mt-7 inline-flex rounded-full bg-[var(--brand)] px-7 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:opacity-90 sm:text-base"
            >
              {t.browse}
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (isPending) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4 text-[var(--text-primary)]">
        <p className="text-sm text-[var(--text-secondary)]">
          {t.loading}
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-10 text-[var(--text-primary)] sm:px-6 sm:py-14 lg:py-20">
      <div className="mx-auto max-w-7xl">
        <Link
          href="/cart"
          className="inline-flex items-center rounded-full border border-[var(--brand-soft)] bg-[var(--surface)] px-4 py-2 text-sm font-semibold text-[var(--brand-strong)] shadow-sm transition hover:-translate-y-0.5 hover:bg-[var(--brand-soft)]"
        >
          {t.back}
        </Link>

        <div className="mt-10 max-w-3xl sm:mt-12">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand)] sm:text-sm">
            {t.title}
          </p>

          <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
            {t.title}
          </h1>
        </div>

        {hasUnavailableItems && (
          <div
            role="alert"
            className="mt-8 rounded-[2rem] border border-red-300 bg-red-50 p-5 text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300 sm:p-6"
          >
            <p className="font-bold">
              {t.unavailableItems}
            </p>

            <p className="mt-2 text-sm leading-6">
              {t.removeUnavailableItems}
            </p>

            <Link
              href="/cart"
              className="mt-4 inline-flex rounded-full bg-red-600 px-5 py-2.5 text-sm font-bold text-white transition hover:opacity-90"
            >
              {t.backToCart}
            </Link>
          </div>
        )}

        {registeredUser ? (
          <div className="mt-8 grid gap-8 lg:mt-10 lg:grid-cols-[1fr_380px]">
            <div className="space-y-6">
              <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm sm:p-8">
                <h2 className="text-xl font-bold sm:text-2xl">
                  {t.shippingTo}
                </h2>

                <div className="mt-6 rounded-2xl bg-[var(--surface-soft)] p-5">
                  <p className="font-bold">
                    {registeredUser.firstName}{" "}
                    {registeredUser.lastName}
                  </p>

                  <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                    {registeredUser.address}
                    {registeredUser.apartment
                      ? `, ${registeredUser.apartment}`
                      : ""}
                    <br />
                    {registeredUser.postalCode}{" "}
                    {registeredUser.city}
                    <br />
                    {t.germany}
                  </p>

                  <p className="mt-3 text-sm text-[var(--text-secondary)]">
                    {registeredUser.email}
                    <br />
                    {registeredUser.phone}
                  </p>
                </div>

                <p className="mt-4 text-sm text-[var(--text-muted)]">
                  {t.editDetails}
                </p>
              </section>

              <VoucherField
                value={voucherCode}
                onChange={(value) => {
                  setStoredVoucherCode(
                    value,
                  );

                  setVoucherPreview(
                    null,
                  );

                  setVoucherError("");
                }}
                onApply={applyVoucher}
                onRemove={removeVoucher}
                preview={voucherPreview}
                error={voucherError}
                isChecking={
                  isCheckingVoucher
                }
                t={t}
              />

              <button
                type="button"
                onClick={
                  handleRegisteredSubmit
                }
                disabled={
                  hasUnavailableItems ||
                  voucherIsBlocking ||
                  isSubmitting
                }
                className={`w-full rounded-full px-7 py-4 text-sm font-bold text-white shadow-sm transition sm:text-base ${
                  hasUnavailableItems ||
                  voucherIsBlocking ||
                  isSubmitting
                    ? "cursor-not-allowed bg-[var(--text-secondary)] opacity-60"
                    : "cursor-pointer bg-[var(--brand)] hover:-translate-y-0.5 hover:opacity-90"
                }`}
              >
                {isSubmitting
                  ? t.loading
                  : t.continue}
              </button>
            </div>

            <OrderSummary
              items={items}
              language={language}
              subtotal={totalPrice}
              discount={appliedDiscount}
              voucherCode={
                voucherPreview?.valid
                  ? voucherPreview.code
                  : ""
              }
              shipping={shipping}
              total={total}
              t={t}
            />
          </div>
        ) : (
          <form
            onSubmit={
              handleGuestSubmit
            }
            className="mt-8 grid gap-8 lg:mt-10 lg:grid-cols-[1fr_380px]"
          >
            <div className="space-y-6">
              <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm sm:p-8">
                <h2 className="text-xl font-bold sm:text-2xl">
                  {t.contact}
                </h2>

                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  <Field
                    label={t.firstName}
                    name="firstName"
                    value={
                      formData.firstName
                    }
                    error={
                      errors.firstName
                    }
                    autoComplete="given-name"
                    onChange={
                      handleChange
                    }
                  />

                  <Field
                    label={t.lastName}
                    name="lastName"
                    value={
                      formData.lastName
                    }
                    error={
                      errors.lastName
                    }
                    autoComplete="family-name"
                    onChange={
                      handleChange
                    }
                  />

                  <Field
                    label={t.email}
                    name="email"
                    type="email"
                    value={
                      formData.email
                    }
                    error={errors.email}
                    autoComplete="email"
                    onChange={
                      handleChange
                    }
                  />

                  <Field
                    label={t.phone}
                    name="phone"
                    type="tel"
                    value={
                      formData.phone
                    }
                    error={errors.phone}
                    autoComplete="tel"
                    onChange={
                      handleChange
                    }
                  />
                </div>
              </section>

              <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm sm:p-8">
                <h2 className="text-xl font-bold sm:text-2xl">
                  {t.shipping}
                </h2>

                <div className="mt-6 space-y-5">
                  <Field
                    label={t.address}
                    name="address"
                    value={
                      formData.address
                    }
                    error={
                      errors.address
                    }
                    autoComplete="street-address"
                    onChange={
                      handleChange
                    }
                  />

                  <Field
                    label={t.apartment}
                    name="apartment"
                    value={
                      formData.apartment
                    }
                    autoComplete="address-line2"
                    onChange={
                      handleChange
                    }
                  />

                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field
                      label={
                        t.postalCode
                      }
                      name="postalCode"
                      value={
                        formData.postalCode
                      }
                      error={
                        errors.postalCode
                      }
                      autoComplete="postal-code"
                      onChange={
                        handleChange
                      }
                    />

                    <Field
                      label={t.city}
                      name="city"
                      value={
                        formData.city
                      }
                      error={errors.city}
                      autoComplete="address-level2"
                      onChange={
                        handleChange
                      }
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="country"
                      className="mb-2 block text-sm font-semibold"
                    >
                      {t.country}
                    </label>

                    <input
                      id="country"
                      name="country"
                      value={t.germany}
                      readOnly
                      autoComplete="country-name"
                      className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-[var(--text-primary)] outline-none"
                    />
                  </div>

                  <p className="text-sm text-[var(--text-muted)]">
                    {t.shippingGermanyOnly}
                  </p>
                </div>
              </section>

              <VoucherField
                value={voucherCode}
                onChange={(value) => {
                  setStoredVoucherCode(
                    value,
                  );

                  setVoucherPreview(
                    null,
                  );

                  setVoucherError("");
                }}
                onApply={applyVoucher}
                onRemove={removeVoucher}
                preview={voucherPreview}
                error={voucherError}
                isChecking={
                  isCheckingVoucher
                }
                t={t}
              />

              <button
                type="submit"
                disabled={
                  hasUnavailableItems ||
                  voucherIsBlocking ||
                  isSubmitting
                }
                className={`w-full rounded-full px-7 py-4 text-sm font-bold text-white shadow-sm transition sm:text-base ${
                  hasUnavailableItems ||
                  voucherIsBlocking ||
                  isSubmitting
                    ? "cursor-not-allowed bg-[var(--text-secondary)] opacity-60"
                    : "cursor-pointer bg-[var(--brand)] hover:-translate-y-0.5 hover:opacity-90"
                }`}
              >
                {isSubmitting
                  ? t.loading
                  : t.continue}
              </button>
            </div>

            <OrderSummary
              items={items}
              language={language}
              subtotal={totalPrice}
              discount={appliedDiscount}
              voucherCode={
                voucherPreview?.valid
                  ? voucherPreview.code
                  : ""
              }
              shipping={shipping}
              total={total}
              t={t}
            />
          </form>
        )}
      </div>
    </main>
  );
}

function VoucherField({
  value,
  onChange,
  onApply,
  onRemove,
  preview,
  error,
  isChecking,
  t,
}: {
  value: string;
  onChange: (value: string) => void;
  onApply: () => void;
  onRemove: () => void;
  preview: VoucherPreview | null;
  error: string;
  isChecking: boolean;
  t: CheckoutTranslations;
}) {
  const hasAppliedVoucher =
    preview?.valid === true;

  return (
    <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm sm:p-8">
      <h2 className="text-xl font-bold sm:text-2xl">
        {t.voucher}
      </h2>

      <div className="mt-5">
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            value={value}
            onChange={(event) =>
              onChange(
                event.target.value.toUpperCase(),
              )
            }
            placeholder={
              t.voucherPlaceholder
            }
            autoComplete="off"
            spellCheck={false}
            disabled={isChecking}
            className="min-w-0 flex-1 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[var(--text-primary)] uppercase outline-none transition placeholder:text-[var(--text-muted)] placeholder:normal-case focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand-soft)] disabled:cursor-not-allowed disabled:opacity-60"
          />

          {hasAppliedVoucher ? (
            <button
              type="button"
              onClick={onRemove}
              disabled={isChecking}
              className="rounded-2xl border border-[var(--border)] px-5 py-3 text-sm font-bold text-[var(--text-primary)] transition hover:bg-[var(--surface-soft)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {t.removeVoucher}
            </button>
          ) : (
            <button
              type="button"
              onClick={onApply}
              disabled={
                isChecking ||
                value.trim().length === 0
              }
              className="rounded-2xl bg-[var(--brand)] px-6 py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isChecking
                ? t.voucherChecking
                : t.applyVoucher}
            </button>
          )}
        </div>

        <p className="mt-2 text-xs leading-5 text-[var(--text-muted)]">
          {t.voucherHint}
        </p>

        {isChecking && (
          <p
            role="status"
            className="mt-3 text-sm text-[var(--text-secondary)]"
          >
            {t.voucherChecking}
          </p>
        )}

        {hasAppliedVoucher && (
          <div
            role="status"
            className="mt-3 rounded-2xl border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-900/60 dark:bg-green-950/30 dark:text-green-300"
          >
            <p className="font-semibold">
              {preview.message ||
                t.voucherApplied}
            </p>

            {preview.freeDelivery && (
              <p className="mt-1">
                {t.voucherFreeDelivery}
              </p>
            )}
          </div>
        )}

        {error && (
          <p
            role="alert"
            className="mt-3 rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300"
          >
            {error}
          </p>
        )}
      </div>
    </section>
  );
}

function OrderSummary({
  items,
  language,
  subtotal,
  discount,
  voucherCode,
  shipping,
  total,
  t,
}: {
  items: ReturnType<typeof useCart>["items"];
  language: "en" | "de" | "ar";
  subtotal: number;
  discount: number;
  voucherCode: string;
  shipping: number;
  total: number;
  t: CheckoutTranslations;
}) {
  return (
    <aside className="h-fit rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm lg:sticky lg:top-28">
      <h2 className="text-xl font-bold sm:text-2xl">
        {t.order}
      </h2>

      <div className="mt-6 space-y-5">
        {items.map((item) => {
          const productName =
            item.product.name[language];

          const variant =
            resolveCartVariant(
              item.product,
              item.colorKey,
            );

          const unavailable =
            isCartItemUnavailable(item);

          const rawImage =
            variant?.images?.[0] ??
            item.product.variants?.[0]
              ?.images?.[0];

          const image =
            getImageUrl(rawImage);

          /*
           * IMPORTANT:
           *
           * `unitPrice` is already the final
           * authoritative cart price:
           *
           * Size Price
           *   ↓
           * Color Price
           *   ↓
           * Basic Price
           *
           * It must NOT use `item.product.price`
           * here because that is only the basic
           * product price.
           */
          const itemTotal =
            item.unitPrice *
            item.quantity;

          return (
            <div
              key={`${item.product.id}-${item.colorKey}`}
              className={`flex gap-3 ${
                unavailable
                  ? "rounded-2xl border border-red-300 bg-red-50 p-3 opacity-55 dark:border-red-900/60 dark:bg-red-950/20"
                  : ""
              }`}
            >
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-[var(--surface-soft)]">
                {image ? (
                  <Image
                    src={image}
                    alt={productName}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-2xl">
                    {item.product.emoji}
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">
                  {productName}
                </p>

                <p className="mt-1 text-xs text-[var(--text-secondary)]">
                  × {item.quantity}
                </p>

                {unavailable && (
                  <p className="mt-1 text-xs font-bold text-red-600 dark:text-red-400">
                    {t.unavailableItem}
                  </p>
                )}
              </div>

              <p className="shrink-0 text-sm font-bold">
                {unavailable
                  ? "—"
                  : `€${itemTotal.toFixed(2)}`}
              </p>
            </div>
          );
        })}
      </div>

      <div className="my-6 border-t border-[var(--border)]" />

      <div className="flex justify-between gap-4 text-sm">
        <span className="text-[var(--text-secondary)]">
          {t.subtotal}
        </span>

        <span className="font-semibold">
          €{subtotal.toFixed(2)}
        </span>
      </div>

      {discount > 0 && (
        <div className="mt-4 flex justify-between gap-4 text-sm">
          <span className="text-[var(--text-secondary)]">
            {t.discount}
            {voucherCode
              ? ` (${voucherCode})`
              : ""}
          </span>

          <span className="font-semibold text-[var(--brand-strong)]">
            -€{discount.toFixed(2)}
          </span>
        </div>
      )}

      <div className="mt-4 flex justify-between gap-4 text-sm">
        <span className="text-[var(--text-secondary)]">
          {t.shippingCost}
        </span>

        <span
          className={
            shipping === 0
              ? "font-semibold text-[var(--brand-strong)]"
              : "font-semibold"
          }
        >
          {shipping === 0
            ? t.shippingFree
            : `€${shipping.toFixed(2)}`}
        </span>
      </div>

      <p className="mt-3 text-xs leading-5 text-[var(--text-muted)]">
        {t.shippingFrom}
      </p>

      <div className="my-6 border-t border-[var(--border)]" />

      <div className="flex items-center justify-between gap-4">
        <span className="text-lg font-bold">
          {t.total}
        </span>

        <span className="text-2xl font-black text-[var(--brand-strong)]">
          €{total.toFixed(2)}
        </span>
      </div>

      <p className="mt-3 text-xs leading-5 text-[var(--text-muted)]">
        {t.madeWithCare}
      </p>
    </aside>
  );
}

function Field({
  label,
  name,
  value,
  error,
  type = "text",
  autoComplete,
  onChange,
}: {
  label: string;
  name: string;
  value: string;
  error?: string;
  type?: string;
  autoComplete?: string;
  onChange: (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => void;
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="mb-2 block text-sm font-semibold"
      >
        {label}
      </label>

      <input
        id={name}
        name={name}
        type={type}
        value={value}
        autoComplete={autoComplete}
        onChange={onChange}
        aria-invalid={Boolean(error)}
        aria-describedby={
          error
            ? `${name}-error`
            : undefined
        }
        className={`w-full rounded-2xl border bg-[var(--surface)] px-4 py-3 text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand-soft)] ${
          error
            ? "border-red-400 focus:border-red-500 focus:ring-red-100"
            : "border-[var(--border)]"
        }`}
      />

      {error && (
        <p
          id={`${name}-error`}
          className="mt-1.5 text-xs text-red-500"
        >
          {error}
        </p>
      )}
    </div>
  );
}