"use client";

import { useRouter } from "next/navigation";

import { useLanguage } from "@/components/LanguageProvider";

const translations = {
    en: {
        title: "Admin Dashboard",
        subtitle:
            "Manage your JAN-GET store from one place.",
        ordersTitle: "Orders",
        ordersDescription:
            "View customer orders, check payment status, and update delivery progress.",
        manageOrders: "Manage Orders",
        productsTitle: "Products",
        productsDescription:
            "Add, edit, remove, and manage the products available in your JAN-GET store.",
        manageProducts: "Manage Products",
        vouchersTitle: "Vouchers",
        vouchersDescription:
            "Create, edit, activate, deactivate, and manage discount vouchers for your customers.",
        manageVouchers: "Manage Vouchers",
        account: "Account",
        backToAccount: "Back to Account",
        store: "JAN-GET Admin",
        storeDescription:
            "3D Printed Creations",
    },

    de: {
        title: "Admin Dashboard",
        subtitle:
            "Verwalte deinen JAN-GET-Shop an einem Ort.",
        ordersTitle: "Bestellungen",
        ordersDescription:
            "Kundenbestellungen anzeigen, Zahlungsstatus prüfen und Lieferstatus aktualisieren.",
        manageOrders: "Bestellungen verwalten",
        productsTitle: "Produkte",
        productsDescription:
            "Produkte in deinem JAN-GET-Shop hinzufügen, bearbeiten, entfernen und verwalten.",
        manageProducts: "Produkte verwalten",
        vouchersTitle: "Gutscheine",
        vouchersDescription:
            "Gutscheine für Kunden erstellen, bearbeiten, aktivieren, deaktivieren und verwalten.",
        manageVouchers: "Gutscheine verwalten",
        account: "Konto",
        backToAccount: "Zum Konto",
        store: "JAN-GET Admin",
        storeDescription:
            "3D Printed Creations",
    },

    ar: {
        title: "لوحة تحكم الإدارة",
        subtitle:
            "إدارة متجر JAN-GET بالكامل من مكان واحد.",
        ordersTitle: "الطلبات",
        ordersDescription:
            "عرض طلبات العملاء ومراجعة حالة الدفع وتحديث حالة الشحن والتوصيل.",
        manageOrders: "إدارة الطلبات",
        productsTitle: "المنتجات",
        productsDescription:
            "إضافة المنتجات وتعديلها وحذفها وإدارة المنتجات المتاحة في متجر JAN-GET.",
        manageProducts: "إدارة المنتجات",
        vouchersTitle: "القسائم",
        vouchersDescription:
            "إنشاء القسائم وتعديلها وتفعيلها وإيقافها وإدارة خصومات العملاء.",
        manageVouchers: "إدارة القسائم",
        account: "الحساب",
        backToAccount: "العودة إلى الحساب",
        store: "إدارة JAN-GET",
        storeDescription:
            "3D Printed Creations",
    },
};

export default function AdminDashboardPage() {
    const router = useRouter();

    const { language } = useLanguage();

    const t = translations[language];

    const isArabic = language === "ar";

    return (
        <main
            dir={isArabic ? "rtl" : "ltr"}
            className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14"
        >
            <div className="mb-10">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--brand-strong)]">
                    {t.store}
                </p>

                <h1 className="mt-2 text-3xl font-black text-[var(--text-primary)] sm:text-4xl">
                    {t.title}
                </h1>

                <p className="mt-3 max-w-2xl text-[var(--text-secondary)]">
                    {t.subtitle}
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <button
                    type="button"
                    onClick={() =>
                        router.push("/admin/orders")
                    }
                    className="group rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 text-start shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--brand-soft)] text-2xl">
                        🛍️
                    </div>

                    <h2 className="mt-5 text-xl font-black text-[var(--text-primary)]">
                        {t.ordersTitle}
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                        {t.ordersDescription}
                    </p>

                    <div className="mt-5 inline-flex rounded-full bg-[var(--brand)] px-5 py-2.5 text-sm font-semibold text-white transition group-hover:opacity-90">
                        {t.manageOrders}
                    </div>
                </button>

                <button
                    type="button"
                    onClick={() =>
                        router.push("/admin/products")
                    }
                    className="group rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 text-start shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--brand-soft)] text-2xl">
                        📦
                    </div>

                    <h2 className="mt-5 text-xl font-black text-[var(--text-primary)]">
                        {t.productsTitle}
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                        {t.productsDescription}
                    </p>

                    <div className="mt-5 inline-flex rounded-full bg-[var(--brand)] px-5 py-2.5 text-sm font-semibold text-white transition group-hover:opacity-90">
                        {t.manageProducts}
                    </div>
                </button>

                <button
                    type="button"
                    onClick={() =>
                        router.push("/admin/vouchers")
                    }
                    className="group rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 text-start shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--brand-soft)] text-2xl">
                        🎟️
                    </div>

                    <h2 className="mt-5 text-xl font-black text-[var(--text-primary)]">
                        {t.vouchersTitle}
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                        {t.vouchersDescription}
                    </p>

                    <div className="mt-5 inline-flex rounded-full bg-[var(--brand)] px-5 py-2.5 text-sm font-semibold text-white transition group-hover:opacity-90">
                        {t.manageVouchers}
                    </div>
                </button>

                <button
                    type="button"
                    onClick={() =>
                        router.push("/account")
                    }
                    className="group rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 text-start shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--brand-soft)] text-2xl">
                        👤
                    </div>

                    <h2 className="mt-5 text-xl font-black text-[var(--text-primary)]">
                        {t.account}
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                        {t.storeDescription}
                    </p>

                    <div className="mt-5 inline-flex rounded-full border border-[var(--border)] bg-[var(--surface-soft)] px-5 py-2.5 text-sm font-semibold text-[var(--text-primary)] transition group-hover:bg-[var(--brand-soft)]">
                        {t.backToAccount}
                    </div>
                </button>
            </div>
        </main>
    );
}