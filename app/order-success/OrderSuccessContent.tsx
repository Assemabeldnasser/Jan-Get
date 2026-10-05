"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { useCart } from "@/components/CartProvider";
import { useLanguage } from "@/components/LanguageProvider";

type OrderData = {
  id: string;
  status: string;
  paymentStatus: string;
};

const translations = {
  en: {
    title: "Order received!",
    message:
      "Thank you for your order. Your order has been successfully created.",
    paymentConfirmed:
      "Your payment has been confirmed and your order is now being processed.",
    paymentPending:
      "Your payment is still being confirmed. This may take a few moments.",
    paymentFailed:
      "Unfortunately, the payment was not completed. Please check your order status.",
    orderNumber: "Order number",
    account:
      "You can view your order and its status from your account.",
    viewOrder: "View Order",
    continue: "Continue Shopping",
    missingOrder:
      "We could not find your order number. Please check your account for your latest orders.",
    goToAccount: "Go to Account",
    loading: "Checking payment status...",
  },

  de: {
    title: "Bestellung erhalten!",
    message:
      "Vielen Dank für deine Bestellung. Deine Bestellung wurde erfolgreich erstellt.",
    paymentConfirmed:
      "Deine Zahlung wurde bestätigt und deine Bestellung wird jetzt bearbeitet.",
    paymentPending:
      "Deine Zahlung wird noch bestätigt. Dies kann einen Moment dauern.",
    paymentFailed:
      "Die Zahlung wurde leider nicht abgeschlossen. Bitte überprüfe den Status deiner Bestellung.",
    orderNumber: "Bestellnummer",
    account:
      "Du kannst deine Bestellung und ihren Status in deinem Konto sehen.",
    viewOrder: "Bestellung ansehen",
    continue: "Weiter einkaufen",
    missingOrder:
      "Die Bestellnummer konnte nicht gefunden werden. Bitte überprüfe dein Konto auf deine letzte Bestellung.",
    goToAccount: "Zum Konto",
    loading: "Zahlungsstatus wird überprüft...",
  },

  ar: {
    title: "تم استلام طلبك!",
    message:
      "شكرًا لك على طلبك. تم إنشاء طلبك بنجاح.",
    paymentConfirmed:
      "تم تأكيد الدفع، ويجري الآن تجهيز طلبك.",
    paymentPending:
      "جارٍ تأكيد عملية الدفع. قد يستغرق ذلك بضع لحظات.",
    paymentFailed:
      "للأسف لم تكتمل عملية الدفع. يرجى التحقق من حالة طلبك.",
    orderNumber: "رقم الطلب",
    account:
      "يمكنك مشاهدة طلبك وحالته من خلال حسابك.",
    viewOrder: "عرض الطلب",
    continue: "متابعة التسوق",
    missingOrder:
      "لم نتمكن من العثور على رقم الطلب. يرجى التحقق من حسابك لمشاهدة أحدث طلباتك.",
    goToAccount: "الذهاب إلى الحساب",
    loading: "جارٍ التحقق من حالة الدفع...",
  },
};

export default function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const { language } = useLanguage();
  const { clearCart } = useCart();

  const t = translations[language];

  const orderNumber = searchParams.get("order")?.trim() ?? "";

  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(Boolean(orderNumber));

  const cartCleared = useRef(false);

  const orderLink = orderNumber
    ? `/account/orders/${encodeURIComponent(orderNumber)}`
    : "/account";

  useEffect(() => {
    if (!orderNumber) {
      return;
    }

    let cancelled = false;
    let attempts = 0;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const checkOrder = async () => {
      attempts += 1;

      try {
        const response = await fetch(
          `/api/orders/${encodeURIComponent(orderNumber)}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error("Unable to load order.");
        }

        const data = await response.json();

        if (cancelled) {
          return;
        }

        const loadedOrder: OrderData = {
          id: data.order?.id ?? orderNumber,
          status:
            data.order?.status ?? "pending_payment",
          paymentStatus:
            data.order?.paymentStatus ?? "pending",
        };

        setOrder(loadedOrder);

        /*
         * Clear the cart ONLY after the server confirms
         * that the payment has actually been completed.
         *
         * The ref prevents the cart from being cleared
         * repeatedly if the component re-renders.
         */
        if (
          loadedOrder.paymentStatus === "paid" &&
          !cartCleared.current
        ) {
          cartCleared.current = true;
          clearCart();
        }

        if (
          loadedOrder.paymentStatus === "paid" ||
          loadedOrder.paymentStatus === "failed" ||
          loadedOrder.paymentStatus === "expired" ||
          attempts >= 6
        ) {
          setLoading(false);
          return;
        }

        timeoutId = setTimeout(
          checkOrder,
          1500
        );
      } catch {
        if (cancelled) {
          return;
        }

        if (attempts >= 6) {
          setLoading(false);
          return;
        }

        timeoutId = setTimeout(
          checkOrder,
          1500
        );
      }
    };

    checkOrder();

    return () => {
      cancelled = true;

      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [orderNumber, clearCart]);

  const getPaymentMessage = () => {
    if (!order) {
      return loading
        ? t.loading
        : t.paymentPending;
    }

    if (order.paymentStatus === "paid") {
      return t.paymentConfirmed;
    }

    if (
      order.paymentStatus === "failed" ||
      order.paymentStatus === "expired"
    ) {
      return t.paymentFailed;
    }

    return t.paymentPending;
  };

  const isPaid =
    order?.paymentStatus === "paid";

  return (
    <main
      dir={language === "ar" ? "rtl" : "ltr"}
      className="min-h-screen bg-[var(--background)] px-4 py-12 text-[var(--text-primary)] sm:px-6 sm:py-16"
    >
      <div className="mx-auto flex max-w-2xl justify-center">
        <div className="w-full rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-7 text-center shadow-sm sm:p-10">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[var(--brand-soft)] text-4xl">
            ✓
          </div>

          <h1 className="mt-7 text-3xl font-black tracking-tight sm:text-4xl">
            {t.title}
          </h1>

          <p className="mx-auto mt-4 max-w-xl leading-7 text-[var(--text-secondary)]">
            {t.message}
          </p>

          {orderNumber ? (
            <div className="mt-7 rounded-2xl bg-[var(--surface-soft)] p-5">
              <p className="text-sm text-[var(--text-secondary)]">
                {t.orderNumber}
              </p>

              <p className="mt-2 break-all text-xl font-black text-[var(--brand-strong)]">
                {orderNumber}
              </p>
            </div>
          ) : (
            <div className="mt-7 rounded-2xl border border-[var(--brand-soft)] bg-[var(--surface-soft)] p-5 text-sm leading-6 text-[var(--text-secondary)]">
              {t.missingOrder}
            </div>
          )}

          <div
            className={`mt-5 rounded-2xl border p-5 text-sm leading-6 ${
              isPaid
                ? "border-green-300 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950/30 dark:text-green-300"
                : "border-[var(--brand-soft)] bg-[var(--surface-soft)] text-[var(--text-secondary)]"
            }`}
          >
            {getPaymentMessage()}
          </div>

          <p className="mt-6 text-sm text-[var(--text-secondary)]">
            {t.account}
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href={orderLink}
              className="rounded-full bg-[var(--brand)] px-6 py-3 font-semibold text-white transition hover:opacity-90"
            >
              {orderNumber
                ? t.viewOrder
                : t.goToAccount}
            </Link>

            <Link
              href="/shop"
              className="rounded-full border border-[var(--border)] px-6 py-3 font-semibold transition hover:bg-[var(--surface-soft)]"
            >
              {t.continue}
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}