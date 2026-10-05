"use client";

import Image from "next/image";
import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";
import { useRouter } from "next/navigation";

import {
    useLanguage,
    type Language,
} from "@/components/LanguageProvider";
import { useSession } from "@/lib/auth-client";

const translations = {
    en: {
        title: "Order Management",
        subtitle:
            "Manage JAN-GET orders and update their delivery status.",
        loading: "Loading orders...",
        loadError: "Unable to load orders.",
        loginRequired:
            "Please log in to access the admin area.",
        login: "Log In",
        noOrders: "There are no orders yet.",
        noMatchingOrders:
            "No orders match your search or filters.",
        backToAccount: "Back to Account",
        order: "Order",
        customer: "Customer",
        date: "Date",
        items: "Items",
        total: "Total",
        status: "Status",
        payment: "Payment",
        trackingNumber: "Tracking Number",
        noTrackingNumber: "No tracking number",
        viewOrder: "View Order",
        updateStatus: "Update Status",
        updating: "Updating...",
        confirmTitle: "Update Order",
        confirmText:
            "Choose the new status for this order.",
        trackingRequired:
            "A tracking number is required when an order is shipped.",
        trackingPlaceholder:
            "Enter tracking number...",
        saveChanges: "Save Changes",
        cancel: "Cancel",
        confirm: "Confirm",
        success:
            "Order updated successfully.",
        updateError:
            "Unable to update the order.",
        pendingPayment: "Pending Payment",
        processing: "Processing",
        shipped: "Shipped",
        delivered: "Delivered",
        cancelled: "Cancelled",
        pending: "Pending",
        paid: "Paid",
        item: "item",
        itemPlural: "items",
        customerUnknown: "Customer",

        searchPlaceholder:
            "Search by order ID, customer name, or email...",
        filterStatus: "Order status",
        filterPayment: "Payment status",
        allStatuses: "All statuses",
        allPayments: "All payments",
        refresh: "Refresh",
        refreshing: "Refreshing...",
        clearFilters: "Clear filters",
        results: "results",

        cancelOrder: "Cancel Order",
        cancelOrderTitle: "Cancel Order?",
        cancelOrderText:
            "Are you sure you want to cancel this order?",
        cancelling: "Cancelling...",
        confirmCancel: "Cancel Order",

        deleteOrder: "Delete Order",
        deleteOrderTitle: "Delete Order?",
        deleteOrderText:
            "This will permanently delete the order. This action cannot be undone.",
        deleting: "Deleting...",
        confirmDelete: "Delete Order",

        cannotCancel:
            "This order cannot be cancelled because it has already been shipped or delivered.",
        cannotDelete:
            "This order cannot be deleted.",

        unpaid: "Unpaid",
    },

    de: {
        title: "Bestellverwaltung",
        subtitle:
            "Verwalte JAN-GET-Bestellungen und aktualisiere den Lieferstatus.",
        loading:
            "Bestellungen werden geladen...",
        loadError:
            "Bestellungen konnten nicht geladen werden.",
        loginRequired:
            "Bitte melde dich an, um den Admin-Bereich zu öffnen.",
        login: "Anmelden",
        noOrders:
            "Es gibt noch keine Bestellungen.",
        noMatchingOrders:
            "Keine Bestellungen entsprechen deiner Suche oder deinen Filtern.",
        backToAccount: "Zurück zum Konto",
        order: "Bestellung",
        customer: "Kunde",
        date: "Datum",
        items: "Artikel",
        total: "Gesamt",
        status: "Status",
        payment: "Zahlung",
        trackingNumber: "Sendungsnummer",
        noTrackingNumber: "Keine Sendungsnummer",
        viewOrder: "Bestellung ansehen",
        updateStatus: "Status aktualisieren",
        updating: "Wird aktualisiert...",
        confirmTitle: "Bestellung aktualisieren",
        confirmText:
            "Wähle den neuen Status für diese Bestellung.",
        trackingRequired:
            "Beim Status „Versendet“ ist eine Sendungsnummer erforderlich.",
        trackingPlaceholder:
            "Sendungsnummer eingeben...",
        saveChanges: "Änderungen speichern",
        cancel: "Abbrechen",
        confirm: "Bestätigen",
        success:
            "Die Bestellung wurde erfolgreich aktualisiert.",
        updateError:
            "Die Bestellung konnte nicht aktualisiert werden.",
        pendingPayment: "Zahlung ausstehend",
        processing: "In Bearbeitung",
        shipped: "Versendet",
        delivered: "Geliefert",
        cancelled: "Storniert",
        pending: "Ausstehend",
        paid: "Bezahlt",
        item: "Artikel",
        itemPlural: "Artikel",
        customerUnknown: "Kunde",

        searchPlaceholder:
            "Nach Bestellnummer, Kundenname oder E-Mail suchen...",
        filterStatus: "Bestellstatus",
        filterPayment: "Zahlungsstatus",
        allStatuses: "Alle Status",
        allPayments: "Alle Zahlungen",
        refresh: "Aktualisieren",
        refreshing: "Wird aktualisiert...",
        clearFilters: "Filter zurücksetzen",
        results: "Ergebnisse",

        cancelOrder: "Bestellung stornieren",
        cancelOrderTitle:
            "Bestellung stornieren?",
        cancelOrderText:
            "Möchtest du diese Bestellung wirklich stornieren?",
        cancelling: "Wird storniert...",
        confirmCancel:
            "Bestellung stornieren",

        deleteOrder: "Bestellung löschen",
        deleteOrderTitle:
            "Bestellung löschen?",
        deleteOrderText:
            "Die Bestellung wird dauerhaft gelöscht. Diese Aktion kann nicht rückgängig gemacht werden.",
        deleting: "Wird gelöscht...",
        confirmDelete:
            "Bestellung löschen",

        cannotCancel:
            "Diese Bestellung kann nicht mehr storniert werden, da sie bereits versendet oder geliefert wurde.",
        cannotDelete:
            "Diese Bestellung kann nicht gelöscht werden.",

        unpaid: "Unbezahlt",
    },

    ar: {
        title: "إدارة الطلبات",
        subtitle:
            "إدارة طلبات JAN-GET وتحديث حالة الشحن والتوصيل.",
        loading: "جاري تحميل الطلبات...",
        loadError: "تعذر تحميل الطلبات.",
        loginRequired:
            "يرجى تسجيل الدخول للوصول إلى لوحة الإدارة.",
        login: "تسجيل الدخول",
        noOrders: "لا توجد طلبات حتى الآن.",
        noMatchingOrders:
            "لا توجد طلبات تطابق البحث أو الفلاتر المحددة.",
        backToAccount: "العودة إلى الحساب",
        order: "الطلب",
        customer: "العميل",
        date: "التاريخ",
        items: "المنتجات",
        total: "الإجمالي",
        status: "الحالة",
        payment: "الدفع",
        trackingNumber: "رقم التتبع",
        noTrackingNumber: "لا يوجد رقم تتبع",
        viewOrder: "عرض الطلب",
        updateStatus: "تحديث الطلب",
        updating: "جاري التحديث...",
        confirmTitle: "تحديث الطلب",
        confirmText:
            "اختر الحالة الجديدة لهذا الطلب.",
        trackingRequired:
            "يجب إدخال رقم التتبع عند تغيير الحالة إلى تم الشحن.",
        trackingPlaceholder:
            "أدخل رقم التتبع...",
        saveChanges: "حفظ التغييرات",
        cancel: "إلغاء",
        confirm: "تأكيد",
        success:
            "تم تحديث الطلب بنجاح.",
        updateError:
            "تعذر تحديث الطلب.",
        pendingPayment: "الدفع معلق",
        processing: "قيد المعالجة",
        shipped: "تم الشحن",
        delivered: "تم التسليم",
        cancelled: "ملغي",
        pending: "معلق",
        paid: "تم الدفع",
        item: "منتج",
        itemPlural: "منتجات",
        customerUnknown: "العميل",

        searchPlaceholder:
            "ابحث برقم الطلب أو اسم العميل أو البريد الإلكتروني...",
        filterStatus: "حالة الطلب",
        filterPayment: "حالة الدفع",
        allStatuses: "كل الحالات",
        allPayments: "كل حالات الدفع",
        refresh: "تحديث",
        refreshing: "جاري التحديث...",
        clearFilters: "مسح الفلاتر",
        results: "نتيجة",

        cancelOrder: "إلغاء الطلب",
        cancelOrderTitle: "إلغاء الطلب؟",
        cancelOrderText:
            "هل أنت متأكد أنك تريد إلغاء هذا الطلب؟",
        cancelling: "جاري الإلغاء...",
        confirmCancel: "إلغاء الطلب",

        deleteOrder: "حذف الطلب",
        deleteOrderTitle: "حذف الطلب؟",
        deleteOrderText:
            "سيتم حذف الطلب نهائيًا. لا يمكن التراجع عن هذا الإجراء.",
        deleting: "جاري الحذف...",
        confirmDelete: "حذف الطلب",

        cannotCancel:
            "لا يمكن إلغاء هذا الطلب لأنه تم شحنه أو تسليمه بالفعل.",
        cannotDelete:
            "لا يمكن حذف هذا الطلب.",

        unpaid: "غير مدفوع",
    },
};

type Translation =
    (typeof translations)[Language];

type OrderItem = {
    productId: string;
    name: string;
    price: number;
    quantity: number;
    colorKey?: string;
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
    shippingCost: number;
    total: number;
    createdAt: string;
    trackingNumber?: string | null;
};

type StatusFilter =
    | "all"
    | "pending_payment"
    | "processing"
    | "shipped"
    | "delivered"
    | "cancelled";

type PaymentFilter =
    | "all"
    | "pending"
    | "paid";

type ModalAction =
    | "update"
    | "cancel"
    | "delete";

const ORDER_STATUSES: Array<
    Exclude<StatusFilter, "all">
> = [
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
                month: "short",
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

function getCustomerName(
    order: AdminOrder,
    fallback: string
) {
    const firstName =
        order.shipping?.firstName?.trim() ||
        "";

    const lastName =
        order.shipping?.lastName?.trim() ||
        "";

    const fullName =
        `${firstName} ${lastName}`.trim();

    return fullName || fallback;
}

function canCancelOrder(
    order: AdminOrder
) {
    return (
        order.status ===
            "pending_payment" ||
        order.status === "processing"
    );
}

function canDeleteOrder(
    order: AdminOrder
) {
    return (
        order.status === "cancelled" ||
        (
            order.status ===
                "pending_payment" &&
            order.paymentStatus ===
                "pending"
        )
    );
}

function StatCard({
    label,
    value,
}: {
    label: string;
    value: number;
}) {
    return (
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)]">
                {label}
            </p>

            <p className="mt-2 text-3xl font-black text-[var(--text-primary)]">
                {value}
            </p>
        </div>
    );
}

export default function AdminOrdersPage() {
    const { language } =
        useLanguage();

    const {
        data: session,
        isPending: sessionLoading,
    } = useSession();

    const router = useRouter();

    const t =
        translations[language];

    const [orders, setOrders] =
        useState<AdminOrder[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [refreshing, setRefreshing] =
        useState(false);

    const [error, setError] =
        useState("");

    const [selectedOrder, setSelectedOrder] =
        useState<AdminOrder | null>(null);

    const [selectedStatus, setSelectedStatus] =
        useState("");

    const [trackingNumber, setTrackingNumber] =
        useState("");

    const [modalAction, setModalAction] =
        useState<ModalAction>("update");

    const [updatingOrderId, setUpdatingOrderId] =
        useState<string | null>(null);

    const [successMessage, setSuccessMessage] =
        useState("");

    const [searchTerm, setSearchTerm] =
        useState("");

    const [statusFilter, setStatusFilter] =
        useState<StatusFilter>("all");

    const [paymentFilter, setPaymentFilter] =
        useState<PaymentFilter>("all");

    const fetchOrders = useCallback(
        async (
            options?: {
                refresh?: boolean;
            }
        ) => {
            if (!session?.user?.id) {
                return;
            }

            const isRefresh =
                options?.refresh === true;

            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            setError("");

            try {
                const response =
                    await fetch(
                        "/api/admin/orders",
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
                        t.loadError
                    );
                }

                setOrders(
                    Array.isArray(
                        data.orders
                    )
                        ? data.orders
                        : []
                );
            } catch (loadError) {
                console.error(
                    "Admin orders load error:",
                    loadError
                );

                setError(
                    t.loadError
                );
            } finally {
                if (isRefresh) {
                    setRefreshing(false);
                } else {
                    setLoading(false);
                }
            }
        },
        [
            session?.user?.id,
            t.loadError,
        ]
    );

    useEffect(() => {
        if (
            sessionLoading ||
            !session?.user?.id
        ) {
            return;
        }

        let cancelled = false;

        const loadInitialOrders =
            async () => {
                try {
                    const response =
                        await fetch(
                            "/api/admin/orders",
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
                            t.loadError
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
                } catch (loadError) {
                    console.error(
                        "Admin orders initial load error:",
                        loadError
                    );

                    if (!cancelled) {
                        setError(
                            t.loadError
                        );
                    }
                } finally {
                    if (!cancelled) {
                        setLoading(false);
                    }
                }
            };

        void loadInitialOrders();

        return () => {
            cancelled = true;
        };
    }, [
        sessionLoading,
        session?.user?.id,
        t.loadError,
    ]);

    const stats = useMemo(() => {
        return {
            total: orders.length,

            pendingPayment:
                orders.filter(
                    (order) =>
                        order.status ===
                        "pending_payment"
                ).length,

            processing:
                orders.filter(
                    (order) =>
                        order.status ===
                        "processing"
                ).length,

            shipped:
                orders.filter(
                    (order) =>
                        order.status ===
                        "shipped"
                ).length,

            delivered:
                orders.filter(
                    (order) =>
                        order.status ===
                        "delivered"
                ).length,
        };
    }, [orders]);

    const filteredOrders =
        useMemo(() => {
            const normalizedSearch =
                searchTerm
                    .trim()
                    .toLowerCase();

            return orders.filter(
                (order) => {
                    const customerName =
                        getCustomerName(
                            order,
                            ""
                        );

                    const email =
                        order.shipping
                            ?.email ||
                        "";

                    const matchesSearch =
                        !normalizedSearch ||
                        order.id
                            .toLowerCase()
                            .includes(
                                normalizedSearch
                            ) ||
                        customerName
                            .toLowerCase()
                            .includes(
                                normalizedSearch
                            ) ||
                        email
                            .toLowerCase()
                            .includes(
                                normalizedSearch
                            );

                    const matchesStatus =
                        statusFilter ===
                            "all" ||
                        order.status ===
                            statusFilter;

                    const matchesPayment =
                        paymentFilter ===
                            "all" ||
                        order.paymentStatus ===
                            paymentFilter;

                    return (
                        matchesSearch &&
                        matchesStatus &&
                        matchesPayment
                    );
                }
            );
        }, [
            orders,
            searchTerm,
            statusFilter,
            paymentFilter,
        ]);

    const hasActiveFilters =
        searchTerm.trim() !== "" ||
        statusFilter !== "all" ||
        paymentFilter !== "all";

    const clearFilters = () => {
        setSearchTerm("");
        setStatusFilter("all");
        setPaymentFilter("all");
    };

    const openUpdateModal = (
        order: AdminOrder
    ) => {
        setSelectedOrder(order);

        setSelectedStatus(
            order.status
        );

        setTrackingNumber(
            order.trackingNumber ?? ""
        );

        setModalAction("update");

        setError("");
        setSuccessMessage("");
    };

    const openCancelModal = (
        order: AdminOrder
    ) => {
        if (!canCancelOrder(order)) {
            setError(
                t.cannotCancel
            );
            return;
        }

        setSelectedOrder(order);

        setSelectedStatus(
            "cancelled"
        );

        setTrackingNumber(
            order.trackingNumber ?? ""
        );

        setModalAction("cancel");

        setError("");
        setSuccessMessage("");
    };

    const openDeleteModal = (
        order: AdminOrder
    ) => {
        if (!canDeleteOrder(order)) {
            setError(
                t.cannotDelete
            );
            return;
        }

        setSelectedOrder(order);

        setModalAction("delete");

        setError("");
        setSuccessMessage("");
    };

    const closeModal = () => {
        if (
            updatingOrderId !== null
        ) {
            return;
        }

        setSelectedOrder(null);
        setSelectedStatus("");
        setTrackingNumber("");
        setModalAction("update");
    };

    const updateOrder = async () => {
        if (!selectedOrder) {
            return;
        }

        const status =
            modalAction === "cancel"
                ? "cancelled"
                : selectedStatus;

        if (!status) {
            return;
        }

        const normalizedTracking =
            trackingNumber.trim();

        if (
            status === "shipped" &&
            !normalizedTracking
        ) {
            setError(
                t.trackingRequired
            );
            return;
        }

        /*
         * Keep the important payment safety rule:
         * unpaid orders cannot become processing.
         */
        if (
            status === "processing" &&
            selectedOrder.paymentStatus !==
                "paid"
        ) {
            setError(
                "This order cannot be moved to processing until the payment is confirmed."
            );
            return;
        }

        setUpdatingOrderId(
            selectedOrder.id
        );

        setError("");
        setSuccessMessage("");

        try {
            const response =
                await fetch(
                    `/api/admin/orders/${encodeURIComponent(
                        selectedOrder.id
                    )}`,
                    {
                        method: "PATCH",
                        headers: {
                            "Content-Type":
                                "application/json",
                        },
                        body: JSON.stringify(
                            {
                                status,
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

            setOrders(
                (currentOrders) =>
                    currentOrders.map(
                        (order) =>
                            order.id ===
                            selectedOrder.id
                                ? {
                                    ...order,
                                    status:
                                        updatedOrder?.status ??
                                        status,
                                    paymentStatus:
                                        updatedOrder?.paymentStatus ??
                                        order.paymentStatus,
                                    trackingNumber:
                                        updatedOrder?.trackingNumber ??
                                        null,
                                }
                                : order
                    )
            );

            closeModal();

            setSuccessMessage(
                t.success
            );

            window.setTimeout(
                () => {
                    setSuccessMessage("");
                },
                4000
            );
        } catch (updateError) {
            console.error(
                "Admin update order error:",
                updateError
            );

            setError(
                updateError instanceof Error
                    ? updateError.message
                    : t.updateError
            );
        } finally {
            setUpdatingOrderId(null);
        }
    };

    const deleteOrder = async () => {
        if (!selectedOrder) {
            return;
        }

        if (
            !canDeleteOrder(
                selectedOrder
            )
        ) {
            setError(
                t.cannotDelete
            );
            return;
        }

        setUpdatingOrderId(
            selectedOrder.id
        );

        setError("");
        setSuccessMessage("");

        try {
            const response =
                await fetch(
                    `/api/admin/orders/${encodeURIComponent(
                        selectedOrder.id
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

            setOrders(
                (currentOrders) =>
                    currentOrders.filter(
                        (order) =>
                            order.id !==
                            selectedOrder.id
                    )
            );

            closeModal();

            setSuccessMessage(
                t.success
            );

            window.setTimeout(
                () => {
                    setSuccessMessage("");
                },
                4000
            );
        } catch (deleteError) {
            console.error(
                "Admin delete order error:",
                deleteError
            );

            setError(
                deleteError instanceof Error
                    ? deleteError.message
                    : t.cannotDelete
            );
        } finally {
            setUpdatingOrderId(null);
        }
    };

    if (sessionLoading) {
        return (
            <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
                <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center">
                    <p className="text-[var(--text-secondary)]">
                        {t.loading}
                    </p>
                </div>
            </main>
        );
    }

    if (!session?.user) {
        return (
            <main
                dir={
                    language === "ar"
                        ? "rtl"
                        : "ltr"
                }
                className="mx-auto max-w-5xl px-4 py-12 sm:px-6"
            >
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
            className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14"
        >
            <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--brand-strong)]">
                        JAN-GET Admin
                    </p>

                    <h1 className="mt-2 text-3xl font-black text-[var(--text-primary)] sm:text-4xl">
                        {t.title}
                    </h1>

                    <p className="mt-2 max-w-2xl text-[var(--text-secondary)]">
                        {t.subtitle}
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() =>
                        router.push(
                            "/account"
                        )
                    }
                    className="rounded-full border border-[var(--border)] px-5 py-2.5 text-sm font-semibold text-[var(--text-primary)] transition hover:bg-[var(--surface-soft)]"
                >
                    {t.backToAccount}
                </button>
            </div>

            <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <StatCard
                    label={t.order}
                    value={stats.total}
                />

                <StatCard
                    label={t.pendingPayment}
                    value={
                        stats.pendingPayment
                    }
                />

                <StatCard
                    label={t.processing}
                    value={
                        stats.processing
                    }
                />

                <StatCard
                    label={t.shipped}
                    value={
                        stats.shipped
                    }
                />

                <StatCard
                    label={t.delivered}
                    value={
                        stats.delivered
                    }
                />
            </div>

            {successMessage && (
                <div className="mb-6 rounded-2xl bg-green-100 px-4 py-3 text-sm font-medium text-green-800 dark:bg-green-950/40 dark:text-green-300">
                    {successMessage}
                </div>
            )}

            {error && (
                <div className="mb-6 rounded-2xl bg-red-100 px-4 py-3 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-300">
                    {error}
                </div>
            )}

            <section className="mb-6 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm sm:p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
                    <div className="min-w-0 flex-1">
                        <label
                            htmlFor="order-search"
                            className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]"
                        >
                            {t.order}
                        </label>

                        <div className="relative">
                            <span
                                aria-hidden="true"
                                className="pointer-events-none absolute inset-y-0 start-4 flex items-center text-lg text-[var(--text-muted)]"
                            >
                                🔎
                            </span>

                            <input
                                id="order-search"
                                type="search"
                                value={
                                    searchTerm
                                }
                                onChange={(
                                    event
                                ) =>
                                    setSearchTerm(
                                        event
                                            .target
                                            .value
                                    )
                                }
                                placeholder={
                                    t.searchPlaceholder
                                }
                                className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] py-3 ps-11 pe-4 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--brand)]"
                            />
                        </div>
                    </div>

                    <div className="w-full lg:w-52">
                        <label
                            htmlFor="status-filter"
                            className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]"
                        >
                            {t.filterStatus}
                        </label>

                        <select
                            id="status-filter"
                            value={
                                statusFilter
                            }
                            onChange={(
                                event
                            ) =>
                                setStatusFilter(
                                    event
                                        .target
                                        .value as StatusFilter
                                )
                            }
                            className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm font-medium text-[var(--text-primary)] outline-none transition focus:border-[var(--brand)]"
                        >
                            <option value="all">
                                {
                                    t.allStatuses
                                }
                            </option>

                            <option value="pending_payment">
                                {
                                    t.pendingPayment
                                }
                            </option>

                            <option value="processing">
                                {
                                    t.processing
                                }
                            </option>

                            <option value="shipped">
                                {t.shipped}
                            </option>

                            <option value="delivered">
                                {
                                    t.delivered
                                }
                            </option>

                            <option value="cancelled">
                                {
                                    t.cancelled
                                }
                            </option>
                        </select>
                    </div>

                    <div className="w-full lg:w-52">
                        <label
                            htmlFor="payment-filter"
                            className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]"
                        >
                            {t.filterPayment}
                        </label>

                        <select
                            id="payment-filter"
                            value={
                                paymentFilter
                            }
                            onChange={(
                                event
                            ) =>
                                setPaymentFilter(
                                    event
                                        .target
                                        .value as PaymentFilter
                                )
                            }
                            className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm font-medium text-[var(--text-primary)] outline-none transition focus:border-[var(--brand)]"
                        >
                            <option value="all">
                                {
                                    t.allPayments
                                }
                            </option>

                            <option value="pending">
                                {t.pending}
                            </option>

                            <option value="paid">
                                {t.paid}
                            </option>
                        </select>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row lg:shrink-0">
                        <button
                            type="button"
                            onClick={() =>
                                fetchOrders({
                                    refresh: true,
                                })
                            }
                            disabled={
                                refreshing
                            }
                            className="rounded-2xl bg-[var(--brand)] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {refreshing
                                ? t.refreshing
                                : `↻ ${t.refresh}`}
                        </button>

                        {hasActiveFilters && (
                            <button
                                type="button"
                                onClick={
                                    clearFilters
                                }
                                className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-5 py-3 text-sm font-semibold text-[var(--text-primary)] transition hover:bg-[var(--surface-soft)]"
                            >
                                {
                                    t.clearFilters
                                }
                            </button>
                        )}
                    </div>
                </div>

                <div className="mt-4 flex items-center justify-between gap-3 border-t border-[var(--border)] pt-4">
                    <p className="text-sm text-[var(--text-secondary)]">
                        <span className="font-bold text-[var(--text-primary)]">
                            {
                                filteredOrders.length
                            }
                        </span>{" "}
                        {t.results}
                    </p>

                    {hasActiveFilters && (
                        <p className="text-xs font-medium text-[var(--brand-strong)]">
                            {
                                t.clearFilters
                            }
                        </p>
                    )}
                </div>
            </section>

            <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm sm:p-6">
                {loading ? (
                    <div className="rounded-2xl bg-[var(--surface-soft)] p-10 text-center">
                        <p className="text-[var(--text-secondary)]">
                            {t.loading}
                        </p>
                    </div>
                ) : orders.length === 0 ? (
                    <div className="rounded-2xl bg-[var(--surface-soft)] p-10 text-center">
                        <p className="text-[var(--text-secondary)]">
                            {t.noOrders}
                        </p>
                    </div>
                ) : filteredOrders.length === 0 ? (
                    <div className="rounded-2xl bg-[var(--surface-soft)] p-10 text-center">
                        <p className="text-[var(--text-secondary)]">
                            {
                                t.noMatchingOrders
                            }
                        </p>

                        {hasActiveFilters && (
                            <button
                                type="button"
                                onClick={
                                    clearFilters
                                }
                                className="mt-5 rounded-full bg-[var(--brand)] px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
                            >
                                {
                                    t.clearFilters
                                }
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-5">
                        {filteredOrders.map(
                            (order) => {
                                const customerName =
                                    getCustomerName(
                                        order,
                                        t.customerUnknown
                                    );

                                const canCancel =
                                    canCancelOrder(
                                        order
                                    );

                                const canDelete =
                                    canDeleteOrder(
                                        order
                                    );

                                return (
                                    <article
                                        key={
                                            order.id
                                        }
                                        className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)]"
                                    >
                                        <div className="border-b border-[var(--border)] p-5">
                                            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                                                <div className="min-w-0">
                                                    <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)]">
                                                        {
                                                            t.order
                                                        }
                                                    </p>

                                                    <p className="mt-1 break-all text-lg font-black text-[var(--text-primary)]">
                                                        {
                                                            order.id
                                                        }
                                                    </p>

                                                    <p className="mt-1 text-sm text-[var(--text-secondary)]">
                                                        {formatOrderDate(
                                                            order.createdAt,
                                                            language
                                                        )}
                                                    </p>
                                                </div>

                                                <div className="flex flex-wrap gap-2 xl:justify-end">
                                                    <span
                                                        className={`rounded-full px-3 py-1.5 text-xs font-semibold ${getStatusClasses(
                                                            order.status
                                                        )}`}
                                                    >
                                                        {getOrderStatusLabel(
                                                            order.status,
                                                            t
                                                        )}
                                                    </span>

                                                    <span className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)]">
                                                        {
                                                            t.payment
                                                        }
                                                        :{" "}
                                                        {getPaymentStatusLabel(
                                                            order.paymentStatus,
                                                            t
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-5">
                                            <div className="grid gap-5 lg:grid-cols-[1fr_auto]">
                                                <div>
                                                    <div className="mb-5">
                                                        <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)]">
                                                            {
                                                                t.customer
                                                            }
                                                        </p>

                                                        <p className="mt-1 font-bold text-[var(--text-primary)]">
                                                            {
                                                                customerName
                                                            }
                                                        </p>

                                                        {order.shipping?.email && (
                                                            <p className="mt-1 break-all text-sm text-[var(--text-secondary)]">
                                                                {
                                                                    order
                                                                        .shipping
                                                                        .email
                                                                }
                                                            </p>
                                                        )}
                                                    </div>

                                                    <div className="mb-5">
                                                        <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)]">
                                                            {
                                                                t.trackingNumber
                                                            }
                                                        </p>

                                                        {order.trackingNumber ? (
                                                            <p className="mt-1 break-all font-semibold text-[var(--text-primary)]">
                                                                {
                                                                    order.trackingNumber
                                                                }
                                                            </p>
                                                        ) : (
                                                            <p className="mt-1 text-sm text-[var(--text-muted)]">
                                                                {
                                                                    t.noTrackingNumber
                                                                }
                                                            </p>
                                                        )}
                                                    </div>

                                                    <div>
                                                        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)]">
                                                            {
                                                                t.items
                                                            }
                                                        </p>

                                                        <div className="space-y-3">
                                                            {order.items.map(
                                                                (
                                                                    item,
                                                                    index
                                                                ) => (
                                                                    <div
                                                                        key={`${order.id}-${item.productId}-${item.colorKey ?? "default"}-${index}`}
                                                                        className="flex gap-3"
                                                                    >
                                                                        {item.image ? (
                                                                            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]">
                                                                                <Image
                                                                                    src={
                                                                                        item.image
                                                                                    }
                                                                                    alt={
                                                                                        item.name
                                                                                    }
                                                                                    fill
                                                                                    sizes="56px"
                                                                                    className="object-cover"
                                                                                />
                                                                            </div>
                                                                        ) : (
                                                                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] text-xs text-[var(--text-secondary)]">
                                                                                3D
                                                                            </div>
                                                                        )}

                                                                        <div className="min-w-0 flex-1">
                                                                            <p className="font-semibold text-[var(--text-primary)]">
                                                                                {
                                                                                    item.name
                                                                                }
                                                                            </p>

                                                                            <p className="mt-1 text-sm text-[var(--text-secondary)]">
                                                                                {
                                                                                    item.quantity
                                                                                }{" "}
                                                                                {item.quantity ===
                                                                                    1
                                                                                    ? t.item
                                                                                    : t.itemPlural}
                                                                            </p>
                                                                        </div>

                                                                        <p className="shrink-0 font-bold text-[var(--text-primary)]">
                                                                            €
                                                                            {(
                                                                                item.price *
                                                                                item.quantity
                                                                            ).toFixed(
                                                                                2
                                                                            )}
                                                                        </p>
                                                                    </div>
                                                                )
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex min-w-[250px] flex-col justify-between gap-4 border-t border-[var(--border)] pt-5 lg:border-t-0 lg:border-s lg:pt-0 lg:ps-5">
                                                    <div>
                                                        <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)]">
                                                            {
                                                                t.total
                                                            }
                                                        </p>

                                                        <p className="mt-1 text-2xl font-black text-[var(--brand-strong)]">
                                                            €
                                                            {order.total.toFixed(
                                                                2
                                                            )}
                                                        </p>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <button
                                                            type="button"
                                                            disabled={
                                                                updatingOrderId ===
                                                                order.id
                                                            }
                                                            onClick={() =>
                                                                openUpdateModal(
                                                                    order
                                                                )
                                                            }
                                                            className="w-full rounded-2xl bg-[var(--brand)] px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                                                        >
                                                            {
                                                                t.updateStatus
                                                            }
                                                        </button>

                                                        {canCancel && (
                                                            <button
                                                                type="button"
                                                                disabled={
                                                                    updatingOrderId ===
                                                                    order.id
                                                                }
                                                                onClick={() =>
                                                                    openCancelModal(
                                                                        order
                                                                    )
                                                                }
                                                                className="w-full rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-100 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300 dark:hover:bg-red-950/50"
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
                                                                    updatingOrderId ===
                                                                    order.id
                                                                }
                                                                onClick={() =>
                                                                    openDeleteModal(
                                                                        order
                                                                    )
                                                                }
                                                                className="w-full rounded-2xl border border-red-300 px-4 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-50 dark:border-red-900/60 dark:text-red-300 dark:hover:bg-red-950/30"
                                                            >
                                                                {
                                                                    t.deleteOrder
                                                                }
                                                            </button>
                                                        )}

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                router.push(
                                                                    `/admin/orders/${encodeURIComponent(
                                                                        order.id
                                                                    )}`
                                                                )
                                                            }
                                                            className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm font-semibold text-[var(--text-primary)] transition hover:bg-[var(--surface-soft)]"
                                                        >
                                                            {
                                                                t.viewOrder
                                                            }
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </article>
                                );
                            }
                        )}
                    </div>
                )}
            </section>

            {selectedOrder && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                    onMouseDown={(
                        event
                    ) => {
                        if (
                            event.target ===
                            event.currentTarget
                        ) {
                            closeModal();
                        }
                    }}
                >
                    <div
                        dir={
                            language === "ar"
                                ? "rtl"
                                : "ltr"
                        }
                        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl"
                    >
                        {modalAction ===
                        "delete" ? (
                            <>
                                <h2 className="text-xl font-black text-[var(--text-primary)]">
                                    {
                                        t.deleteOrderTitle
                                    }
                                </h2>

                                <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
                                    {
                                        t.deleteOrderText
                                    }
                                </p>

                                <div className="mt-5 rounded-2xl bg-[var(--surface-soft)] p-4">
                                    <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)]">
                                        {
                                            t.order
                                        }
                                    </p>

                                    <p className="mt-1 break-all font-bold text-[var(--text-primary)]">
                                        {
                                            selectedOrder.id
                                        }
                                    </p>

                                    <span
                                        className={`mt-3 inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ${getStatusClasses(
                                            selectedOrder.status
                                        )}`}
                                    >
                                        {getOrderStatusLabel(
                                            selectedOrder.status,
                                            t
                                        )}
                                    </span>
                                </div>

                                <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                                    <button
                                        type="button"
                                        onClick={
                                            closeModal
                                        }
                                        disabled={
                                            updatingOrderId !==
                                            null
                                        }
                                        className="rounded-2xl border border-[var(--border)] px-5 py-3 text-sm font-semibold text-[var(--text-primary)] transition hover:bg-[var(--surface-soft)] disabled:opacity-50"
                                    >
                                        {
                                            t.cancel
                                        }
                                    </button>

                                    <button
                                        type="button"
                                        onClick={
                                            deleteOrder
                                        }
                                        disabled={
                                            updatingOrderId !==
                                            null
                                        }
                                        className="rounded-2xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {updatingOrderId !==
                                        null
                                            ? t.deleting
                                            : t.confirmDelete}
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <h2 className="text-xl font-black text-[var(--text-primary)]">
                                    {modalAction ===
                                    "cancel"
                                        ? t.cancelOrderTitle
                                        : t.confirmTitle}
                                </h2>

                                <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
                                    {modalAction ===
                                    "cancel"
                                        ? t.cancelOrderText
                                        : t.confirmText}
                                </p>

                                <div className="mt-5 rounded-2xl bg-[var(--surface-soft)] p-4">
                                    <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)]">
                                        {
                                            t.order
                                        }
                                    </p>

                                    <p className="mt-1 break-all font-bold text-[var(--text-primary)]">
                                        {
                                            selectedOrder.id
                                        }
                                    </p>

                                    <div className="mt-3 flex flex-wrap items-center gap-2">
                                        <span
                                            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${getStatusClasses(
                                                selectedOrder.status
                                            )}`}
                                        >
                                            {getOrderStatusLabel(
                                                selectedOrder.status,
                                                t
                                            )}
                                        </span>

                                        <span className="text-[var(--text-secondary)]">
                                            →
                                        </span>

                                        <span
                                            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${getStatusClasses(
                                                selectedStatus
                                            )}`}
                                        >
                                            {getOrderStatusLabel(
                                                selectedStatus,
                                                t
                                            )}
                                        </span>
                                    </div>
                                </div>

                                {modalAction ===
                                    "update" && (
                                    <div className="mt-5">
                                        <label
                                            htmlFor="admin-order-status"
                                            className="mb-2 block text-sm font-semibold text-[var(--text-primary)]"
                                        >
                                            {
                                                t.status
                                            }
                                        </label>

                                        <select
                                            id="admin-order-status"
                                            value={
                                                selectedStatus
                                            }
                                            onChange={(
                                                event
                                            ) =>
                                                setSelectedStatus(
                                                    event
                                                        .target
                                                        .value
                                                )
                                            }
                                            className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm font-medium text-[var(--text-primary)] outline-none transition focus:border-[var(--brand)]"
                                        >
                                            {ORDER_STATUSES.map(
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
                                )}

                                {(
                                    modalAction ===
                                        "update" ||
                                    selectedStatus ===
                                        "shipped"
                                ) && (
                                    <div className="mt-5">
                                        <label
                                            htmlFor="admin-tracking-number"
                                            className="mb-2 block text-sm font-semibold text-[var(--text-primary)]"
                                        >
                                            {
                                                t.trackingNumber
                                            }
                                            {selectedStatus ===
                                                "shipped" && (
                                                <span className="ms-1 text-red-500">
                                                    *
                                                </span>
                                            )}
                                        </label>

                                        <input
                                            id="admin-tracking-number"
                                            type="text"
                                            value={
                                                trackingNumber
                                            }
                                            onChange={(
                                                event
                                            ) =>
                                                setTrackingNumber(
                                                    event
                                                        .target
                                                        .value
                                                )
                                            }
                                            placeholder={
                                                t.trackingPlaceholder
                                            }
                                            className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--brand)]"
                                        />

                                        {selectedStatus ===
                                            "shipped" && (
                                            <p className="mt-2 text-xs text-[var(--text-secondary)]">
                                                {
                                                    t.trackingRequired
                                                }
                                            </p>
                                        )}
                                    </div>
                                )}

                                <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                                    <button
                                        type="button"
                                        onClick={
                                            closeModal
                                        }
                                        disabled={
                                            updatingOrderId !==
                                            null
                                        }
                                        className="rounded-2xl border border-[var(--border)] px-5 py-3 text-sm font-semibold text-[var(--text-primary)] transition hover:bg-[var(--surface-soft)] disabled:opacity-50"
                                    >
                                        {
                                            t.cancel
                                        }
                                    </button>

                                    <button
                                        type="button"
                                        onClick={
                                            updateOrder
                                        }
                                        disabled={
                                            updatingOrderId !==
                                            null
                                        }
                                        className={`rounded-2xl px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 ${
                                            modalAction ===
                                            "cancel"
                                                ? "bg-red-600"
                                                : "bg-[var(--brand)]"
                                        }`}
                                    >
                                        {updatingOrderId !==
                                        null
                                            ? modalAction ===
                                              "cancel"
                                                ? t.cancelling
                                                : t.updating
                                            : modalAction ===
                                              "cancel"
                                                ? t.confirmCancel
                                                : t.saveChanges}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </main>
    );
}