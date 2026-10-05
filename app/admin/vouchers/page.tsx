"use client";

import {
    FormEvent,
    useCallback,
    useEffect,
    useState,
} from "react";
import { useRouter } from "next/navigation";

import { useLanguage } from "@/components/LanguageProvider";

type VoucherType = "fixed" | "percentage" | "free_delivery";

type Voucher = {
    id: string;
    code: string;
    type: VoucherType;
    value: number | null;
    minimumSubtotal: number | null;
    maxDiscount: number | null;
    active: boolean;
    validFrom: string | null;
    validUntil: string | null;
    usageLimitPerUser: number;
    totalUsageLimit: number | null;
    usedCount: number;
    createdAt: string;
    updatedAt: string;
};

const translations = {
    en: {
        title: "Manage Vouchers",
        subtitle:
            "Create and manage discount vouchers for your JAN-GET customers.",
        back: "Back to Dashboard",
        add: "Add Voucher",
        edit: "Edit Voucher",
        create: "Create Voucher",
        save: "Save Changes",
        cancel: "Cancel",
        delete: "Delete",
        confirmDelete:
            "Are you sure you want to delete this voucher?",
        code: "Voucher Code",
        type: "Type",
        value: "Value",
        euro: "€",
        minimumSubtotal: "Minimum Subtotal",
        maxDiscount: "Maximum Discount",
        validFrom: "Valid From",
        validUntil: "Valid Until",
        usageLimitPerUser: "Usage Limit per User",
        totalUsageLimit: "Total Usage Limit",
        unlimited: "Unlimited",
        perUser: "per user",
        active: "Active",
        inactive: "Inactive",
        fixed: "Fixed Discount",
        percentage: "Percentage Discount",
        freeDelivery: "Free Delivery",
        uses: "Uses",
        status: "Status",
        actions: "Actions",
        noVouchers:
            "No vouchers have been created yet.",
        loading: "Loading vouchers...",
        creating: "Creating...",
        saving: "Saving...",
        deleting: "Deleting...",
        errorLoading:
            "Unable to load vouchers.",
        errorSaving:
            "Unable to save voucher.",
        errorDeleting:
            "Unable to delete voucher.",
        successCreated:
            "Voucher created successfully.",
        successUpdated:
            "Voucher updated successfully.",
        successDeleted:
            "Voucher deleted successfully.",
        validationCode:
            "Voucher code is required.",
        validationType:
            "Voucher type is required.",
        validationValue:
            "A value greater than zero is required.",
        validationPercentage:
            "Percentage must be between 0 and 100.",
        validationUsagePerUser:
            "Usage limit per user must be a positive whole number.",
        validationTotalUsage:
            "Total usage limit must be a positive whole number.",
        clearDates:
            "Leave empty for no date restriction.",
    },

    de: {
        title: "Gutscheine verwalten",
        subtitle:
            "Rabattgutscheine für deine JAN-GET-Kunden erstellen und verwalten.",
        back: "Zurück zum Dashboard",
        add: "Gutschein hinzufügen",
        edit: "Gutschein bearbeiten",
        create: "Gutschein erstellen",
        save: "Änderungen speichern",
        cancel: "Abbrechen",
        delete: "Löschen",
        confirmDelete:
            "Möchtest du diesen Gutschein wirklich löschen?",
        code: "Gutscheincode",
        type: "Typ",
        value: "Wert",
        euro: "€",
        minimumSubtotal: "Mindestbestellwert",
        maxDiscount: "Maximaler Rabatt",
        validFrom: "Gültig ab",
        validUntil: "Gültig bis",
        usageLimitPerUser: "Nutzungslimit pro Benutzer",
        totalUsageLimit: "Gesamtes Nutzungslimit",
        unlimited: "Unbegrenzt",
        perUser: "pro Benutzer",
        active: "Aktiv",
        inactive: "Inaktiv",
        fixed: "Fester Rabatt",
        percentage: "Prozentualer Rabatt",
        freeDelivery: "Kostenlose Lieferung",
        uses: "Nutzungen",
        status: "Status",
        actions: "Aktionen",
        noVouchers:
            "Es wurden noch keine Gutscheine erstellt.",
        loading: "Gutscheine werden geladen...",
        creating: "Wird erstellt...",
        saving: "Wird gespeichert...",
        deleting: "Wird gelöscht...",
        errorLoading:
            "Gutscheine konnten nicht geladen werden.",
        errorSaving:
            "Gutschein konnte nicht gespeichert werden.",
        errorDeleting:
            "Gutschein konnte nicht gelöscht werden.",
        successCreated:
            "Gutschein wurde erfolgreich erstellt.",
        successUpdated:
            "Gutschein wurde erfolgreich aktualisiert.",
        successDeleted:
            "Gutschein wurde erfolgreich gelöscht.",
        validationCode:
            "Gutscheincode ist erforderlich.",
        validationType:
            "Gutscheintyp ist erforderlich.",
        validationValue:
            "Ein Wert größer als null ist erforderlich.",
        validationPercentage:
            "Der Prozentsatz muss zwischen 0 und 100 liegen.",
        validationUsagePerUser:
            "Das Nutzungslimit pro Benutzer muss eine positive ganze Zahl sein.",
        validationTotalUsage:
            "Das Gesamtnutzungslimit muss eine positive ganze Zahl sein.",
        clearDates:
            "Leer lassen für keine Datumsbegrenzung.",
    },

    ar: {
        title: "إدارة القسائم",
        subtitle:
            "إنشاء وإدارة قسائم الخصم لعملاء JAN-GET.",
        back: "العودة إلى لوحة التحكم",
        add: "إضافة قسيمة",
        edit: "تعديل القسيمة",
        create: "إنشاء القسيمة",
        save: "حفظ التعديلات",
        cancel: "إلغاء",
        delete: "حذف",
        confirmDelete:
            "هل أنت متأكد أنك تريد حذف هذه القسيمة؟",
        code: "كود القسيمة",
        type: "النوع",
        value: "القيمة",
        euro: "€",
        minimumSubtotal: "الحد الأدنى للطلب",
        maxDiscount: "الحد الأقصى للخصم",
        validFrom: "صالحة من",
        validUntil: "صالحة حتى",
        usageLimitPerUser: "حد الاستخدام لكل مستخدم",
        totalUsageLimit: "حد الاستخدام الإجمالي",
        unlimited: "غير محدود",
        perUser: "لكل مستخدم",
        active: "نشطة",
        inactive: "غير نشطة",
        fixed: "خصم ثابت",
        percentage: "خصم بالنسبة المئوية",
        freeDelivery: "توصيل مجاني",
        uses: "الاستخدامات",
        status: "الحالة",
        actions: "الإجراءات",
        noVouchers:
            "لم يتم إنشاء أي قسائم حتى الآن.",
        loading: "جارٍ تحميل القسائم...",
        creating: "جارٍ الإنشاء...",
        saving: "جارٍ الحفظ...",
        deleting: "جارٍ الحذف...",
        errorLoading:
            "تعذر تحميل القسائم.",
        errorSaving:
            "تعذر تحميل القسيمة.",
        errorDeleting:
            "تعذر حذف القسيمة.",
        successCreated:
            "تم إنشاء القسيمة بنجاح.",
        successUpdated:
            "تم تحديث القسيمة بنجاح.",
        successDeleted:
            "تم حذف القسيمة بنجاح.",
        validationCode:
            "كود القسيمة مطلوب.",
        validationType:
            "نوع القسيمة مطلوب.",
        validationValue:
            "يجب إدخال قيمة أكبر من صفر.",
        validationPercentage:
            "يجب أن تكون النسبة بين 0 و100.",
        validationUsagePerUser:
            "يجب أن يكون حد الاستخدام لكل مستخدم رقمًا صحيحًا موجبًا.",
        validationTotalUsage:
            "يجب أن يكون حد الاستخدام الإجمالي رقمًا صحيحًا موجبًا.",
        clearDates:
            "اتركها فارغة بدون تحديد تاريخ.",
    },
};

type FormState = {
    code: string;
    type: VoucherType;
    value: string;
    minimumSubtotal: string;
    maxDiscount: string;
    validFrom: string;
    validUntil: string;
    usageLimitPerUser: string;
    totalUsageLimit: string;
    active: boolean;
};

const emptyForm: FormState = {
    code: "",
    type: "percentage",
    value: "",
    minimumSubtotal: "",
    maxDiscount: "",
    validFrom: "",
    validUntil: "",
    usageLimitPerUser: "1",
    totalUsageLimit: "",
    active: true,
};

function formatDate(value: string | null) {
    if (!value) {
        return "—";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleDateString();
}

function voucherTypeLabel(
    type: VoucherType,
    t: (typeof translations)["en"]
) {
    switch (type) {
        case "fixed":
            return t.fixed;
        case "percentage":
            return t.percentage;
        case "free_delivery":
            return t.freeDelivery;
    }
}

function toDateTimeLocal(value: string | null) {
    if (!value) {
        return "";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "";
    }

    const pad = (number: number) =>
        String(number).padStart(2, "0");

    return `${date.getFullYear()}-${pad(
        date.getMonth() + 1
    )}-${pad(date.getDate())}T${pad(
        date.getHours()
    )}:${pad(date.getMinutes())}`;
}

function toIsoOrNull(value: string) {
    if (!value) {
        return null;
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return null;
    }

    return date.toISOString();
}

export default function AdminVouchersPage() {
    const router = useRouter();
    const { language } = useLanguage();
    const t = translations[language];
    const isArabic = language === "ar";

    const [vouchers, setVouchers] = useState<Voucher[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] =
        useState<string | null>(null);
    const [editingId, setEditingId] =
        useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] =
        useState<FormState>({ ...emptyForm });
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const loadVouchers = useCallback(async () => {
        try {
            const response = await fetch(
                "/api/admin/vouchers",
                {
                    method: "GET",
                    cache: "no-store",
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error || t.errorLoading
                );
            }

            return Array.isArray(data.vouchers)
                ? (data.vouchers as Voucher[])
                : [];
        } catch (loadError) {
            throw new Error(
                loadError instanceof Error
                    ? loadError.message
                    : t.errorLoading
            );
        }
    }, [t.errorLoading]);

    const refreshVouchers = useCallback(async () => {
        try {
            const loadedVouchers =
                await loadVouchers();

            setVouchers(loadedVouchers);
            setError("");
        } catch (loadError) {
            setError(
                loadError instanceof Error
                    ? loadError.message
                    : t.errorLoading
            );
        }
    }, [loadVouchers, t.errorLoading]);

    useEffect(() => {
        let cancelled = false;

        async function fetchInitialVouchers() {
            try {
                const response = await fetch(
                    "/api/admin/vouchers",
                    {
                        method: "GET",
                        cache: "no-store",
                    }
                );

                const data =
                    await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.error ||
                            t.errorLoading
                    );
                }

                if (!cancelled) {
                    setVouchers(
                        Array.isArray(
                            data.vouchers
                        )
                            ? data.vouchers
                            : []
                    );
                }
            } catch (loadError) {
                if (!cancelled) {
                    setError(
                        loadError instanceof Error
                            ? loadError.message
                            : t.errorLoading
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        void fetchInitialVouchers();

        return () => {
            cancelled = true;
        };
    }, [t.errorLoading]);

    function openCreateForm() {
        setEditingId(null);
        setForm({ ...emptyForm });
        setMessage("");
        setError("");
        setShowForm(true);
    }

    function openEditForm(voucher: Voucher) {
        setEditingId(voucher.id);

        setForm({
            code: voucher.code,
            type: voucher.type,
            value:
                voucher.value === null
                    ? ""
                    : String(voucher.value),
            minimumSubtotal:
                voucher.minimumSubtotal === null
                    ? ""
                    : String(
                          voucher.minimumSubtotal
                      ),
            maxDiscount:
                voucher.maxDiscount === null
                    ? ""
                    : String(
                          voucher.maxDiscount
                      ),
            validFrom: toDateTimeLocal(
                voucher.validFrom
            ),
            validUntil: toDateTimeLocal(
                voucher.validUntil
            ),
            usageLimitPerUser:
                voucher.usageLimitPerUser > 0
                    ? String(
                          voucher.usageLimitPerUser
                      )
                    : "1",
            totalUsageLimit:
                voucher.totalUsageLimit === null
                    ? ""
                    : String(
                          voucher.totalUsageLimit
                      ),
            active: voucher.active,
        });

        setMessage("");
        setError("");
        setShowForm(true);
    }

    function closeForm() {
        if (saving) {
            return;
        }

        setShowForm(false);
        setEditingId(null);
        setForm({ ...emptyForm });
        setError("");
    }

    function validateForm() {
        if (!form.code.trim()) {
            return t.validationCode;
        }

        if (!form.type) {
            return t.validationType;
        }

        if (
            form.type !== "free_delivery" &&
            (!form.value ||
                Number(form.value) <= 0)
        ) {
            return t.validationValue;
        }

        if (
            form.type === "percentage" &&
            Number(form.value) > 100
        ) {
            return t.validationPercentage;
        }

        if (
            !form.usageLimitPerUser ||
            !Number.isInteger(
                Number(form.usageLimitPerUser)
            ) ||
            Number(form.usageLimitPerUser) <= 0
        ) {
            return t.validationUsagePerUser;
        }

        if (
            form.totalUsageLimit &&
            (!Number.isInteger(
                Number(form.totalUsageLimit)
            ) ||
                Number(form.totalUsageLimit) <= 0)
        ) {
            return t.validationTotalUsage;
        }

        return "";
    }

    async function handleSubmit(
        event: FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        setMessage("");
        setError("");

        const validationError =
            validateForm();

        if (validationError) {
            setError(validationError);
            return;
        }

        try {
            setSaving(true);

            const payload = {
                code: form.code.trim(),
                type: form.type,
                value:
                    form.type === "free_delivery"
                        ? null
                        : Number(form.value),
                minimumSubtotal:
                    form.minimumSubtotal
                        ? Number(
                              form.minimumSubtotal
                          )
                        : null,
                maxDiscount:
                    form.maxDiscount
                        ? Number(
                              form.maxDiscount
                          )
                        : null,
                validFrom: toIsoOrNull(
                    form.validFrom
                ),
                validUntil: toIsoOrNull(
                    form.validUntil
                ),
                usageLimitPerUser:
                    Number(
                        form.usageLimitPerUser
                    ),
                totalUsageLimit:
                    form.totalUsageLimit
                        ? Number(
                              form.totalUsageLimit
                          )
                        : null,
                active: form.active,
            };

            const response = await fetch(
                editingId
                    ? `/api/admin/vouchers/${editingId}`
                    : "/api/admin/vouchers",
                {
                    method: editingId
                        ? "PATCH"
                        : "POST",
                    headers: {
                        "Content-Type":
                            "application/json",
                    },
                    body: JSON.stringify(payload),
                }
            );

            const data =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error || t.errorSaving
                );
            }

            const wasEditing =
                Boolean(editingId);

            await refreshVouchers();

            setShowForm(false);
            setEditingId(null);
            setForm({ ...emptyForm });

            setMessage(
                wasEditing
                    ? t.successUpdated
                    : t.successCreated
            );
        } catch (saveError) {
            setError(
                saveError instanceof Error
                    ? saveError.message
                    : t.errorSaving
            );
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(
        voucher: Voucher
    ) {
        if (!window.confirm(t.confirmDelete)) {
            return;
        }

        try {
            setDeletingId(voucher.id);
            setError("");
            setMessage("");

            const response = await fetch(
                `/api/admin/vouchers/${voucher.id}`,
                {
                    method: "DELETE",
                }
            );

            const data =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error ||
                        t.errorDeleting
                );
            }

            setVouchers((current) =>
                current.filter(
                    (item) =>
                        item.id !== voucher.id
                )
            );

            setMessage(t.successDeleted);
        } catch (deleteError) {
            setError(
                deleteError instanceof Error
                    ? deleteError.message
                    : t.errorDeleting
            );
        } finally {
            setDeletingId(null);
        }
    }

    async function toggleActive(
        voucher: Voucher
    ) {
        try {
            setError("");
            setMessage("");

            const response = await fetch(
                `/api/admin/vouchers/${voucher.id}`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type":
                            "application/json",
                    },
                    body: JSON.stringify({
                        active:
                            !voucher.active,
                    }),
                }
            );

            const data =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error ||
                        t.errorSaving
                );
            }

            setVouchers((current) =>
                current.map((item) =>
                    item.id === voucher.id
                        ? data.voucher
                        : item
                )
            );

            setMessage(t.successUpdated);
        } catch (toggleError) {
            setError(
                toggleError instanceof Error
                    ? toggleError.message
                    : t.errorSaving
            );
        }
    }

    return (
        <main
            dir={isArabic ? "rtl" : "ltr"}
            className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14"
        >
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--brand-strong)]">
                        JAN-GET Admin
                    </p>

                    <h1 className="mt-2 text-3xl font-black text-[var(--text-primary)] sm:text-4xl">
                        {t.title}
                    </h1>

                    <p className="mt-3 max-w-2xl text-[var(--text-secondary)]">
                        {t.subtitle}
                    </p>
                </div>

                <div className="flex flex-wrap gap-3">
                    <button
                        type="button"
                        onClick={() =>
                            router.push("/admin")
                        }
                        className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-5 py-2.5 text-sm font-semibold text-[var(--text-primary)] transition hover:bg-[var(--surface-soft)]"
                    >
                        {t.back}
                    </button>

                    <button
                        type="button"
                        onClick={openCreateForm}
                        className="rounded-full bg-[var(--brand)] px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
                    >
                        + {t.add}
                    </button>
                </div>
            </div>

            {message && (
                <div className="mb-6 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-800">
                    {message}
                </div>
            )}

            {error && (
                <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
                    {error}
                </div>
            )}

            {showForm && (
                <form
                    onSubmit={handleSubmit}
                    className="mb-8 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm"
                >
                    <div className="mb-6 flex items-center justify-between gap-4">
                        <h2 className="text-xl font-black text-[var(--text-primary)]">
                            {editingId
                                ? t.edit
                                : t.create}
                        </h2>

                        <button
                            type="button"
                            onClick={closeForm}
                            className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--surface-soft)]"
                        >
                            {t.cancel}
                        </button>
                    </div>

                    <div className="grid gap-5 md:grid-cols-2">
                        <label className="block">
                            <span className="mb-2 block text-sm font-semibold text-[var(--text-primary)]">
                                {t.code}
                            </span>

                            <input
                                type="text"
                                value={form.code}
                                onChange={(event) =>
                                    setForm(
                                        (current) => ({
                                            ...current,
                                            code: event.target.value.toUpperCase(),
                                        })
                                    )
                                }
                                placeholder="SAVE10"
                                maxLength={50}
                                className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[var(--text-primary)] outline-none focus:border-[var(--brand)]"
                            />
                        </label>

                        <label className="block">
                            <span className="mb-2 block text-sm font-semibold text-[var(--text-primary)]">
                                {t.type}
                            </span>

                            <select
                                value={form.type}
                                onChange={(event) =>
                                    setForm(
                                        (current) => ({
                                            ...current,
                                            type: event
                                                .target
                                                .value as VoucherType,
                                            value:
                                                event.target.value ===
                                                "free_delivery"
                                                    ? ""
                                                    : current.value,
                                        })
                                    )
                                }
                                className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[var(--text-primary)] outline-none focus:border-[var(--brand)]"
                            >
                                <option value="percentage">
                                    {t.percentage}
                                </option>

                                <option value="fixed">
                                    {t.fixed}
                                </option>

                                <option value="free_delivery">
                                    {t.freeDelivery}
                                </option>
                            </select>
                        </label>

                        {form.type !==
                            "free_delivery" && (
                            <label className="block">
                                <span className="mb-2 block text-sm font-semibold text-[var(--text-primary)]">
                                    {t.value}
                                </span>

                                <div className="relative">
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={form.value}
                                        onChange={(event) =>
                                            setForm(
                                                (current) => ({
                                                    ...current,
                                                    value: event.target.value,
                                                })
                                            )
                                        }
                                        className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 pe-10 text-[var(--text-primary)] outline-none focus:border-[var(--brand)]"
                                    />

                                    <span className="pointer-events-none absolute inset-y-0 end-4 flex items-center text-sm text-[var(--text-muted)]">
                                        {form.type ===
                                        "percentage"
                                            ? "%"
                                            : t.euro}
                                    </span>
                                </div>
                            </label>
                        )}

                        <label className="block">
                            <span className="mb-2 block text-sm font-semibold text-[var(--text-primary)]">
                                {t.minimumSubtotal}
                            </span>

                            <div className="relative">
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={
                                        form.minimumSubtotal
                                    }
                                    onChange={(event) =>
                                        setForm(
                                            (current) => ({
                                                ...current,
                                                minimumSubtotal:
                                                    event.target.value,
                                            })
                                        )
                                    }
                                    className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 pe-10 text-[var(--text-primary)] outline-none focus:border-[var(--brand)]"
                                />

                                <span className="pointer-events-none absolute inset-y-0 end-4 flex items-center text-sm text-[var(--text-muted)]">
                                    €
                                </span>
                            </div>
                        </label>

                        {form.type ===
                            "percentage" && (
                            <label className="block">
                                <span className="mb-2 block text-sm font-semibold text-[var(--text-primary)]">
                                    {t.maxDiscount}
                                </span>

                                <div className="relative">
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={
                                            form.maxDiscount
                                        }
                                        onChange={(event) =>
                                            setForm(
                                                (current) => ({
                                                    ...current,
                                                    maxDiscount:
                                                        event.target.value,
                                                })
                                            )
                                        }
                                        className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 pe-10 text-[var(--text-primary)] outline-none focus:border-[var(--brand)]"
                                    />

                                    <span className="pointer-events-none absolute inset-y-0 end-4 flex items-center text-sm text-[var(--text-muted)]">
                                        €
                                    </span>
                                </div>
                            </label>
                        )}

                        <label className="block">
                            <span className="mb-2 block text-sm font-semibold text-[var(--text-primary)]">
                                {t.usageLimitPerUser}
                            </span>

                            <input
                                type="number"
                                min="1"
                                step="1"
                                value={
                                    form.usageLimitPerUser
                                }
                                onChange={(event) =>
                                    setForm(
                                        (current) => ({
                                            ...current,
                                            usageLimitPerUser:
                                                event.target.value,
                                        })
                                    )
                                }
                                placeholder="1"
                                className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[var(--text-primary)] outline-none focus:border-[var(--brand)]"
                            />

                            <p className="mt-1.5 text-xs text-[var(--text-muted)]">
                                {t.perUser}
                            </p>
                        </label>

                        <label className="block">
                            <span className="mb-2 block text-sm font-semibold text-[var(--text-primary)]">
                                {t.totalUsageLimit}
                            </span>

                            <input
                                type="number"
                                min="1"
                                step="1"
                                value={
                                    form.totalUsageLimit
                                }
                                onChange={(event) =>
                                    setForm(
                                        (current) => ({
                                            ...current,
                                            totalUsageLimit:
                                                event.target.value,
                                        })
                                    )
                                }
                                placeholder={t.unlimited}
                                className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[var(--text-primary)] outline-none focus:border-[var(--brand)]"
                            />
                        </label>

                        <label className="block">
                            <span className="mb-2 block text-sm font-semibold text-[var(--text-primary)]">
                                {t.validFrom}
                            </span>

                            <input
                                type="datetime-local"
                                value={form.validFrom}
                                onChange={(event) =>
                                    setForm(
                                        (current) => ({
                                            ...current,
                                            validFrom:
                                                event.target.value,
                                        })
                                    )
                                }
                                className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[var(--text-primary)] outline-none focus:border-[var(--brand)]"
                            />
                        </label>

                        <label className="block">
                            <span className="mb-2 block text-sm font-semibold text-[var(--text-primary)]">
                                {t.validUntil}
                            </span>

                            <input
                                type="datetime-local"
                                value={form.validUntil}
                                onChange={(event) =>
                                    setForm(
                                        (current) => ({
                                            ...current,
                                            validUntil:
                                                event.target.value,
                                        })
                                    )
                                }
                                className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[var(--text-primary)] outline-none focus:border-[var(--brand)]"
                            />
                        </label>

                        <label className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-4">
                            <input
                                type="checkbox"
                                checked={form.active}
                                onChange={(event) =>
                                    setForm(
                                        (current) => ({
                                            ...current,
                                            active:
                                                event.target.checked,
                                        })
                                    )
                                }
                                className="h-5 w-5 accent-[var(--brand)]"
                            />

                            <span className="text-sm font-semibold text-[var(--text-primary)]">
                                {t.active}
                            </span>
                        </label>
                    </div>

                    <p className="mt-4 text-sm text-[var(--text-muted)]">
                        {t.clearDates}
                    </p>

                    <div className="mt-6 flex justify-end">
                        <button
                            type="submit"
                            disabled={saving}
                            className="rounded-full bg-[var(--brand)] px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {saving
                                ? editingId
                                    ? t.saving
                                    : t.creating
                                : editingId
                                  ? t.save
                                  : t.create}
                        </button>
                    </div>
                </form>
            )}

            {loading ? (
                <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center text-[var(--text-secondary)]">
                    {t.loading}
                </div>
            ) : vouchers.length === 0 ? (
                <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center text-[var(--text-secondary)]">
                    {t.noVouchers}
                </div>
            ) : (
                <div className="overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1250px] text-sm">
                            <thead>
                                <tr className="border-b border-[var(--border)] bg-[var(--surface-soft)]">
                                    <th className="px-5 py-4 text-start font-bold text-[var(--text-primary)]">
                                        {t.code}
                                    </th>

                                    <th className="px-5 py-4 text-start font-bold text-[var(--text-primary)]">
                                        {t.type}
                                    </th>

                                    <th className="px-5 py-4 text-start font-bold text-[var(--text-primary)]">
                                        {t.value}
                                    </th>

                                    <th className="px-5 py-4 text-start font-bold text-[var(--text-primary)]">
                                        {t.minimumSubtotal}
                                    </th>

                                    <th className="px-5 py-4 text-start font-bold text-[var(--text-primary)]">
                                        {t.uses}
                                    </th>

                                    <th className="px-5 py-4 text-start font-bold text-[var(--text-primary)]">
                                        {t.usageLimitPerUser}
                                    </th>

                                    <th className="px-5 py-4 text-start font-bold text-[var(--text-primary)]">
                                        {t.totalUsageLimit}
                                    </th>

                                    <th className="px-5 py-4 text-start font-bold text-[var(--text-primary)]">
                                        {t.status}
                                    </th>

                                    <th className="px-5 py-4 text-start font-bold text-[var(--text-primary)]">
                                        {t.validUntil}
                                    </th>

                                    <th className="px-5 py-4 text-end font-bold text-[var(--text-primary)]">
                                        {t.actions}
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {vouchers.map(
                                    (voucher) => (
                                        <tr
                                            key={
                                                voucher.id
                                            }
                                            className="border-b border-[var(--border)] last:border-b-0"
                                        >
                                            <td className="px-5 py-5">
                                                <span className="rounded-lg bg-[var(--brand-soft)] px-3 py-1.5 font-black tracking-wide text-[var(--text-primary)]">
                                                    {
                                                        voucher.code
                                                    }
                                                </span>
                                            </td>

                                            <td className="px-5 py-5 text-[var(--text-secondary)]">
                                                {voucherTypeLabel(
                                                    voucher.type,
                                                    t
                                                )}
                                            </td>

                                            <td className="px-5 py-5 font-semibold text-[var(--text-primary)]">
                                                {voucher.type ===
                                                "free_delivery"
                                                    ? "—"
                                                    : voucher.type ===
                                                        "percentage"
                                                      ? `${voucher.value ?? 0}%`
                                                      : `€${(
                                                            voucher.value ??
                                                            0
                                                        ).toFixed(
                                                            2
                                                        )}`}
                                            </td>

                                            <td className="px-5 py-5 text-[var(--text-secondary)]">
                                                {voucher.minimumSubtotal ===
                                                null
                                                    ? "—"
                                                    : `€${voucher.minimumSubtotal.toFixed(
                                                          2
                                                      )}`}
                                            </td>

                                            <td className="px-5 py-5 text-[var(--text-secondary)]">
                                                <div className="font-semibold text-[var(--text-primary)]">
                                                    {
                                                        voucher.usedCount
                                                    }
                                                    {" / "}
                                                    {voucher.totalUsageLimit ===
                                                    null
                                                        ? "∞"
                                                        : voucher.totalUsageLimit}
                                                </div>
                                            </td>

                                            <td className="px-5 py-5 text-[var(--text-secondary)]">
                                                {
                                                    voucher.usageLimitPerUser
                                                }
                                            </td>

                                            <td className="px-5 py-5 text-[var(--text-secondary)]">
                                                {voucher.totalUsageLimit ===
                                                null
                                                    ? "∞"
                                                    : voucher.totalUsageLimit}
                                            </td>

                                            <td className="px-5 py-5">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        void toggleActive(
                                                            voucher
                                                        )
                                                    }
                                                    className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                                                        voucher.active
                                                            ? "bg-green-100 text-green-800"
                                                            : "bg-gray-100 text-gray-700"
                                                    }`}
                                                >
                                                    {voucher.active
                                                        ? t.active
                                                        : t.inactive}
                                                </button>
                                            </td>

                                            <td className="px-5 py-5 text-[var(--text-secondary)]">
                                                {formatDate(
                                                    voucher.validUntil
                                                )}
                                            </td>

                                            <td className="px-5 py-5">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            openEditForm(
                                                                voucher
                                                            )
                                                        }
                                                        className="rounded-full border border-[var(--border)] px-4 py-2 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--surface-soft)]"
                                                    >
                                                        {t.edit}
                                                    </button>

                                                    <button
                                                        type="button"
                                                        disabled={
                                                            deletingId ===
                                                            voucher.id
                                                        }
                                                        onClick={() =>
                                                            void handleDelete(
                                                                voucher
                                                            )
                                                        }
                                                        className="rounded-full border border-red-200 px-4 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                                                    >
                                                        {deletingId ===
                                                        voucher.id
                                                            ? t.deleting
                                                            : t.delete}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </main>
    );
}