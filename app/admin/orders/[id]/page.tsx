"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import {
    useLanguage,
    type Language,
} from "@/components/LanguageProvider";

import { useSession } from "@/lib/auth-client";

const translations = {
    en: {
        title: "Order Details",
        back: "Back to Orders",
        order: "Order",
        orderDate: "Order Date",
        status: "Status",
        payment: "Payment",
        customer: "Customer",
        customerInformation: "Customer Information",
        shippingAddress: "Shipping Address",
        items: "Items",
        item: "item",
        itemPlural: "items",
        color: "Color",
        size: "Size",
        small: "Small",
        medium: "Medium",
        large: "Large",
        subtotal: "Subtotal",
        discount: "Discount",
        voucher: "Voucher",
        shipping: "Shipping",
        free: "Free",
        total: "Total",

        pendingPayment: "Pending Payment",
        processing: "Processing",
        shipped: "Shipped",
        delivered: "Delivered",
        cancelled: "Cancelled",

        pending: "Pending",
        paid: "Paid",

        orderPlaced: "Order Placed",
        paymentConfirmed: "Payment Confirmed",
        paymentPending: "Payment Pending",
        processingStep: "Processing",
        shippedStep: "Shipped",
        deliveredStep: "Delivered",
        cancelledStep: "Order Cancelled",
        current: "Current",

        manageOrder: "Manage Order",
        updateStatus: "Update Order",
        selectStatus: "Select Status",
        trackingNumber: "Tracking Number",
        trackingPlaceholder: "Enter tracking number",
        trackingRequired:
            "A tracking number is required when the order is shipped.",
        saveChanges: "Save Changes",
        saving: "Saving...",
        updateSuccess:
            "Order updated successfully.",
        updateError:
            "Unable to update the order.",

        cancelOrder: "Cancel Order",
        cancelTitle: "Cancel this order?",
        cancelMessage:
            "Are you sure you want to cancel this order?",
        keepOrder: "Keep Order",
        confirmCancel: "Yes, Cancel Order",
        cancelling: "Cancelling...",

        deleteOrder: "Delete Order",
        deleteTitle: "Delete this order?",
        deleteMessage:
            "This order will be permanently deleted. This action cannot be undone.",
        keepOrderData: "Keep Order",
        confirmDelete: "Yes, Delete Order",
        deleting: "Deleting...",

        cannotCancel:
            "This order cannot be cancelled.",
        cannotDelete:
            "This order cannot be deleted.",

        loading: "Loading order...",
        error: "Unable to load this order.",
        notFound: "Order not found.",
        adminRequired: "Administrator access is required.",

        phone: "Phone",
        email: "Email",
        address: "Address",
        apartment: "Apartment",
        city: "City",
        postalCode: "Postal Code",
        country: "Country",
        orderId: "Order ID",

        emailSent:
            "The customer was notified by email.",
        emailWarning:
            "The order was updated, but the customer email could not be sent.",
    },

    de: {
        title: "Bestelldetails",
        back: "Zurück zu Bestellungen",
        order: "Bestellung",
        orderDate: "Bestelldatum",
        status: "Status",
        payment: "Zahlung",
        customer: "Kunde",
        customerInformation: "Kundeninformationen",
        shippingAddress: "Lieferadresse",
        items: "Artikel",
        item: "Artikel",
        itemPlural: "Artikel",
        color: "Farbe",
        size: "Größe",
        small: "Klein",
        medium: "Mittel",
        large: "Groß",
        subtotal: "Zwischensumme",
        discount: "Rabatt",
        voucher: "Gutscheincode",
        shipping: "Versand",
        free: "Kostenlos",
        total: "Gesamt",

        pendingPayment: "Zahlung ausstehend",
        processing: "In Bearbeitung",
        shipped: "Versendet",
        delivered: "Geliefert",
        cancelled: "Storniert",

        pending: "Ausstehend",
        paid: "Bezahlt",

        orderPlaced: "Bestellung aufgegeben",
        paymentConfirmed: "Zahlung bestätigt",
        paymentPending: "Zahlung ausstehend",
        processingStep: "In Bearbeitung",
        shippedStep: "Versendet",
        deliveredStep: "Geliefert",
        cancelledStep: "Bestellung storniert",
        current: "Aktuell",

        manageOrder: "Bestellung verwalten",
        updateStatus: "Bestellung aktualisieren",
        selectStatus: "Status auswählen",
        trackingNumber: "Sendungsnummer",
        trackingPlaceholder:
            "Sendungsnummer eingeben",
        trackingRequired:
            "Beim Versand der Bestellung ist eine Sendungsnummer erforderlich.",
        saveChanges: "Änderungen speichern",
        saving: "Wird gespeichert...",
        updateSuccess:
            "Bestellung wurde erfolgreich aktualisiert.",
        updateError:
            "Die Bestellung konnte nicht aktualisiert werden.",

        cancelOrder: "Bestellung stornieren",
        cancelTitle: "Bestellung stornieren?",
        cancelMessage:
            "Möchtest du diese Bestellung wirklich stornieren?",
        keepOrder: "Bestellung behalten",
        confirmCancel: "Ja, Bestellung stornieren",
        cancelling: "Wird storniert...",

        deleteOrder: "Bestellung löschen",
        deleteTitle: "Bestellung löschen?",
        deleteMessage:
            "Diese Bestellung wird dauerhaft gelöscht. Diese Aktion kann nicht rückgängig gemacht werden.",
        keepOrderData: "Bestellung behalten",
        confirmDelete: "Ja, Bestellung löschen",
        deleting: "Wird gelöscht...",

        cannotCancel:
            "Diese Bestellung kann nicht storniert werden.",
        cannotDelete:
            "Diese Bestellung kann nicht gelöscht werden.",

        loading: "Bestellung wird geladen...",
        error: "Diese Bestellung konnte nicht geladen werden.",
        notFound: "Bestellung nicht gefunden.",
        adminRequired: "Administratorzugriff ist erforderlich.",

        phone: "Telefon",
        email: "E-Mail",
        address: "Adresse",
        apartment: "Wohnung",
        city: "Stadt",
        postalCode: "Postleitzahl",
        country: "Land",
        orderId: "Bestellnummer",

        emailSent:
            "Der Kunde wurde per E-Mail benachrichtigt.",
        emailWarning:
            "Die Bestellung wurde aktualisiert, aber die Kunden-E-Mail konnte nicht gesendet werden.",
    },

    ar: {
        title: "تفاصيل الطلب",
        back: "العودة إلى الطلبات",
        order: "الطلب",
        orderDate: "تاريخ الطلب",
        status: "الحالة",
        payment: "الدفع",
        customer: "العميل",
        customerInformation: "بيانات العميل",
        shippingAddress: "عنوان الشحن",
        items: "المنتجات",
        item: "منتج",
        itemPlural: "منتجات",
        color: "اللون",
        size: "المقاس",
        small: "صغير",
        medium: "متوسط",
        large: "كبير",
        subtotal: "المجموع الفرعي",
        discount: "الخصم",
        voucher: "كود الخصم",
        shipping: "الشحن",
        free: "مجاني",
        total: "الإجمالي",

        pendingPayment: "الدفع معلق",
        processing: "قيد المعالجة",
        shipped: "تم الشحن",
        delivered: "تم التسليم",
        cancelled: "ملغي",

        pending: "معلق",
        paid: "تم الدفع",

        orderPlaced: "تم إنشاء الطلب",
        paymentConfirmed: "تم تأكيد الدفع",
        paymentPending: "الدفع معلق",
        processingStep: "قيد التجهيز",
        shippedStep: "تم الشحن",
        deliveredStep: "تم التسليم",
        cancelledStep: "تم إلغاء الطلب",
        current: "الحالية",

        manageOrder: "إدارة الطلب",
        updateStatus: "تحديث الطلب",
        selectStatus: "اختيار الحالة",
        trackingNumber: "رقم التتبع",
        trackingPlaceholder:
            "أدخل رقم التتبع",
        trackingRequired:
            "يجب إدخال رقم التتبع عند تحديد الطلب كمشحون.",
        saveChanges: "حفظ التغييرات",
        saving: "جاري الحفظ...",
        updateSuccess:
            "تم تحديث الطلب بنجاح.",
        updateError:
            "تعذر تحديث الطلب.",

        cancelOrder: "إلغاء الطلب",
        cancelTitle: "إلغاء الطلب؟",
        cancelMessage:
            "هل أنت متأكد أنك تريد إلغاء هذا الطلب؟",
        keepOrder: "الاحتفاظ بالطلب",
        confirmCancel: "نعم، إلغاء الطلب",
        cancelling: "جاري الإلغاء...",

        deleteOrder: "حذف الطلب",
        deleteTitle: "حذف الطلب؟",
        deleteMessage:
            "سيتم حذف هذا الطلب نهائيًا. لا يمكن التراجع عن هذا الإجراء.",
        keepOrderData: "الاحتفاظ بالطلب",
        confirmDelete: "نعم، حذف الطلب",
        deleting: "جاري الحذف...",

        cannotCancel:
            "لا يمكن إلغاء هذا الطلب.",
        cannotDelete:
            "لا يمكن حذف هذا الطلب.",

        loading: "جاري تحميل الطلب...",
        error: "تعذر تحميل الطلب.",
        notFound: "الطلب غير موجود.",
        adminRequired: "يجب أن تكون لديك صلاحيات المسؤول.",

        phone: "الهاتف",
        email: "البريد الإلكتروني",
        address: "العنوان",
        apartment: "الشقة",
        city: "المدينة",
        postalCode: "الرمز البريدي",
        country: "الدولة",
        orderId: "رقم الطلب",

        emailSent:
            "تم إرسال إشعار بالبريد الإلكتروني إلى العميل.",
        emailWarning:
            "تم تحديث الطلب، ولكن تعذر إرسال البريد الإلكتروني إلى العميل.",
    },
};

type Translation = (typeof translations)[Language];

type OrderStatus =
    | "pending_payment"
    | "processing"
    | "shipped"
    | "delivered"
    | "cancelled";

type OrderItem = {
    productId: string;
    name: string;
    price: number;
    quantity: number;
    colorKey?: string;
    colorName?: {
        en: string;
        de: string;
        ar: string;
    };
    sizeKey?: "small" | "medium" | "large" | "";
    customFields?: {
        id: string;
        label: string;
        value: string;
    }[];
    image?: string;
};

type ShippingData = {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    address?: string;
    apartment?: string;
    postalCode?: string;
    city?: string;
    country?: string;
};

type AdminOrder = {
    id: string;
    userId: string | null;
    status: string;
    paymentStatus: string;
    items: OrderItem[];
    shipping: ShippingData;
    subtotal: number;
    discountAmount?: number | null;
    voucherCode?: string | null;
    voucherType?: string | null;
    freeDelivery?: boolean;
    shippingCost: number;
    total: number;
    createdAt: string;
    trackingNumber?: string | null;
};

const statuses: OrderStatus[] = [
    "pending_payment",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
];

function getOrderStatusLabel(
    status: string,
    t: Translation
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
    t: Translation
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

function getStatusClasses(
    status: string
) {
    switch (status) {
        case "pending_payment":
            return "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300";

        case "processing":
            return "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300";

        case "shipped":
            return "bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300";

        case "delivered":
            return "bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-300";

        case "cancelled":
            return "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300";

        default:
            return "bg-[var(--brand-soft)] text-[var(--brand-strong)]";
    }
}

function getTimelineState(
    status: string,
    paymentStatus: string
) {
    return {
        placed: true,

        payment:
            paymentStatus === "paid",

        processing:
            status === "processing" ||
            status === "shipped" ||
            status === "delivered",

        shipped:
            status === "shipped" ||
            status === "delivered",

        delivered:
            status === "delivered",
    };
}

function getCurrentStep(
    status: string,
    paymentStatus: string
) {
    if (status === "cancelled") {
        return "cancelled";
    }

    if (
        status ===
            "pending_payment" &&
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
    completed,
    active,
    last,
    currentLabel,
}: {
    title: string;
    completed: boolean;
    active: boolean;
    last?: boolean;
    currentLabel: string;
}) {
    return (
        <div className="relative flex gap-4">
            <div className="flex flex-col items-center">
                <div
                    className={[
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold",
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
                    !completed && (
                        <span className="shrink-0 rounded-full bg-[var(--brand-soft)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[var(--brand-strong)]">
                            {currentLabel}
                        </span>
                    )}
            </div>
        </div>
    );
}

export default function AdminOrderDetailsPage() {
    const { language } = useLanguage();

    const params =
        useParams<{ id: string }>();

    const router = useRouter();

    const {
        data: session,
        isPending: sessionLoading,
    } = useSession();

    const t = translations[language];

    const [order, setOrder] =
        useState<AdminOrder | null>(
            null
        );

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    const [selectedStatus, setSelectedStatus] =
        useState<OrderStatus>(
            "pending_payment"
        );

    const [trackingNumber, setTrackingNumber] =
        useState("");

    const [updating, setUpdating] =
        useState(false);

    const [successMessage, setSuccessMessage] =
        useState("");

    const [updateError, setUpdateError] =
        useState("");

    const [showCancelDialog, setShowCancelDialog] =
        useState(false);

    const [showDeleteDialog, setShowDeleteDialog] =
        useState(false);

    const [deleting, setDeleting] =
        useState(false);

    const orderId = params.id;

    useEffect(() => {
        if (
            sessionLoading ||
            !session?.user?.id ||
            !orderId
        ) {
            return;
        }

        let cancelled = false;

        async function loadOrder() {
            try {
                setLoading(true);
                setError("");

                const response =
                    await fetch(
                        `/api/admin/orders/${encodeURIComponent(
                            orderId
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

                const foundOrder =
                    data?.order as
                        | AdminOrder
                        | undefined;

                if (!foundOrder) {
                    throw new Error(
                        t.notFound
                    );
                }

                if (!cancelled) {
                    setOrder(
                        foundOrder
                    );

                    if (
                        statuses.includes(
                            foundOrder.status as OrderStatus
                        )
                    ) {
                        setSelectedStatus(
                            foundOrder.status as OrderStatus
                        );
                    }

                    setTrackingNumber(
                        foundOrder.trackingNumber ??
                            ""
                    );
                }
            } catch (loadError) {
                console.error(
                    "Admin order details load error:",
                    loadError
                );

                if (!cancelled) {
                    setError(
                        loadError instanceof
                            Error
                            ? loadError.message
                            : t.error
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(
                        false
                    );
                }
            }
        }

        void loadOrder();

        return () => {
            cancelled = true;
        };
    }, [
        sessionLoading,
        session?.user?.id,
        orderId,
        t.error,
        t.notFound,
    ]);

    const timeline = useMemo(() => {
        if (!order) {
            return null;
        }

        return getTimelineState(
            order.status,
            order.paymentStatus
        );
    }, [order]);

    const currentStep = useMemo(() => {
        if (!order) {
            return "";
        }

        return getCurrentStep(
            order.status,
            order.paymentStatus
        );
    }, [order]);

    const isCancelled =
        order?.status === "cancelled";

    const canCancel =
        !!order &&
        order.status !== "cancelled" &&
        order.status !== "shipped" &&
        order.status !== "delivered";

    const canDelete =
        !!order &&
        (
            order.status ===
                "cancelled" ||
            (
                order.status ===
                    "pending_payment" &&
                order.paymentStatus ===
                    "pending"
            )
        );

    const statusChanged =
        !!order &&
        selectedStatus !==
            order.status;

    const trackingChanged =
        !!order &&
        trackingNumber.trim() !==
            (order.trackingNumber ??
                "");

    const hasChanges =
        statusChanged ||
        trackingChanged;

    const isShipped =
        selectedStatus ===
        "shipped";

    async function saveChanges() {
        if (
            !order ||
            updating ||
            !hasChanges
        ) {
            return;
        }

        const normalizedTracking =
            trackingNumber.trim();

        if (
            isShipped &&
            !normalizedTracking
        ) {
            setUpdateError(
                t.trackingRequired
            );
            return;
        }

        setUpdating(true);
        setUpdateError("");
        setSuccessMessage("");

        try {
            const response =
                await fetch(
                    `/api/admin/orders/${encodeURIComponent(
                        order.id
                    )}`,
                    {
                        method: "PATCH",
                        headers: {
                            "Content-Type":
                                "application/json",
                        },
                        body: JSON.stringify(
                            {
                                status:
                                    selectedStatus,
                                trackingNumber:
                                    normalizedTracking ||
                                    null,
                            }
                        ),
                    }
                );

            const data =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    data?.error ||
                        t.updateError
                );
            }

            const updatedOrder =
                data?.order;

            setOrder(
                (currentOrder) =>
                    currentOrder
                        ? {
                            ...currentOrder,
                            status:
                                updatedOrder?.status ??
                                selectedStatus,
                            paymentStatus:
                                updatedOrder?.paymentStatus ??
                                currentOrder.paymentStatus,
                            trackingNumber:
                                updatedOrder?.trackingNumber ??
                                null,
                        }
                        : currentOrder
            );

            setSelectedStatus(
                updatedOrder?.status ??
                    selectedStatus
            );

            setTrackingNumber(
                updatedOrder?.trackingNumber ??
                    ""
            );

            if (
                data?.warning
            ) {
                setUpdateError(
                    data.warning
                );
            } else if (
                data?.emailSent
            ) {
                setSuccessMessage(
                    `${t.updateSuccess} ${t.emailSent}`
                );
            } else {
                setSuccessMessage(
                    t.updateSuccess
                );
            }
        } catch (saveError) {
            console.error(
                "Admin order update error:",
                saveError
            );

            setUpdateError(
                saveError instanceof
                    Error
                    ? saveError.message
                    : t.updateError
            );
        } finally {
            setUpdating(false);
        }
    }

    async function handleCancelOrder() {
        if (
            !order ||
            updating
        ) {
            return;
        }

        setUpdating(true);
        setUpdateError("");
        setSuccessMessage("");

        try {
            const response =
                await fetch(
                    `/api/admin/orders/${encodeURIComponent(
                        order.id
                    )}`,
                    {
                        method: "PATCH",
                        headers: {
                            "Content-Type":
                                "application/json",
                        },
                        body: JSON.stringify(
                            {
                                status:
                                    "cancelled",
                            }
                        ),
                    }
                );

            const data =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    data?.error ||
                        t.updateError
                );
            }

            setOrder(
                (currentOrder) =>
                    currentOrder
                        ? {
                            ...currentOrder,
                            status:
                                data?.order
                                    ?.status ??
                                "cancelled",
                            trackingNumber:
                                data?.order
                                    ?.trackingNumber ??
                                currentOrder.trackingNumber ??
                                null,
                        }
                        : currentOrder
            );

            setSelectedStatus(
                "cancelled"
            );

            setShowCancelDialog(
                false
            );

            if (
                data?.warning
            ) {
                setUpdateError(
                    data.warning
                );
            } else {
                setSuccessMessage(
                    data?.emailSent
                        ? `${t.updateSuccess} ${t.emailSent}`
                        : t.updateSuccess
                );
            }
        } catch (cancelError) {
            console.error(
                "Admin cancel order error:",
                cancelError
            );

            setUpdateError(
                cancelError instanceof
                    Error
                    ? cancelError.message
                    : t.updateError
            );
        } finally {
            setUpdating(false);
        }
    }

    async function handleDeleteOrder() {
        if (
            !order ||
            deleting
        ) {
            return;
        }

        setDeleting(true);
        setUpdateError("");
        setSuccessMessage("");

        try {
            const response =
                await fetch(
                    `/api/admin/orders/${encodeURIComponent(
                        order.id
                    )}`,
                    {
                        method: "DELETE",
                    }
                );

            const data =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    data?.error ||
                        t.cannotDelete
                );
            }

            router.push(
                "/admin/orders"
            );
        } catch (deleteError) {
            console.error(
                "Admin delete order error:",
                deleteError
            );

            setUpdateError(
                deleteError instanceof
                    Error
                    ? deleteError.message
                    : t.cannotDelete
            );

            setDeleting(false);
        }
    }

    if (
        sessionLoading ||
        loading
    ) {
        return (
            <main
                dir={
                    language === "ar"
                        ? "rtl"
                        : "ltr"
                }
                className="mx-auto max-w-6xl px-4 py-12 sm:px-6"
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
        !session?.user?.id
    ) {
        return (
            <main
                dir={
                    language === "ar"
                        ? "rtl"
                        : "ltr"
                }
                className="mx-auto max-w-6xl px-4 py-12 sm:px-6"
            >
                <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-10 text-center">
                    <h1 className="text-2xl font-black text-[var(--text-primary)]">
                        {
                            t.adminRequired
                        }
                    </h1>

                    <button
                        type="button"
                        onClick={() =>
                            router.push(
                                "/login"
                            )
                        }
                        className="mt-6 rounded-full bg-[var(--brand)] px-6 py-3 font-semibold text-white transition hover:opacity-90"
                    >
                        {t.back}
                    </button>
                </div>
            </main>
        );
    }

    if (
        error ||
        !order ||
        !timeline
    ) {
        return (
            <main
                dir={
                    language === "ar"
                        ? "rtl"
                        : "ltr"
                }
                className="mx-auto max-w-6xl px-4 py-12 sm:px-6"
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
                        href="/admin/orders"
                        className="mt-6 inline-flex rounded-full bg-[var(--brand)] px-6 py-3 font-semibold text-white transition hover:opacity-90"
                    >
                        {t.back}
                    </Link>
                </div>
            </main>
        );
    }

    const totalItems =
        order.items.reduce(
            (sum, item) =>
                sum + item.quantity,
            0
        );

    const customerName =
        [
            order.shipping.firstName,
            order.shipping.lastName,
        ]
            .filter(Boolean)
            .join(" ") || "—";

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
            className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14"
        >
            <div className="mb-8">
                <Link
                    href="/admin/orders"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--brand-strong)] transition hover:opacity-80"
                >
                    <span aria-hidden="true">
                        {language ===
                        "ar"
                            ? "→"
                            : "←"}
                    </span>

                    {t.back}
                </Link>

                <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
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

                    <div className="flex flex-wrap gap-2 lg:justify-end">
                        <span
                            className={[
                                "rounded-full px-4 py-2 text-sm font-semibold",
                                getStatusClasses(
                                    order.status
                                ),
                            ].join(
                                " "
                            )}
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

            {(successMessage ||
                updateError) && (
                <div
                    className={[
                        "mb-6 rounded-2xl border px-4 py-4 text-sm font-semibold",
                        updateError
                            ? "border-red-200 bg-red-50 text-red-800 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300"
                            : "border-green-200 bg-green-50 text-green-800 dark:border-green-900/40 dark:bg-green-950/30 dark:text-green-300",
                    ].join(
                        " "
                    )}
                >
                    {updateError ||
                        successMessage}
                </div>
            )}

            <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
                <div className="space-y-6">
                    {/* Customer */}
                    <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm sm:p-7">
                        <h2 className="text-xl font-bold text-[var(--text-primary)]">
                            {
                                t.customerInformation
                            }
                        </h2>

                        <div className="mt-5 grid gap-4 sm:grid-cols-2">
                            <div className="rounded-2xl bg-[var(--surface-soft)] p-5">
                                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
                                    {
                                        t.customer
                                    }
                                </p>

                                <p className="mt-2 font-bold text-[var(--text-primary)]">
                                    {
                                        customerName
                                    }
                                </p>
                            </div>

                            <div className="rounded-2xl bg-[var(--surface-soft)] p-5">
                                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
                                    {t.email}
                                </p>

                                <p className="mt-2 break-all font-semibold text-[var(--text-primary)]">
                                    {order
                                        .shipping
                                        .email ||
                                        "—"}
                                </p>
                            </div>

                            <div className="rounded-2xl bg-[var(--surface-soft)] p-5">
                                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
                                    {t.phone}
                                </p>

                                <p className="mt-2 font-semibold text-[var(--text-primary)]">
                                    {order
                                        .shipping
                                        .phone ||
                                        "—"}
                                </p>
                            </div>

                            <div className="rounded-2xl bg-[var(--surface-soft)] p-5">
                                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
                                    {
                                        t.orderId
                                    }
                                </p>

                                <p className="mt-2 break-all font-semibold text-[var(--text-primary)]">
                                    {
                                        order.id
                                    }
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Items */}
                    <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm sm:p-7">
                        <div className="flex items-center justify-between gap-4">
                            <h2 className="text-xl font-bold text-[var(--text-primary)]">
                                {t.items}
                            </h2>

                            <span className="text-sm text-[var(--text-secondary)]">
                                {
                                    totalItems
                                }{" "}
                                {totalItems ===
                                1
                                    ? t.item
                                    : t.itemPlural}
                            </span>
                        </div>

                        <div className="mt-5 divide-y divide-[var(--border)]">
                            {order.items.map(
                                (
                                    item,
                                    index
                                ) => {
                                    const colorName =
                                        item.colorName?.[
                                            language
                                        ] ??
                                        item.colorKey ??
                                        null;

                                    return (
                                        <div
                                            key={`${item.productId}-${item.colorKey ?? "default"}-${item.sizeKey ?? "default"}-${item.customFields?.map((field) => `${field.id}:${field.value}`).join("|") ?? "no-custom-fields"}-${index}`}
                                            className="flex gap-4 py-5 first:pt-0 last:pb-0"
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

                                                <div className="mt-2 space-y-1">
                                                    {colorName && (
                                                        <p className="text-xs text-[var(--text-secondary)]">
                                                            <span className="font-semibold">
                                                                {t.color}:
                                                            </span>{" "}
                                                            {colorName}
                                                        </p>
                                                    )}

                                                    {item.sizeKey && (
                                                        <p className="text-xs text-[var(--text-secondary)]">
                                                            <span className="font-semibold">
                                                                {t.size}:
                                                            </span>{" "}
                                                            {item.sizeKey ===
                                                            "small"
                                                                ? t.small
                                                                : item.sizeKey ===
                                                                  "medium"
                                                                    ? t.medium
                                                                    : t.large}
                                                        </p>
                                                    )}

                                                    {item.customFields?.map(
                                                        (field) => (
                                                            <p
                                                                key={field.id}
                                                                className="text-xs text-[var(--text-secondary)]"
                                                            >
                                                                <span className="font-semibold">
                                                                    {field.label}:
                                                                </span>{" "}
                                                                {field.value}
                                                            </p>
                                                        )
                                                    )}

                                                    <p className="pt-1 text-sm text-[var(--text-secondary)]">
                                                        {item.quantity}{" "}
                                                        {item.quantity === 1
                                                            ? t.item
                                                            : t.itemPlural}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="shrink-0 text-right rtl:text-left">
                                                <p className="font-black text-[var(--text-primary)]">
                                                    €
                                                    {(
                                                        item.price *
                                                        item.quantity
                                                    ).toFixed(2)}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                }
                            )}
                        </div>
                    </section>

                    {/* Shipping */}
                    <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm sm:p-7">
                        <h2 className="text-xl font-bold text-[var(--text-primary)]">
                            {
                                t.shippingAddress
                            }
                        </h2>

                        <div className="mt-5 rounded-2xl bg-[var(--surface-soft)] p-5">
                            <p className="font-semibold text-[var(--text-primary)]">
                                {
                                    customerName
                                }
                            </p>

                            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                                {order
                                    .shipping
                                    .address ||
                                    "—"}

                                {order
                                    .shipping
                                    .apartment
                                    ? `, ${order.shipping.apartment}`
                                    : ""}

                                <br />

                                {order
                                    .shipping
                                    .postalCode ||
                                    "—"}{" "}
                                {order
                                    .shipping
                                    .city ||
                                    "—"}

                                <br />

                                {order
                                    .shipping
                                    .country ||
                                    "—"}
                            </p>

                            <div className="mt-4 border-t border-[var(--border)] pt-4 text-sm text-[var(--text-secondary)]">
                                <p>
                                    {
                                        t.email
                                    }
                                    :{" "}
                                    {order
                                        .shipping
                                        .email ||
                                        "—"}
                                </p>

                                <p className="mt-1">
                                    {
                                        t.phone
                                    }
                                    :{" "}
                                    {order
                                        .shipping
                                        .phone ||
                                        "—"}
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Tracking */}
                    {(order.trackingNumber ||
                        order.status ===
                            "shipped") && (
                        <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm sm:p-7">
                            <h2 className="text-xl font-bold text-[var(--text-primary)]">
                                {
                                    t.trackingNumber
                                }
                            </h2>

                            <div className="mt-4 rounded-2xl bg-[var(--surface-soft)] p-5">
                                <p className="break-all font-bold text-[var(--text-primary)]">
                                    {order
                                        .trackingNumber ||
                                        "—"}
                                </p>
                            </div>
                        </section>
                    )}

                    {/* Timeline */}
                    <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm sm:p-7">
                        <h2 className="text-xl font-bold text-[var(--text-primary)]">
                            {t.status}
                        </h2>

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
                                    currentLabel={
                                        t.current
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
                                        t.current
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
                                        t.current
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
                                        t.current
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
                                        t.current
                                    }
                                    last
                                />
                            </div>
                        )}
                    </section>
                </div>

                <aside className="h-fit space-y-6 lg:sticky lg:top-24">
                    {/* Financial Summary */}
                    <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm sm:p-7">
                        <h2 className="text-xl font-bold text-[var(--text-primary)]">
                            {t.total}
                        </h2>

                        <div className="mt-5 space-y-4 text-sm">
                            <div className="flex items-center justify-between gap-4">
                                <span className="text-[var(--text-secondary)]">
                                    {
                                        t.subtotal
                                    }
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
                                        {
                                            t.discount
                                        }
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
                                        {
                                            t.voucher
                                        }
                                    </span>

                                    <span className="rounded-full bg-[var(--brand-soft)] px-3 py-1 text-xs font-bold tracking-wide text-[var(--brand-strong)]">
                                        {
                                            order.voucherCode
                                        }
                                    </span>
                                </div>
                            )}

                            <div className="flex items-center justify-between gap-4">
                                <span className="text-[var(--text-secondary)]">
                                    {
                                        t.shipping
                                    }
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
                    </section>

                    {/* Admin Actions */}
                    <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm sm:p-7">
                        <h2 className="text-xl font-bold text-[var(--text-primary)]">
                            {
                                t.manageOrder
                            }
                        </h2>

                        <div className="mt-5 space-y-4">
                            <div>
                                <label
                                    htmlFor="order-status"
                                    className="mb-2 block text-sm font-semibold text-[var(--text-primary)]"
                                >
                                    {
                                        t.selectStatus
                                    }
                                </label>

                                <select
                                    id="order-status"
                                    value={
                                        selectedStatus
                                    }
                                    onChange={(
                                        event
                                    ) => {
                                        setSelectedStatus(
                                            event
                                                .target
                                                .value as OrderStatus
                                        );
                                        setUpdateError(
                                            ""
                                        );
                                        setSuccessMessage(
                                            ""
                                        );
                                    }}
                                    disabled={
                                        updating ||
                                        deleting
                                    }
                                    className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm font-semibold text-[var(--text-primary)] outline-none transition focus:border-[var(--brand)] disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {statuses.map(
                                        (
                                            status
                                        ) => (
                                            <option
                                                key={
                                                    status
                                                }
                                                value={
                                                    status
                                                }
                                            >
                                                {getOrderStatusLabel(
                                                    status,
                                                    t
                                                )}
                                            </option>
                                        )
                                    )}
                                </select>
                            </div>

                            <div>
                                <label
                                    htmlFor="tracking-number"
                                    className="mb-2 block text-sm font-semibold text-[var(--text-primary)]"
                                >
                                    {
                                        t.trackingNumber
                                    }
                                    {isShipped && (
                                        <span className="ms-1 text-red-600">
                                            *
                                        </span>
                                    )}
                                </label>

                                <input
                                    id="tracking-number"
                                    type="text"
                                    value={
                                        trackingNumber
                                    }
                                    onChange={(
                                        event
                                    ) => {
                                        setTrackingNumber(
                                            event
                                                .target
                                                .value
                                        );
                                        setUpdateError(
                                            ""
                                        );
                                        setSuccessMessage(
                                            ""
                                        );
                                    }}
                                    placeholder={
                                        t.trackingPlaceholder
                                    }
                                    maxLength={
                                        100
                                    }
                                    disabled={
                                        updating ||
                                        deleting
                                    }
                                    className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-secondary)] focus:border-[var(--brand)] disabled:cursor-not-allowed disabled:opacity-50"
                                />

                                {isShipped && (
                                    <p className="mt-2 text-xs text-[var(--text-secondary)]">
                                        {
                                            t.trackingRequired
                                        }
                                    </p>
                                )}
                            </div>

                            <button
                                type="button"
                                disabled={
                                    updating ||
                                    deleting ||
                                    !hasChanges ||
                                    (isShipped &&
                                        !trackingNumber.trim())
                                }
                                onClick={() =>
                                    void saveChanges()
                                }
                                className="w-full rounded-full bg-[var(--brand)] px-5 py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {updating
                                    ? t.saving
                                    : t.saveChanges}
                            </button>

                            {canCancel && (
                                <button
                                    type="button"
                                    disabled={
                                        updating ||
                                        deleting
                                    }
                                    onClick={() => {
                                        setUpdateError(
                                            ""
                                        );
                                        setShowCancelDialog(
                                            true
                                        );
                                    }}
                                    className="w-full rounded-full border border-red-300 bg-red-50 px-5 py-3 text-sm font-bold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300 dark:hover:bg-red-950/40"
                                >
                                    {
                                        t.cancelOrder
                                    }
                                </button>
                            )}

                            {canDelete && (
                                <button
                                    type="button"
                                    disabled={
                                        updating ||
                                        deleting
                                    }
                                    onClick={() => {
                                        setUpdateError(
                                            ""
                                        );
                                        setShowDeleteDialog(
                                            true
                                        );
                                    }}
                                    className="w-full rounded-full border border-red-400 bg-[var(--surface)] px-5 py-3 text-sm font-bold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950/30"
                                >
                                    {
                                        t.deleteOrder
                                    }
                                </button>
                            )}
                        </div>
                    </section>
                </aside>
            </div>

            {/* Cancel Dialog */}
            {showCancelDialog && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="admin-cancel-order-title"
                >
                    <div className="w-full max-w-md rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl sm:p-7">
                        <h2
                            id="admin-cancel-order-title"
                            className="text-xl font-black text-[var(--text-primary)]"
                        >
                            {
                                t.cancelTitle
                            }
                        </h2>

                        <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
                            {
                                t.cancelMessage
                            }
                        </p>

                        {updateError && (
                            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
                                {
                                    updateError
                                }
                            </div>
                        )}

                        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                            <button
                                type="button"
                                disabled={
                                    updating
                                }
                                onClick={() => {
                                    if (
                                        !updating
                                    ) {
                                        setShowCancelDialog(
                                            false
                                        );
                                        setUpdateError(
                                            ""
                                        );
                                    }
                                }}
                                className="rounded-full border border-[var(--border)] px-5 py-3 text-sm font-bold text-[var(--text-primary)] transition hover:bg-[var(--surface-soft)] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {
                                    t.keepOrder
                                }
                            </button>

                            <button
                                type="button"
                                disabled={
                                    updating
                                }
                                onClick={() =>
                                    void handleCancelOrder()
                                }
                                className="rounded-full bg-red-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {updating
                                    ? t.cancelling
                                    : t.confirmCancel}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Dialog */}
            {showDeleteDialog && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="admin-delete-order-title"
                >
                    <div className="w-full max-w-md rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl sm:p-7">
                        <h2
                            id="admin-delete-order-title"
                            className="text-xl font-black text-[var(--text-primary)]"
                        >
                            {
                                t.deleteTitle
                            }
                        </h2>

                        <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
                            {
                                t.deleteMessage
                            }
                        </p>

                        {updateError && (
                            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
                                {
                                    updateError
                                }
                            </div>
                        )}

                        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                            <button
                                type="button"
                                disabled={
                                    deleting
                                }
                                onClick={() => {
                                    if (
                                        !deleting
                                    ) {
                                        setShowDeleteDialog(
                                            false
                                        );
                                        setUpdateError(
                                            ""
                                        );
                                    }
                                }}
                                className="rounded-full border border-[var(--border)] px-5 py-3 text-sm font-bold text-[var(--text-primary)] transition hover:bg-[var(--surface-soft)] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {
                                    t.keepOrderData
                                }
                            </button>

                            <button
                                type="button"
                                disabled={
                                    deleting
                                }
                                onClick={() =>
                                    void handleDeleteOrder()
                                }
                                className="rounded-full bg-red-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {deleting
                                    ? t.deleting
                                    : t.confirmDelete}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}