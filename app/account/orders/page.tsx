"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  useSession,
} from "@/lib/auth-client";

import {
  useLanguage,
  type Language,
} from "@/components/LanguageProvider";

const translations = {
  en: {
    title: "My Orders",
    subtitle:
      "View and track your orders.",
    noOrders:
      "You have no orders yet.",
    startShopping:
      "Start Shopping",
    loginRequired:
      "Please log in to view your orders.",
    login: "Log In",
    loadingOrders:
      "Loading your orders...",
    ordersError:
      "Unable to load your orders. Please try again.",
    orderNumber: "Order",
    date: "Date",
    total: "Total",
    status: "Status",
    viewOrder: "View Order",

    pendingPayment:
      "Pending Payment",
    processing: "Processing",
    shipped: "Shipped",
    delivered: "Delivered",
    cancelled: "Cancelled",

    item: "item",
    itemPlural: "items",

    color: "Color",
    size: "Size",
    small: "Small",
    medium: "Medium",
    large: "Large",
  },

  de: {
    title: "Meine Bestellungen",
    subtitle:
      "Zeige und verfolge deine Bestellungen.",
    noOrders:
      "Du hast noch keine Bestellungen.",
    startShopping:
      "Jetzt einkaufen",
    loginRequired:
      "Bitte melde dich an, um deine Bestellungen zu sehen.",
    login: "Anmelden",
    loadingOrders:
      "Bestellungen werden geladen...",
    ordersError:
      "Deine Bestellungen konnten nicht geladen werden. Bitte versuche es erneut.",
    orderNumber:
      "Bestellung",
    date: "Datum",
    total: "Gesamt",
    status: "Status",
    viewOrder:
      "Bestellung ansehen",

    pendingPayment:
      "Zahlung ausstehend",
    processing: "In Bearbeitung",
    shipped: "Versendet",
    delivered: "Geliefert",
    cancelled: "Storniert",

    item: "Artikel",
    itemPlural: "Artikel",

    color: "Farbe",
    size: "Größe",
    small: "Klein",
    medium: "Mittel",
    large: "Groß",
  },

  ar: {
    title: "طلباتي",
    subtitle:
      "عرض ومتابعة طلباتك.",
    noOrders:
      "لا توجد لديك طلبات حتى الآن.",
    startShopping:
      "ابدأ التسوق",
    loginRequired:
      "يرجى تسجيل الدخول لعرض طلباتك.",
    login: "تسجيل الدخول",
    loadingOrders:
      "جاري تحميل طلباتك...",
    ordersError:
      "تعذر تحميل طلباتك. يرجى المحاولة مرة أخرى.",
    orderNumber:
      "الطلب",
    date: "التاريخ",
    total: "الإجمالي",
    status: "الحالة",
    viewOrder:
      "عرض الطلب",

    pendingPayment:
      "الدفع معلق",
    processing:
      "قيد المعالجة",
    shipped: "تم الشحن",
    delivered: "تم التسليم",
    cancelled: "ملغي",

    item: "منتج",
    itemPlural: "منتجات",

    color: "اللون",
    size: "المقاس",
    small: "صغير",
    medium: "متوسط",
    large: "كبير",
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
};

type Order = {
  id: string;
  status: string;
  paymentStatus: string;
  items: OrderItem[];
  subtotal: number;
  shippingCost: number;
  total: number;
  createdAt: string;
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
        month: "short",
        year: "numeric",
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

export default function OrdersPage() {
  const {
    language,
  } = useLanguage();

  const {
    data: session,
    isPending,
  } = useSession();

  const router = useRouter();

  const t =
    translations[language];

  const [orders, setOrders] =
    useState<Order[]>([]);

  const [
    ordersLoading,
    setOrdersLoading,
  ] = useState(true);

  const [
    ordersError,
    setOrdersError,
  ] = useState("");

  useEffect(() => {
    if (
      isPending ||
      !session?.user
    ) {
      return;
    }

    let cancelled = false;

    const loadOrders =
      async () => {
        setOrdersLoading(
          true
        );

        setOrdersError("");

        try {
          const response =
            await fetch(
              "/api/orders",
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
                t.ordersError
            );
          }

          if (!cancelled) {
            setOrders(
              Array.isArray(
                data.orders
              )
                ? data.orders
                : []
            );
          }
        } catch {
          if (!cancelled) {
            setOrdersError(
              t.ordersError
            );
          }
        } finally {
          if (!cancelled) {
            setOrdersLoading(
              false
            );
          }
        }
      };

    loadOrders();

    return () => {
      cancelled = true;
    };
  }, [
    isPending,
    session?.user,
    t.ordersError,
  ]);

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
            onClick={() =>
              router.push(
                "/login"
              )
            }
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
      dir={
        language === "ar"
          ? "rtl"
          : "ltr"
      }
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

      {ordersLoading ? (
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center">
          <p className="text-[var(--text-secondary)]">
            {t.loadingOrders}
          </p>
        </div>
      ) : ordersError ? (
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center">
          <p className="text-sm text-red-800 dark:text-red-300">
            {ordersError}
          </p>

          <button
            type="button"
            onClick={() =>
              window.location.reload()
            }
            className="mt-5 rounded-full bg-[var(--brand)] px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
          >
            {t.viewOrder}
          </button>
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center">
          <p className="text-[var(--text-secondary)]">
            {t.noOrders}
          </p>

          <button
            type="button"
            onClick={() =>
              router.push(
                "/shop"
              )
            }
            className="mt-5 rounded-full bg-[var(--brand-soft)] px-5 py-2.5 text-sm font-semibold text-[var(--brand-strong)] transition hover:opacity-80"
          >
            {t.startShopping}
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {orders.map(
            (order) => (
              <article
                key={order.id}
                className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]"
              >
                <div className="border-b border-[var(--border)] p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)]">
                        {t.orderNumber}
                      </p>

                      <p className="mt-1 text-lg font-black text-[var(--text-primary)]">
                        {order.id}
                      </p>

                      <p className="mt-1 text-sm text-[var(--text-secondary)]">
                        {formatOrderDate(
                          order.createdAt,
                          language
                        )}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2 sm:justify-end">
                      <span className="rounded-full bg-[var(--brand-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--brand-strong)]">
                        {getOrderStatusLabel(
                          order.status,
                          t
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="divide-y divide-[var(--border)]">
                  {order.items.map(
                    (
                      item,
                      index
                    ) => {
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

                      return (
                        <div
                          key={`${order.id}-${item.productId}-${item.colorKey ?? "default"}-${item.sizeKey ?? "default"}-${index}`}
                          className="flex gap-4 p-5"
                        >
                          {item.image ? (
                            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
                              <Image
                                src={
                                  item.image
                                }
                                alt={
                                  item.name
                                }
                                fill
                                sizes="64px"
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface)] text-xs text-[var(--text-secondary)]">
                              3D
                            </div>
                          )}

                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-[var(--text-primary)]">
                              {item.name}
                            </p>

                            <div className="mt-2 space-y-1 text-sm text-[var(--text-secondary)]">
                              {colorName && (
                                <p>
                                  <span className="font-medium text-[var(--text-primary)]">
                                    {t.color}:
                                  </span>{" "}
                                  {colorName}
                                </p>
                              )}

                              {sizeLabel && (
                                <p>
                                  <span className="font-medium text-[var(--text-primary)]">
                                    {t.size}:
                                  </span>{" "}
                                  {sizeLabel}
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
                                      <span className="font-medium text-[var(--text-primary)]">
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

                              <p className="pt-1">
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

                          <div className="shrink-0 text-right rtl:text-left">
                            <p className="font-bold text-[var(--text-primary)]">
                              €
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
                    }
                  )}
                </div>

                <div className="border-t border-[var(--border)] p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center justify-between sm:gap-6">
                      <span className="font-semibold text-[var(--text-primary)]">
                        {t.total}
                      </span>

                      <span className="text-xl font-black text-[var(--brand-strong)]">
                        €
                        {order.total.toFixed(
                          2
                        )}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        router.push(
                          `/account/orders/${encodeURIComponent(
                            order.id
                          )}`
                        )
                      }
                      className="w-full rounded-full bg-[var(--brand)] px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 sm:w-auto"
                    >
                      {t.viewOrder}
                    </button>
                  </div>
                </div>
              </article>
            )
          )}
        </div>
      )}
    </main>
  );
}