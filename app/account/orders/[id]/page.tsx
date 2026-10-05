"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import {
  useLanguage,
  type Language,
} from "@/components/LanguageProvider";

const translations = {
  en: {
    title: "Order Details",
    order: "Order",
    back: "Back to My Orders",
    date: "Order Date",
    status: "Status",
    payment: "Payment",
    items: "Items",
    shippingAddress:
      "Shipping Address",
    subtotal: "Subtotal",
    discount: "Discount",
    voucher: "Voucher",
    shipping: "Shipping",
    free: "Free",
    total: "Total",

    pendingPayment:
      "Pending Payment",
    processing: "Processing",
    shipped: "Shipped",
    delivered: "Delivered",
    cancelled: "Cancelled",

    pending: "Pending",
    paid: "Paid",

    orderPlaced: "Order Placed",
    paymentConfirmed:
      "Payment Confirmed",
    paymentPending:
      "Payment Pending",
    processingStep: "Processing",
    shippedStep: "Shipped",
    deliveredStep: "Delivered",
    cancelledStep:
      "Order Cancelled",

    currentStep: "Current",
    loading: "Loading order...",
    error:
      "Unable to load this order.",
    notFound: "Order not found.",

    item: "item",
    itemPlural: "items",

    color: "Color",
    size: "Size",
    small: "Small",
    medium: "Medium",
    large: "Large",

    contactSupport:
      "Contact Support",

    cancelOrder:
      "Cancel Order",
    cancelOrderTitle:
      "Cancel this order?",
    cancelOrderMessage:
      "Are you sure you want to cancel this order? This action cannot be undone.",
    keepOrder: "Keep Order",
    confirmCancel:
      "Yes, Cancel Order",
    cancelling: "Cancelling...",
    cancelSuccess:
      "Your order has been cancelled.",
    cancelError:
      "Unable to cancel this order.",
    cancelNotAllowed:
      "This order can no longer be cancelled.",
  },

  de: {
    title: "Bestelldetails",
    order: "Bestellung",
    back:
      "Zurück zu meinen Bestellungen",
    date: "Bestelldatum",
    status: "Status",
    payment: "Zahlung",
    items: "Artikel",
    shippingAddress:
      "Lieferadresse",
    subtotal: "Zwischensumme",
    discount: "Rabatt",
    voucher: "Gutschein",
    shipping: "Versand",
    free: "Kostenlos",
    total: "Gesamt",

    pendingPayment:
      "Zahlung ausstehend",
    processing: "In Bearbeitung",
    shipped: "Versendet",
    delivered: "Geliefert",
    cancelled: "Storniert",

    pending: "Ausstehend",
    paid: "Bezahlt",

    orderPlaced:
      "Bestellung aufgegeben",
    paymentConfirmed:
      "Zahlung bestätigt",
    paymentPending:
      "Zahlung ausstehend",
    processingStep:
      "In Bearbeitung",
    shippedStep: "Versendet",
    deliveredStep: "Geliefert",
    cancelledStep:
      "Bestellung storniert",

    currentStep: "Aktuell",
    loading:
      "Bestellung wird geladen...",
    error:
      "Diese Bestellung konnte nicht geladen werden.",
    notFound:
      "Bestellung nicht gefunden.",

    item: "Artikel",
    itemPlural: "Artikel",

    color: "Farbe",
    size: "Größe",
    small: "Klein",
    medium: "Mittel",
    large: "Groß",

    contactSupport:
      "Support kontaktieren",

    cancelOrder:
      "Bestellung stornieren",
    cancelOrderTitle:
      "Bestellung stornieren?",
    cancelOrderMessage:
      "Möchtest du diese Bestellung wirklich stornieren? Diese Aktion kann nicht rückgängig gemacht werden.",
    keepOrder:
      "Bestellung behalten",
    confirmCancel:
      "Ja, Bestellung stornieren",
    cancelling:
      "Wird storniert...",
    cancelSuccess:
      "Deine Bestellung wurde storniert.",
    cancelError:
      "Diese Bestellung konnte nicht storniert werden.",
    cancelNotAllowed:
      "Diese Bestellung kann nicht mehr storniert werden.",
  },

  ar: {
    title: "تفاصيل الطلب",
    order: "الطلب",
    back: "العودة إلى طلباتي",
    date: "تاريخ الطلب",
    status: "الحالة",
    payment: "الدفع",
    items: "المنتجات",
    shippingAddress:
      "عنوان الشحن",
    subtotal: "المجموع الفرعي",
    discount: "الخصم",
    voucher: "القسيمة",
    shipping: "الشحن",
    free: "مجاني",
    total: "الإجمالي",

    pendingPayment:
      "الدفع معلق",
    processing: "قيد المعالجة",
    shipped: "تم الشحن",
    delivered: "تم التسليم",
    cancelled: "ملغي",

    pending: "معلق",
    paid: "تم الدفع",

    orderPlaced:
      "تم إنشاء الطلب",
    paymentConfirmed:
      "تم تأكيد الدفع",
    paymentPending:
      "الدفع معلق",
    processingStep:
      "قيد التجهيز",
    shippedStep: "تم الشحن",
    deliveredStep:
      "تم التسليم",
    cancelledStep:
      "تم إلغاء الطلب",

    currentStep: "الحالية",
    loading:
      "جاري تحميل الطلب...",
    error:
      "تعذر تحميل هذا الطلب.",
    notFound:
      "الطلب غير موجود.",

    item: "منتج",
    itemPlural: "منتجات",

    color: "اللون",
    size: "المقاس",
    small: "صغير",
    medium: "متوسط",
    large: "كبير",

    contactSupport:
      "تواصل مع الدعم",

    cancelOrder:
      "إلغاء الطلب",
    cancelOrderTitle:
      "إلغاء الطلب؟",
    cancelOrderMessage:
      "هل أنت متأكد أنك تريد إلغاء هذا الطلب؟ لا يمكن التراجع عن هذا الإجراء.",
    keepOrder:
      "الاحتفاظ بالطلب",
    confirmCancel:
      "نعم، إلغاء الطلب",
    cancelling:
      "جاري الإلغاء...",
    cancelSuccess:
      "تم إلغاء طلبك بنجاح.",
    cancelError:
      "تعذر إلغاء هذا الطلب.",
    cancelNotAllowed:
      "لم يعد من الممكن إلغاء هذا الطلب.",
  },
};

type ProductSizeKey =
  | "small"
  | "medium"
  | "large";

type LocalizedColor = {
  en: string;
  de: string;
  ar: string;
};

type CustomFieldValue = {
  id: string;
  label: string;
  value: string;
};

type OrderItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;

  colorKey?: string;

  color?: LocalizedColor;

  colorName?: string;

  sizeKey?:
    | ProductSizeKey
    | "";

  customFields?:
    | CustomFieldValue[];

  image?: string;
  productSlug?: string;
};

type ShippingData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  apartment?: string;
  postalCode: string;
  city: string;
  country: string;
};

type Order = {
  id: string;
  status: string;
  paymentStatus: string;
  items: OrderItem[];
  shipping: ShippingData;
  subtotal: number;
  discountAmount?: number;
  voucherCode?: string | null;
  voucherType?: string | null;
  freeDelivery?: boolean;
  shippingCost: number;
  total: number;
  createdAt: string;
};

type TimelineState = {
  placed: boolean;
  payment: boolean;
  processing: boolean;
  shipped: boolean;
  delivered: boolean;
};

function getOrderStatusLabel(
  status: string,
  t: (typeof translations)[Language]
) {
  switch (status) {
    case "pending_payment":
      return t.pendingPayment;

    case "processing":
      return t.processing;

    case "shipped":
      return t.shipped;

    case "delivered":
      return t.delivered;

    case "cancelled":
      return t.cancelled;

    default:
      return status;
  }
}

function getPaymentStatusLabel(
  status: string,
  t: (typeof translations)[Language]
) {
  switch (status) {
    case "pending":
      return t.pending;

    case "paid":
      return t.paid;

    default:
      return status;
  }
}

function formatOrderDate(
  date: string,
  language: Language
) {
  try {
    return new Intl.DateTimeFormat(
      language === "de"
        ? "de-DE"
        : language === "ar"
          ? "ar-DE"
          : "en-DE",
      {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    ).format(new Date(date));
  } catch {
    return date;
  }
}

function getLocalizedColor(
  color: LocalizedColor | undefined,
  language: Language,
  fallback?: string
) {
  if (!color) {
    return fallback;
  }

  return (
    color[language]?.trim() ||
    color.en?.trim() ||
    color.de?.trim() ||
    color.ar?.trim() ||
    fallback
  );
}

function getSizeLabel(
  sizeKey:
    | ProductSizeKey
    | ""
    | undefined,
  t: (typeof translations)[Language]
) {
  switch (sizeKey) {
    case "small":
      return t.small;

    case "medium":
      return t.medium;

    case "large":
      return t.large;

    default:
      return "";
  }
}

function getTimelineState(
  status: string,
  paymentStatus: string
): TimelineState {
  switch (status) {
    case "pending_payment":
      return {
        placed: true,
        payment:
          paymentStatus === "paid",
        processing: false,
        shipped: false,
        delivered: false,
      };

    case "processing":
      return {
        placed: true,
        payment:
          paymentStatus === "paid",
        processing: true,
        shipped: false,
        delivered: false,
      };

    case "shipped":
      return {
        placed: true,
        payment:
          paymentStatus === "paid",
        processing: true,
        shipped: true,
        delivered: false,
      };

    case "delivered":
      return {
        placed: true,
        payment:
          paymentStatus === "paid",
        processing: true,
        shipped: true,
        delivered: true,
      };

    case "cancelled":
      return {
        placed: true,
        payment:
          paymentStatus === "paid",
        processing: false,
        shipped: false,
        delivered: false,
      };

    default:
      return {
        placed: true,
        payment:
          paymentStatus === "paid",
        processing: false,
        shipped: false,
        delivered: false,
      };
  }
}

function getCurrentTimelineStep(
  status: string,
  paymentStatus: string
) {
  if (
    status === "cancelled"
  ) {
    return "cancelled";
  }

  if (
    status === "pending_payment" &&
    paymentStatus !== "paid"
  ) {
    return "payment";
  }

  switch (status) {
    case "processing":
      return "processing";

    case "shipped":
      return "shipped";

    case "delivered":
      return "delivered";

    default:
      return "payment";
  }
}

function TimelineStep({
  title,
  active,
  completed,
  last,
  currentLabel,
}: {
  title: string;
  active: boolean;
  completed: boolean;
  last?: boolean;
  currentLabel?: string;
}) {
  return (
    <div className="relative flex gap-4">
      <div className="flex flex-col items-center">
        <div
          className={[
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold transition",
            completed
              ? "border-[var(--brand)] bg-[var(--brand)] text-white"
              : active
                ? "border-[var(--brand)] bg-[var(--surface)] text-[var(--brand)]"
                : "border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)]",
          ].join(" ")}
        >
          {completed
            ? "✓"
            : active
              ? "●"
              : ""}
        </div>

        {!last && (
          <div
            className={[
              "mt-1 h-12 w-0.5",
              completed
                ? "bg-[var(--brand)]"
                : "bg-[var(--border)]",
            ].join(" ")}
          />
        )}
      </div>

      <div className="flex min-h-12 flex-1 items-start justify-between gap-3 pt-1">
        <p
          className={[
            "font-semibold",
            completed || active
              ? "text-[var(--text-primary)]"
              : "text-[var(--text-secondary)]",
          ].join(" ")}
        >
          {title}
        </p>

        {active &&
          !completed &&
          currentLabel && (
            <span className="shrink-0 rounded-full bg-[var(--brand-soft)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[var(--brand-strong)]">
              {currentLabel}
            </span>
          )}
      </div>
    </div>
  );
}

export default function OrderDetailsPage() {
  const {
    language,
  } = useLanguage();

  const params =
    useParams<{
      id: string;
    }>();

  const t =
    translations[language];

  const [order, setOrder] =
    useState<Order | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [
    showCancelDialog,
    setShowCancelDialog,
  ] = useState(false);

  const [
    cancelling,
    setCancelling,
  ] = useState(false);

  const [
    cancelError,
    setCancelError,
  ] = useState("");

  const [
    cancelSuccess,
    setCancelSuccess,
  ] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadOrder() {
      if (!params.id) {
        return;
      }

      setLoading(true);
      setError("");

      try {
        const response =
          await fetch(
            `/api/orders/${encodeURIComponent(
              params.id
            )}`,
            {
              method: "GET",
              cache: "no-store",
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data?.error ||
              t.error
          );
        }

        if (!cancelled) {
          setOrder(
            data.order ??
              null
          );
        }
      } catch {
        if (!cancelled) {
          setError(t.error);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadOrder();

    return () => {
      cancelled = true;
    };
  }, [
    params.id,
    t.error,
  ]);

  async function handleCancelOrder() {
    if (
      !order ||
      cancelling
    ) {
      return;
    }

    setCancelling(true);
    setCancelError("");
    setCancelSuccess("");

    try {
      const response =
        await fetch(
          `/api/orders/${encodeURIComponent(
            order.id
          )}`,
          {
            method: "DELETE",
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        if (
          response.status ===
          409
        ) {
          throw new Error(
            data?.error ||
              t.cancelNotAllowed
          );
        }

        throw new Error(
          data?.error ||
            t.cancelError
        );
      }

      setOrder(
        (currentOrder) =>
          currentOrder
            ? {
                ...currentOrder,
                status:
                  "cancelled",
              }
            : currentOrder
      );

      setShowCancelDialog(
        false
      );

      setCancelSuccess(
        t.cancelSuccess
      );
    } catch (error) {
      setCancelError(
        error instanceof
          Error
          ? error.message
          : t.cancelError
      );
    } finally {
      setCancelling(false);
    }
  }

  if (loading) {
    return (
      <main
        dir={
          language === "ar"
            ? "rtl"
            : "ltr"
        }
        className="mx-auto max-w-5xl px-4 py-12 sm:px-6"
      >
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-10 text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-pulse rounded-full bg-[var(--brand-soft)]" />

          <p className="text-[var(--text-secondary)]">
            {t.loading}
          </p>
        </div>
      </main>
    );
  }

  if (
    error ||
    !order
  ) {
    return (
      <main
        dir={
          language === "ar"
            ? "rtl"
            : "ltr"
        }
        className="mx-auto max-w-5xl px-4 py-12 sm:px-6"
      >
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-10 text-center">
          <h1 className="text-2xl font-black text-[var(--text-primary)]">
            {t.notFound}
          </h1>

          <p className="mt-3 text-[var(--text-secondary)]">
            {error ||
              t.error}
          </p>

          <Link
            href="/account/orders"
            className="mt-6 inline-flex rounded-full bg-[var(--brand)] px-6 py-3 font-semibold text-white transition hover:opacity-90"
          >
            {t.back}
          </Link>
        </div>
      </main>
    );
  }

  const timeline =
    getTimelineState(
      order.status,
      order.paymentStatus
    );

  const currentStep =
    getCurrentTimelineStep(
      order.status,
      order.paymentStatus
    );

  const canCancel =
    order.status ===
      "pending_payment" &&
    order.paymentStatus ===
      "pending";

  const isCancelled =
    order.status ===
    "cancelled";

  const discountAmount =
    typeof order.discountAmount ===
      "number" &&
    Number.isFinite(
      order.discountAmount
    )
      ? order.discountAmount
      : 0;

  const hasDiscount =
    discountAmount > 0;

  const hasVoucher =
    typeof order.voucherCode ===
      "string" &&
    order.voucherCode.trim()
      .length > 0;

  return (
    <main
      dir={
        language === "ar"
          ? "rtl"
          : "ltr"
      }
      className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14"
    >
      <div className="mb-8">
        <Link
          href="/account/orders"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--brand-strong)] transition hover:opacity-80"
        >
          <span aria-hidden="true">
            {language === "ar"
              ? "→"
              : "←"}
          </span>

          {t.back}
        </Link>

        <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium text-[var(--text-secondary)]">
              {t.order}
            </p>

            <h1 className="mt-1 break-all text-3xl font-black text-[var(--text-primary)] sm:text-4xl">
              {order.id}
            </h1>

            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              {formatOrderDate(
                order.createdAt,
                language
              )}
            </p>
          </div>

          <div className="flex flex-wrap gap-2 sm:justify-end">
            <span
              className={[
                "rounded-full px-4 py-2 text-sm font-semibold",
                isCancelled
                  ? "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300"
                  : "bg-[var(--brand-soft)] text-[var(--brand-strong)]",
              ].join(" ")}
            >
              {getOrderStatusLabel(
                order.status,
                t
              )}
            </span>

            <span className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-semibold text-[var(--text-secondary)]">
              {t.payment}:{" "}
              {getPaymentStatusLabel(
                order.paymentStatus,
                t
              )}
            </span>
          </div>
        </div>
      </div>

      {cancelSuccess && (
        <div className="mb-6 rounded-2xl border border-green-200 bg-green-50 px-4 py-4 text-sm font-semibold text-green-800 dark:border-green-900/40 dark:bg-green-950/30 dark:text-green-300">
          {cancelSuccess}
        </div>
      )}

      {cancelError &&
        !showCancelDialog && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm font-semibold text-red-800 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
            {cancelError}
          </div>
        )}

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm sm:p-7">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-bold text-[var(--text-primary)]">
                {t.items}
              </h2>

              <span className="text-sm text-[var(--text-secondary)]">
                {order.items.reduce(
                  (
                    sum,
                    item
                  ) =>
                    sum +
                    item.quantity,
                  0
                )}{" "}
                {order.items.reduce(
                  (
                    sum,
                    item
                  ) =>
                    sum +
                    item.quantity,
                  0
                ) === 1
                  ? t.item
                  : t.itemPlural}
              </span>
            </div>

            <div className="mt-4 divide-y divide-[var(--border)]">
              {order.items.map(
                (
                  item,
                  index
                ) => {
                  const productHref =
                    item.productSlug
                      ? `/products/${encodeURIComponent(
                          item.productSlug
                        )}`
                      : null;

                  const colorName =
                    getLocalizedColor(
                      item.color,
                      language,
                      item.colorName
                    );

                  const sizeLabel =
                    getSizeLabel(
                      item.sizeKey,
                      t
                    );

                  const productContent = (
                    <div
                      className={[
                        "flex gap-4 py-3",
                        productHref
                          ? "cursor-pointer rounded-2xl transition hover:bg-[var(--surface-soft)]"
                          : "",
                      ].join(" ")}
                    >
                      {item.image ? (
                        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)]">
                          <Image
                            src={
                              item.image
                            }
                            alt={
                              item.name
                            }
                            fill
                            sizes="80px"
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] text-xs text-[var(--text-secondary)]">
                          3D
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-[var(--text-primary)]">
                          {item.name}
                        </h3>

                        <div className="mt-2 space-y-1 text-xs text-[var(--text-secondary)]">
                          {colorName && (
                            <p>
                              <span className="font-semibold text-[var(--text-primary)]">
                                {t.color}:
                              </span>{" "}
                              {
                                colorName
                              }
                            </p>
                          )}

                          {sizeLabel && (
                            <p>
                              <span className="font-semibold text-[var(--text-primary)]">
                                {t.size}:
                              </span>{" "}
                              {
                                sizeLabel
                              }
                            </p>
                          )}

                          {Array.isArray(
                            item.customFields
                          ) &&
                            item.customFields.map(
                              (
                                field,
                                fieldIndex
                              ) => (
                                <p
                                  key={`${field.id}-${fieldIndex}`}
                                >
                                  <span className="font-semibold text-[var(--text-primary)]">
                                    {
                                      field.label
                                    }
                                    :
                                  </span>{" "}
                                  {
                                    field.value
                                  }
                                </p>
                              )
                            )}

                          <p className="pt-1 text-sm">
                            {
                              item.quantity
                            }{" "}
                            {item.quantity ===
                            1
                              ? t.item
                              : t.itemPlural}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 self-start text-right rtl:text-left">
                        <p className="font-black text-[var(--text-primary)]">
                          €{" "}
                          {(
                            item.price *
                            item.quantity
                          ).toFixed(
                            2
                          )}
                        </p>

                        {item.quantity >
                          1 && (
                          <p className="mt-1 text-xs text-[var(--text-secondary)]">
                            €
                            {item.price.toFixed(
                              2
                            )}{" "}
                            ×{" "}
                            {
                              item.quantity
                            }
                          </p>
                        )}
                      </div>
                    </div>
                  );

                  return productHref ? (
                    <Link
                      key={`${item.productId}-${item.colorKey ?? "default"}-${item.sizeKey ?? "default"}-${index}`}
                      href={
                        productHref
                      }
                      className="block"
                      aria-label={
                        item.name
                      }
                    >
                      {
                        productContent
                      }
                    </Link>
                  ) : (
                    <div
                      key={`${item.productId}-${item.colorKey ?? "default"}-${item.sizeKey ?? "default"}-${index}`}
                    >
                      {
                        productContent
                      }
                    </div>
                  );
                }
              )}
            </div>
          </section>

          <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm sm:p-7">
            <h2 className="text-xl font-bold text-[var(--text-primary)]">
              {t.shippingAddress}
            </h2>

            <div className="mt-5 rounded-2xl bg-[var(--surface-soft)] p-5">
              <p className="font-semibold text-[var(--text-primary)]">
                {
                  order.shipping
                    .firstName
                }{" "}
                {
                  order.shipping
                    .lastName
                }
              </p>

              <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                {
                  order.shipping
                    .address
                }

                {order.shipping
                  .apartment
                  ? `, ${order.shipping.apartment}`
                  : ""}

                <br />

                {
                  order.shipping
                    .postalCode
                }{" "}
                {
                  order.shipping
                    .city
                }

                <br />

                {
                  order.shipping
                    .country
                }
              </p>

              <div className="mt-4 border-t border-[var(--border)] pt-4 text-sm text-[var(--text-secondary)]">
                <p>
                  {
                    order.shipping
                      .email
                  }
                </p>

                <p className="mt-1">
                  {
                    order.shipping
                      .phone
                  }
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm sm:p-7">
            <div>
              <h2 className="text-xl font-bold text-[var(--text-primary)]">
                {t.status}
              </h2>

              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                {getOrderStatusLabel(
                  order.status,
                  t
                )}
              </p>
            </div>

            {isCancelled ? (
              <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 dark:border-red-900/40 dark:bg-red-950/30">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">
                    ×
                  </div>

                  <div>
                    <p className="font-bold text-red-800 dark:text-red-300">
                      {
                        t.cancelledStep
                      }
                    </p>

                    <p className="mt-1 text-sm text-red-700 dark:text-red-400">
                      {
                        t.cancelled
                      }
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-6">
                <TimelineStep
                  title={
                    t.orderPlaced
                  }
                  active={false}
                  completed={
                    timeline.placed
                  }
                />

                <TimelineStep
                  title={
                    order.paymentStatus ===
                    "paid"
                      ? t.paymentConfirmed
                      : t.paymentPending
                  }
                  active={
                    currentStep ===
                    "payment"
                  }
                  completed={
                    timeline.payment
                  }
                  currentLabel={
                    currentStep ===
                    "payment"
                      ? t.currentStep
                      : undefined
                  }
                />

                <TimelineStep
                  title={
                    t.processingStep
                  }
                  active={
                    currentStep ===
                    "processing"
                  }
                  completed={
                    timeline.processing
                  }
                  currentLabel={
                    currentStep ===
                    "processing"
                      ? t.currentStep
                      : undefined
                  }
                />

                <TimelineStep
                  title={
                    t.shippedStep
                  }
                  active={
                    currentStep ===
                    "shipped"
                  }
                  completed={
                    timeline.shipped
                  }
                  currentLabel={
                    currentStep ===
                    "shipped"
                      ? t.currentStep
                      : undefined
                  }
                />

                <TimelineStep
                  title={
                    t.deliveredStep
                  }
                  active={
                    currentStep ===
                    "delivered"
                  }
                  completed={
                    timeline.delivered
                  }
                  currentLabel={
                    currentStep ===
                    "delivered"
                      ? t.currentStep
                      : undefined
                  }
                  last
                />
              </div>
            )}

            <div className="mt-6 flex flex-col gap-3 border-t border-[var(--border)] pt-6 sm:flex-row sm:flex-wrap">
              <Link
                href={`/help?order=${encodeURIComponent(
                  order.id
                )}`}
                className="inline-flex w-full items-center justify-center rounded-full bg-[var(--brand)] px-5 py-3 text-sm font-bold text-white transition hover:opacity-90 sm:w-auto"
              >
                {
                  t.contactSupport
                }
              </Link>

              {canCancel && (
                <button
                  type="button"
                  onClick={() => {
                    setCancelError(
                      ""
                    );

                    setShowCancelDialog(
                      true
                    );
                  }}
                  className="inline-flex w-full items-center justify-center rounded-full border border-red-300 bg-red-50 px-5 py-3 text-sm font-bold text-red-700 transition hover:bg-red-100 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300 dark:hover:bg-red-950/40 sm:w-auto"
                >
                  {
                    t.cancelOrder
                  }
                </button>
              )}
            </div>
          </section>
        </div>

        <aside className="h-fit rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm sm:p-7 lg:sticky lg:top-24">
          <h2 className="text-xl font-bold text-[var(--text-primary)]">
            {t.total}
          </h2>

          <div className="mt-5 space-y-4 text-sm">
            <div className="flex items-center justify-between gap-4">
              <span className="text-[var(--text-secondary)]">
                {t.subtotal}
              </span>

              <span className="font-semibold text-[var(--text-primary)]">
                €
                {order.subtotal.toFixed(
                  2
                )}
              </span>
            </div>

            {hasDiscount && (
              <div className="flex items-center justify-between gap-4">
                <span className="text-[var(--text-secondary)]">
                  {t.discount}
                </span>

                <span className="font-semibold text-green-700 dark:text-green-400">
                  -€
                  {discountAmount.toFixed(
                    2
                  )}
                </span>
              </div>
            )}

            {hasVoucher && (
              <div className="flex items-center justify-between gap-4">
                <span className="text-[var(--text-secondary)]">
                  {t.voucher}
                </span>

                <span className="rounded-full bg-[var(--brand-soft)] px-3 py-1 font-bold tracking-wide text-[var(--brand-strong)]">
                  {order.voucherCode}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between gap-4">
              <span className="text-[var(--text-secondary)]">
                {t.shipping}
              </span>

              <span className="font-semibold text-[var(--text-primary)]">
                {order.shippingCost ===
                0
                  ? t.free
                  : `€${order.shippingCost.toFixed(
                      2
                    )}`}
              </span>
            </div>

            <div className="border-t border-[var(--border)] pt-4">
              <div className="flex items-center justify-between gap-4">
                <span className="text-base font-bold text-[var(--text-primary)]">
                  {t.total}
                </span>

                <span className="text-2xl font-black text-[var(--brand-strong)]">
                  €
                  {order.total.toFixed(
                    2
                  )}
                </span>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {showCancelDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cancel-order-title"
        >
          <div className="w-full max-w-md rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl sm:p-7">
            <h2
              id="cancel-order-title"
              className="text-xl font-black text-[var(--text-primary)]"
            >
              {
                t.cancelOrderTitle
              }
            </h2>

            <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
              {
                t.cancelOrderMessage
              }
            </p>

            {cancelError && (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
                {cancelError}
              </div>
            )}

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={
                  cancelling
                }
                onClick={() => {
                  if (
                    !cancelling
                  ) {
                    setShowCancelDialog(
                      false
                    );

                    setCancelError(
                      ""
                    );
                  }
                }}
                className="rounded-full border border-[var(--border)] px-5 py-3 text-sm font-bold text-[var(--text-primary)] transition hover:bg-[var(--surface-soft)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {t.keepOrder}
              </button>

              <button
                type="button"
                disabled={
                  cancelling
                }
                onClick={
                  handleCancelOrder
                }
                className="rounded-full bg-red-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {cancelling
                  ? t.cancelling
                  : t.confirmCancel}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}