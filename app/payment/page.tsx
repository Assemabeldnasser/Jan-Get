"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Suspense,
  useEffect,
  useSyncExternalStore,
  useState,
} from "react";

import { useCart } from "@/components/CartProvider";
import { useLanguage } from "@/components/LanguageProvider";
import { useSession } from "@/lib/auth-client";
import { calculateShipping } from "@/lib/shipping";
import type { ProductSizeKey } from "@/lib/product-public";

type CheckoutData = {
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

type PaymentTranslations = {
  back: string;
  title: string;
  order: string;
  shippingTo: string;
  subtotal: string;
  discount: string;
  voucher: string;
  shipping: string;
  free: string;
  total: string;
  freeShipping: string;
  germanyOnly: string;
  paymentMethod: string;
  stripeDescription: string;
  pay: string;
  processing: string;
  empty: string;
  browse: string;
  missingData: string;
  backToCheckout: string;
  loading: string;
  orderError: string;
  paymentCancelled: string;
  unavailableItems: string;
  unavailableItem: string;
  backToCart: string;
  voucherChecking: string;
  voucherInvalid: string;
  voucherApplied: string;
  voucherFreeDelivery: string;
  stockChanged: string;
  size: string;
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

type CheckoutApiResponse = {
  success?: boolean;
  checkoutUrl?: string;
  error?: string;
  code?: string;
  message?: string;
  order?: {
    id?: string;
    subtotal?: number;
    discountAmount?: number;
    shipping?: number;
    total?: number;
    voucherCode?: string | null;
    freeDelivery?: boolean;
  };
};

const voucherListeners = new Set<() => void>();

function getStoredVoucherCode() {
  if (typeof window === "undefined") {
    return "";
  }

  return (
    sessionStorage.getItem("checkoutVoucherCode")?.trim().toUpperCase() ?? ""
  );
}

function subscribeToVoucherCode(callback: () => void) {
  voucherListeners.add(callback);

  const handleStorage = (event: StorageEvent) => {
    if (
      event.storageArea === sessionStorage &&
      event.key === "checkoutVoucherCode"
    ) {
      callback();
    }
  };

  window.addEventListener("storage", handleStorage);

  return () => {
    voucherListeners.delete(callback);
    window.removeEventListener("storage", handleStorage);
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

function setStoredVoucherCode(code: string) {
  const normalizedCode = code.trim().toUpperCase();

  if (normalizedCode) {
    sessionStorage.setItem("checkoutVoucherCode", normalizedCode);
  } else {
    sessionStorage.removeItem("checkoutVoucherCode");
  }

  voucherListeners.forEach((listener) => listener());
}

const translations: Record<
  "en" | "de" | "ar",
  PaymentTranslations
> = {
  en: {
    back: "← Back to checkout",
    title: "Payment",
    order: "Your order",
    shippingTo: "Shipping to",
    subtotal: "Subtotal",
    discount: "Discount",
    voucher: "Voucher",
    shipping: "Shipping",
    free: "Free",
    total: "Total",
    freeShipping: "Free shipping from €50",
    germanyOnly:
      "Shipping is currently available within Germany only.",
    paymentMethod: "Payment method",
    stripeDescription:
      "You will be securely redirected to Stripe to complete your payment.",
    pay: "Pay securely",
    processing: "Redirecting to payment...",
    empty: "Your cart is empty.",
    browse: "Browse products",
    missingData: "Shipping information is missing.",
    backToCheckout: "Back to checkout",
    loading: "Loading...",
    orderError:
      "We could not start the payment. Please try again.",
    paymentCancelled:
      "Your payment was cancelled. Your order is still pending and you can try again.",
    unavailableItems:
      "Some items in your cart are out of stock and cannot be purchased.",
    unavailableItem: "This item is currently unavailable.",
    backToCart: "Back to cart",
    voucherChecking: "Checking voucher...",
    voucherInvalid:
      "The voucher is no longer valid and cannot be used.",
    voucherApplied: "Voucher applied successfully.",
    voucherFreeDelivery: "Free delivery applied.",
    stockChanged:
      "Stock availability changed. Please return to your cart and review your items.",
    size: "Size",
  },

  de: {
    back: "← Zurück zur Kasse",
    title: "Zahlung",
    order: "Deine Bestellung",
    shippingTo: "Lieferung an",
    subtotal: "Zwischensumme",
    discount: "Rabatt",
    voucher: "Gutschein",
    shipping: "Versand",
    free: "Kostenlos",
    total: "Gesamt",
    freeShipping: "Kostenloser Versand ab 50 €",
    germanyOnly:
      "Der Versand ist derzeit nur innerhalb Deutschlands möglich.",
    paymentMethod: "Zahlungsmethode",
    stripeDescription:
      "Du wirst sicher zu Stripe weitergeleitet, um deine Zahlung abzuschließen.",
    pay: "Sicher bezahlen",
    processing: "Weiterleitung zur Zahlung...",
    empty: "Dein Warenkorb ist leer.",
    browse: "Produkte ansehen",
    missingData: "Lieferinformationen fehlen.",
    backToCheckout: "Zurück zur Kasse",
    loading: "Wird geladen...",
    orderError:
      "Die Zahlung konnte nicht gestartet werden. Bitte versuche es erneut.",
    paymentCancelled:
      "Die Zahlung wurde abgebrochen. Deine Bestellung wartet weiterhin auf die Zahlung und kann erneut bezahlt werden.",
    unavailableItems:
      "Einige Artikel in deinem Warenkorb sind nicht auf Lager und können nicht gekauft werden.",
    unavailableItem: "Dieser Artikel ist derzeit nicht verfügbar.",
    backToCart: "Zurück zum Warenkorb",
    voucherChecking: "Gutschein wird geprüft...",
    voucherInvalid:
      "Der Gutschein ist nicht mehr gültig und kann nicht verwendet werden.",
    voucherApplied: "Gutschein erfolgreich angewendet.",
    voucherFreeDelivery: "Kostenloser Versand wurde angewendet.",
    stockChanged:
      "Die Verfügbarkeit hat sich geändert. Bitte gehe zurück zum Warenkorb und überprüfe deine Artikel.",
    size: "Größe",
  },

  ar: {
    back: "→ العودة إلى إتمام الطلب",
    title: "الدفع",
    order: "طلبك",
    shippingTo: "الشحن إلى",
    subtotal: "المجموع الفرعي",
    discount: "الخصم",
    voucher: "كود الخصم",
    shipping: "الشحن",
    free: "مجاني",
    total: "الإجمالي",
    freeShipping: "شحن مجاني من 50 €",
    germanyOnly: "الشحن متاح حاليًا داخل ألمانيا.",
    paymentMethod: "طريقة الدفع",
    stripeDescription:
      "سيتم تحويلك بشكل آمن إلى Stripe لإتمام عملية الدفع.",
    pay: "الدفع بشكل آمن",
    processing: "جاري تحويلك إلى صفحة الدفع...",
    empty: "السلة فارغة.",
    browse: "تصفح المنتجات",
    missingData: "بيانات الشحن غير موجودة.",
    backToCheckout: "العودة إلى إتمام الطلب",
    loading: "جارٍ التحميل...",
    orderError:
      "تعذر بدء عملية الدفع. يرجى المحاولة مرة أخرى.",
    paymentCancelled:
      "تم إلغاء عملية الدفع. طلبك ما زال في انتظار الدفع ويمكنك المحاولة مرة أخرى.",
    unavailableItems:
      "بعض المنتجات في سلتك غير متوفرة حاليًا ولا يمكن شراؤها.",
    unavailableItem: "هذا المنتج غير متوفر حاليًا.",
    backToCart: "العودة إلى السلة",
    voucherChecking: "جارٍ التحقق من كود الخصم...",
    voucherInvalid:
      "كود الخصم لم يعد صالحًا ولا يمكن استخدامه.",
    voucherApplied: "تم تطبيق كود الخصم بنجاح.",
    voucherFreeDelivery: "تم تطبيق الشحن المجاني.",
    stockChanged:
      "تغيرت الكمية المتاحة. يرجى العودة إلى السلة ومراجعة المنتجات.",
    size: "المقاس",
  },
};

const STOCK_ERROR_CODES = new Set([
  "OUT_OF_STOCK",
  "VARIANT_OUT_OF_STOCK",
  "INSUFFICIENT_PRODUCT_STOCK",
  "INSUFFICIENT_VARIANT_STOCK",
  "PRODUCT_NOT_AVAILABLE",
  "VARIANT_NOT_AVAILABLE",
]);

const VOUCHER_ERROR_CODES = new Set([
  "INVALID_VOUCHER",
  "VOUCHER_INVALID",
  "VOUCHER_NOT_FOUND",
]);

const sizeLabels: Record<
  ProductSizeKey,
  Record<"en" | "de" | "ar", string>
> = {
  small: {
    en: "Small",
    de: "Klein",
    ar: "صغير",
  },
  medium: {
    en: "Medium",
    de: "Mittel",
    ar: "متوسط",
  },
  large: {
    en: "Large",
    de: "Groß",
    ar: "كبير",
  },
};

function loadGuestData(): CheckoutData | null {
  if (typeof window === "undefined") {
    return null;
  }

  const saved = sessionStorage.getItem("guestCheckout");

  if (!saved) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(saved);

    if (
      parsed &&
      typeof parsed === "object" &&
      "firstName" in parsed &&
      "lastName" in parsed &&
      "email" in parsed &&
      typeof parsed.firstName === "string" &&
      typeof parsed.lastName === "string" &&
      typeof parsed.email === "string"
    ) {
      return {
        firstName: parsed.firstName,
        lastName: parsed.lastName,
        email: parsed.email,
        phone:
          "phone" in parsed &&
          typeof parsed.phone === "string"
            ? parsed.phone
            : "",
        address:
          "address" in parsed &&
          typeof parsed.address === "string"
            ? parsed.address
            : "",
        apartment:
          "apartment" in parsed &&
          typeof parsed.apartment === "string"
            ? parsed.apartment
            : "",
        postalCode:
          "postalCode" in parsed &&
          typeof parsed.postalCode === "string"
            ? parsed.postalCode
            : "",
        city:
          "city" in parsed &&
          typeof parsed.city === "string"
            ? parsed.city
            : "",
        country: "Germany",
      };
    }

    sessionStorage.removeItem("guestCheckout");
    return null;
  } catch {
    sessionStorage.removeItem("guestCheckout");
    return null;
  }
}

function getImageUrl(image: unknown): string | null {
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
      price?: number | null;
      sizes?: Array<{
        key?: ProductSizeKey;
        price?: number | null;
      }>;
    }>;
  },
  colorKey?: string,
) {
  const variants = product.variants ?? [];

  if (variants.length === 0) {
    return null;
  }

  const normalizedKey = String(colorKey ?? "")
    .trim()
    .toLowerCase();

  if (!normalizedKey && variants.length === 1) {
    return variants[0];
  }

  const byId = variants.find(
    (variant) =>
      typeof variant.id === "string" &&
      variant.id.trim().toLowerCase() === normalizedKey,
  );

  if (byId) {
    return byId;
  }

  if (/^\d+$/.test(normalizedKey)) {
    const index = Number.parseInt(normalizedKey, 10);

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
        .map((value) => value!.trim().toLowerCase());

      return colors.includes(normalizedKey);
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
        price?: number | null;
        sizes?: Array<{
          key?: ProductSizeKey;
          price?: number | null;
        }>;
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

function getCheckoutErrorMessage(
  data: CheckoutApiResponse | null,
  fallback: string,
  stockChanged: string,
  voucherInvalid: string,
) {
  const code =
    typeof data?.code === "string"
      ? data.code
      : "";

  if (STOCK_ERROR_CODES.has(code)) {
    return stockChanged;
  }

  if (VOUCHER_ERROR_CODES.has(code)) {
    return voucherInvalid;
  }

  if (
    typeof data?.message === "string" &&
    data.message.trim()
  ) {
    return data.message;
  }

  if (
    typeof data?.error === "string" &&
    data.error.trim()
  ) {
    return data.error;
  }

  return fallback;
}

function PaymentPageContent() {
  const searchParams = useSearchParams();

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

  const [guestData] =
    useState<CheckoutData | null>(
      loadGuestData,
    );

  const voucherCode =
    useStoredVoucherCode();

  const [
    voucherPreview,
    setVoucherPreview,
  ] = useState<VoucherPreview | null>(
    null,
  );

  const [
    voucherChecking,
    setVoucherChecking,
  ] = useState(false);

  const [
    voucherError,
    setVoucherError,
  ] = useState("");

  const [
    creatingOrder,
    setCreatingOrder,
  ] = useState(false);

  const [error, setError] =
    useState("");

  const t = translations[language];

  /*
   * Shipping threshold is based on the
   * product subtotal AFTER product discounts
   * and BEFORE voucher discounts.
   *
   * Example:
   * Original subtotal: €55
   * Product discount: €10
   * Discounted subtotal: €45
   * Shipping: €3
   */
  const baseShipping =
    calculateShipping(totalPrice);

  const baseTotal =
    totalPrice + baseShipping;

  const shipping =
    voucherPreview?.valid === true
      ? voucherPreview.shipping
      : baseShipping;

  const total =
    voucherPreview?.valid === true
      ? voucherPreview.total
      : baseTotal;

  const discount =
    voucherPreview?.valid === true
      ? voucherPreview.discountAmount
      : 0;

  const paymentWasCancelled =
    searchParams.get("payment") ===
    "cancelled";

  useEffect(() => {
    let cancelled = false;

    const checkVoucher = async () => {
      const code = voucherCode
        .trim()
        .toUpperCase();

      if (!code) {
        setVoucherPreview(null);
        setVoucherError("");
        setVoucherChecking(false);
        return;
      }

      if (hasUnavailableItems) {
        setVoucherPreview(null);
        setVoucherError("");
        setVoucherChecking(false);
        return;
      }

      setVoucherChecking(true);
      setVoucherError("");

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
            }),
          },
        );

        const data =
          await response.json();

        if (cancelled) {
          return;
        }

        if (
          !response.ok ||
          !data ||
          data.valid !== true
        ) {
          setVoucherPreview(null);

          setVoucherError(
            typeof data?.message ===
              "string"
              ? data.message
              : t.voucherInvalid,
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
      } catch {
        if (!cancelled) {
          setVoucherPreview(null);
          setVoucherError(
            t.voucherInvalid,
          );
        }
      } finally {
        if (!cancelled) {
          setVoucherChecking(false);
        }
      }
    };

    void checkVoucher();

    return () => {
      cancelled = true;
    };
  }, [
    voucherCode,
    totalPrice,
    hasUnavailableItems,
    t.voucherInvalid,
  ]);

  if (items.length === 0) {
    return (
      <main className="min-h-screen bg-[var(--background)] px-5 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] px-6 py-16 text-center shadow-sm sm:px-10">
            <div className="text-5xl">🛍️</div>

            <h1 className="mt-6 text-3xl font-black tracking-tight">
              {t.empty}
            </h1>

            <Link
              href="/shop"
              className="mt-7 inline-flex rounded-full bg-[var(--brand)] px-7 py-3.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:opacity-90"
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
      <main className="min-h-screen bg-[var(--background)] px-5 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] px-6 py-16 text-center shadow-sm sm:px-10">
            {t.loading}
          </div>
        </div>
      </main>
    );
  }

  const user = session?.user;

  const shippingData:
    | CheckoutData
    | null = user
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
        postalCode:
          user.postalCode ?? "",
        city: user.city ?? "",
        country: "Germany",
      }
    : guestData;

  if (!shippingData) {
    return (
      <main className="min-h-screen bg-[var(--background)] px-5 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] px-6 py-16 text-center shadow-sm sm:px-10">
            <h1 className="text-2xl font-black">
              {t.missingData}
            </h1>

            <Link
              href="/checkout"
              className="mt-6 inline-flex rounded-full bg-[var(--brand)] px-7 py-3 font-semibold text-white transition hover:-translate-y-0.5 hover:opacity-90"
            >
              {t.backToCheckout}
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const normalizedVoucherCode =
    voucherCode.trim().toUpperCase();

  const voucherIsBlocking =
    normalizedVoucherCode.length > 0 &&
    (voucherChecking ||
      voucherPreview?.valid !== true);

  const createCheckoutSession =
    async () => {
      if (
        creatingOrder ||
        hasUnavailableItems ||
        voucherIsBlocking
      ) {
        return;
      }

      setCreatingOrder(true);
      setError("");

      try {
        const response = await fetch(
          "/api/checkout",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              items: items.map((item) => ({
                productId:
                  item.product.id,
                quantity:
                  item.quantity,
                colorKey:
                  item.colorKey,
                sizeKey:
                  item.sizeKey ||
                  undefined,
                customFields:
                  item.customFields.map(
                    (field) => ({
                      id: field.id,
                      label:
                        field.label,
                      value:
                        field.value,
                    }),
                  ),
              })),
              shipping:
                shippingData,
              language,
              voucherCode:
                normalizedVoucherCode ||
                undefined,
            }),
          },
        );

        let data:
          | CheckoutApiResponse
          | null = null;

        try {
          data =
            (await response.json()) as CheckoutApiResponse;
        } catch {
          data = null;
        }

        const isStockError =
          response.status === 409 ||
          (typeof data?.code ===
            "string" &&
            STOCK_ERROR_CODES.has(
              data.code,
            ));

        if (isStockError) {
          setError(
            getCheckoutErrorMessage(
              data,
              t.stockChanged,
              t.stockChanged,
              t.voucherInvalid,
            ),
          );

          setCreatingOrder(false);
          return;
        }

        const isVoucherError =
          Boolean(
            normalizedVoucherCode,
          ) &&
          (VOUCHER_ERROR_CODES.has(
            typeof data?.code ===
              "string"
              ? data.code
              : "",
          ) ||
            (response.status >= 400 &&
              response.status < 500 &&
              data?.code ===
                "INVALID_VOUCHER"));

        if (isVoucherError) {
          setVoucherPreview(null);

          setVoucherError(
            getCheckoutErrorMessage(
              data,
              t.voucherInvalid,
              t.stockChanged,
              t.voucherInvalid,
            ),
          );

          setStoredVoucherCode("");

          setCreatingOrder(false);
          return;
        }

        if (
          !response.ok ||
          !data?.success ||
          !data.checkoutUrl
        ) {
          throw new Error(
            getCheckoutErrorMessage(
              data,
              t.orderError,
              t.stockChanged,
              t.voucherInvalid,
            ),
          );
        }

        const serverOrder =
          data.order;

        if (
          serverOrder &&
          typeof serverOrder.total ===
            "number" &&
          Number.isFinite(
            serverOrder.total,
          )
        ) {
          console.info(
            "Server checkout total:",
            serverOrder.total,
          );
        }

        window.location.href =
          data.checkoutUrl;
      } catch (
        checkoutError
      ) {
        console.error(
          "Stripe checkout creation failed:",
          checkoutError,
        );

        const message =
          checkoutError instanceof Error &&
          checkoutError.message
            ? checkoutError.message
            : t.orderError;

        if (
          message ===
          t.stockChanged
        ) {
          setError(
            t.stockChanged,
          );
        } else {
          setError(message);
        }

        setCreatingOrder(false);
      }
    };

  return (
    <main className="min-h-screen bg-[var(--background)] px-5 py-10 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <Link
          href="/checkout"
          className="inline-flex text-sm font-semibold text-[var(--brand)] transition hover:opacity-80"
        >
          {t.back}
        </Link>

        <div className="mt-10">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand)] sm:text-sm">
            {t.title}
          </p>

          <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
            {t.title}
          </h1>
        </div>

        {paymentWasCancelled && (
          <div className="mt-8 rounded-2xl border border-[var(--brand-soft)] bg-[var(--surface-soft)] px-5 py-4 text-sm font-medium text-[var(--text-primary)]">
            {t.paymentCancelled}
          </div>
        )}

        {hasUnavailableItems && (
          <div
            role="alert"
            className="mt-8 rounded-[2rem] border border-red-300 bg-red-50 p-5 text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300 sm:p-6"
          >
            <p className="font-bold">
              {t.unavailableItems}
            </p>

            <Link
              href="/cart"
              className="mt-4 inline-flex rounded-full bg-red-600 px-5 py-2.5 text-sm font-bold text-white transition hover:opacity-90"
            >
              {t.backToCart}
            </Link>
          </div>
        )}

        {voucherChecking && (
          <div
            role="status"
            className="mt-8 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-5 py-4 text-sm text-[var(--text-secondary)]"
          >
            {t.voucherChecking}
          </div>
        )}

        {voucherError && (
          <div
            role="alert"
            className="mt-8 rounded-2xl border border-red-300 bg-red-50 px-5 py-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300"
          >
            {voucherError}
          </div>
        )}

        {voucherPreview?.valid === true && (
          <div
            role="status"
            className="mt-8 rounded-2xl border border-green-300 bg-green-50 px-5 py-4 text-sm text-green-700 dark:border-green-900/60 dark:bg-green-950/30 dark:text-green-300"
          >
            <p className="font-semibold">
              {voucherPreview.message ||
                t.voucherApplied}
            </p>

            {voucherPreview.freeDelivery && (
              <p className="mt-1">
                {t.voucherFreeDelivery}
              </p>
            )}
          </div>
        )}

        <div className="mt-8 grid gap-8 lg:mt-10 lg:grid-cols-[1fr_380px]">
          <div className="space-y-6">
            <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm sm:p-8">
              <h2 className="text-xl font-bold sm:text-2xl">
                {t.shippingTo}
              </h2>

              <div className="mt-6 rounded-2xl bg-[var(--surface-soft)] p-5 text-sm leading-7">
                <p className="font-bold">
                  {shippingData.firstName}{" "}
                  {shippingData.lastName}
                </p>

                <p className="mt-2 text-[var(--text-secondary)]">
                  {shippingData.address}

                  {shippingData.apartment
                    ? `, ${shippingData.apartment}`
                    : ""}

                  <br />

                  {shippingData.postalCode}{" "}
                  {shippingData.city}

                  <br />

                  {shippingData.country}
                </p>

                <p className="mt-3 text-[var(--text-secondary)]">
                  {shippingData.email}
                  <br />
                  {shippingData.phone}
                </p>
              </div>

              <p className="mt-4 text-sm text-[var(--text-muted)]">
                {t.germanyOnly}
              </p>
            </section>

            {voucherPreview?.valid === true && (
              <section className="rounded-[2rem] border border-green-200 bg-[var(--surface)] p-6 shadow-sm dark:border-green-900/50 sm:p-8">
                <h2 className="text-xl font-bold sm:text-2xl">
                  {t.voucher}
                </h2>

                <div className="mt-5 rounded-2xl bg-green-50 p-5 dark:bg-green-950/30">
                  <div className="flex items-center justify-between gap-4 text-sm">
                    <span className="font-semibold">
                      {voucherPreview.code}
                    </span>

                    <span className="font-bold text-green-700 dark:text-green-300">
                      {voucherPreview.freeDelivery
                        ? t.free
                        : `-€${voucherPreview.discountAmount.toFixed(
                            2,
                          )}`}
                    </span>
                  </div>

                  {voucherPreview.freeDelivery && (
                    <p className="mt-2 text-xs text-green-700 dark:text-green-300">
                      {t.voucherFreeDelivery}
                    </p>
                  )}
                </div>
              </section>
            )}

            <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm sm:p-8">
              <h2 className="text-xl font-bold sm:text-2xl">
                {t.paymentMethod}
              </h2>

              <div className="mt-6 rounded-2xl border border-[var(--brand-soft)] bg-[var(--surface-soft)] p-6 text-center">
                <div className="text-3xl">
                  💳
                </div>

                <p className="mt-3 font-semibold">
                  {t.stripeDescription}
                </p>
              </div>
            </section>

            {error && (
              <div
                role="alert"
                className="rounded-2xl bg-red-100 px-5 py-4 text-sm font-medium text-red-800 dark:bg-red-950/40 dark:text-red-300"
              >
                <p>{error}</p>

                {error ===
                  t.stockChanged && (
                  <Link
                    href="/cart"
                    className="mt-3 inline-flex font-bold underline"
                  >
                    {t.backToCart}
                  </Link>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={
                createCheckoutSession
              }
              disabled={
                creatingOrder ||
                hasUnavailableItems ||
                voucherIsBlocking
              }
              className={`w-full rounded-full px-7 py-4 text-sm font-bold text-white transition sm:text-base ${
                creatingOrder ||
                hasUnavailableItems ||
                voucherIsBlocking
                  ? "cursor-not-allowed bg-[var(--text-secondary)] opacity-60"
                  : "cursor-pointer bg-[var(--brand)] hover:-translate-y-0.5 hover:opacity-90"
              }`}
            >
              {creatingOrder
                ? t.processing
                : voucherChecking
                  ? t.voucherChecking
                  : t.pay}
            </button>
          </div>

          <aside className="h-fit rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm lg:sticky lg:top-28">
            <h2 className="text-xl font-bold sm:text-2xl">
              {t.order}
            </h2>

            <div className="mt-6 space-y-5">
              {items.map((item) => {
                const productName =
                  item.product.name[
                    language
                  ];

                const variant =
                  resolveCartVariant(
                    item.product,
                    item.colorKey,
                  );

                const unavailable =
                  isCartItemUnavailable(
                    item,
                  );

                const rawImage =
                  variant?.images?.[0] ??
                  item.product.variants?.[0]
                    ?.images?.[0];

                const image =
                  getImageUrl(rawImage);

                const itemTotal =
                  item.unitPrice *
                  item.quantity;

                const color =
                  variant?.color?.[
                    language
                  ] ?? "";

                const selectedSize =
                  item.sizeKey
                    ? sizeLabels[
                        item.sizeKey
                      ]?.[language] ?? ""
                    : "";

                return (
                  <div
                    key={item.cartItemId}
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
                          {
                            item.product
                              .emoji
                          }
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">
                        {productName}
                      </p>

                      {color && (
                        <p className="mt-1 text-xs text-[var(--text-secondary)]">
                          {color}
                        </p>
                      )}

                      {selectedSize && (
                        <p className="mt-1 text-xs text-[var(--text-secondary)]">
                          <span className="font-semibold">
                            {t.size}:
                          </span>{" "}
                          {selectedSize}
                        </p>
                      )}

                      {item.customFields
                        ?.length > 0 && (
                        <div className="mt-1 space-y-0.5">
                          {item.customFields.map(
                            (field) => (
                              <p
                                key={field.id}
                                className="truncate text-xs text-[var(--text-secondary)]"
                              >
                                <span className="font-semibold">
                                  {
                                    field.label
                                  }
                                  :
                                </span>{" "}
                                {
                                  field.value
                                }
                              </p>
                            ),
                          )}
                        </div>
                      )}

                      <p className="mt-1 text-xs text-[var(--text-secondary)]">
                        × {item.quantity}
                      </p>

                      {unavailable && (
                        <p className="mt-1 text-xs font-bold text-red-600 dark:text-red-400">
                          {
                            t.unavailableItem
                          }
                        </p>
                      )}
                    </div>

                    <p className="shrink-0 text-sm font-bold">
                      {unavailable
                        ? "—"
                        : `€${itemTotal.toFixed(
                            2,
                          )}`}
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
                €{totalPrice.toFixed(2)}
              </span>
            </div>

            {discount > 0 && (
              <div className="mt-4 flex justify-between gap-4 text-sm">
                <span className="text-[var(--text-secondary)]">
                  {t.discount}
                  {voucherPreview?.valid ===
                    true &&
                  voucherPreview.code
                    ? ` (${voucherPreview.code})`
                    : ""}
                </span>

                <span className="font-semibold text-[var(--brand-strong)]">
                  -€{discount.toFixed(2)}
                </span>
              </div>
            )}

            <div className="mt-4 flex justify-between gap-4 text-sm">
              <span className="text-[var(--text-secondary)]">
                {t.shipping}
              </span>

              <span
                className={
                  shipping === 0
                    ? "font-semibold text-[var(--brand-strong)]"
                    : "font-semibold"
                }
              >
                {shipping === 0
                  ? t.free
                  : `€${shipping.toFixed(
                      2,
                    )}`}
              </span>
            </div>

            <p className="mt-3 text-xs text-[var(--text-muted)]">
              {t.freeShipping}
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
          </aside>
        </div>
      </div>
    </main>
  );
}

export default function PaymentPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[var(--background)] px-5 py-20">
          <div className="mx-auto max-w-7xl">
            <div className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] px-6 py-16 text-center shadow-sm sm:px-10">
              Loading...
            </div>
          </div>
        </main>
      }
    >
      <PaymentPageContent />
    </Suspense>
  );
}