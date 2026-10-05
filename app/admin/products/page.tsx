"use client";

import Image from "next/image";
import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";
import { useRouter } from "next/navigation";

import { useLanguage } from "@/components/LanguageProvider";

type ProductImage = {
    id: string;
    url: string;
    sortOrder: number;
};

type ProductVariant = {
    id: string;
    color: {
        en: string;
        de: string;
        ar: string;
    };
    images: ProductImage[];
    sortOrder: number;
    active: boolean;
    inStock: boolean;
    stock: number | null;
};

type Product = {
    id: string;
    slug: string;
    name: {
        en: string;
        de: string;
        ar: string;
    };
    description: {
        en: string;
        de: string;
        ar: string;
    };
    price: number;
    category: string;
    emoji: string;
    masterImage: string | null;
    generalImages: ProductImage[];
    variants: ProductVariant[];
    featured: boolean;
    active: boolean;
    inStock: boolean;
    stock: number | null;
    createdAt: string;
    updatedAt: string;
};

const translations = {
    en: {
        store: "JAN-GET Admin",
        title: "Products",
        subtitle:
            "Create, edit and manage all products in your store.",
        newProduct: "New Product",
        search: "Search products...",
        allCategories: "All categories",
        allStatuses: "All statuses",
        active: "Active",
        inactive: "Inactive",
        allStockStatuses: "All stock statuses",
        inStock: "In Stock",
        outOfStock: "Out of Stock",
        hasUnavailableVariants:
            "Has unavailable variants",
        allFeatured: "All featured",
        featured: "Featured",
        notFeatured: "Not featured",
        loading: "Loading products...",
        noProducts: "No products found.",
        retry: "Retry",
        edit: "Edit",
        preview: "Preview",
        deactivate: "Deactivate",
        activate: "Activate",
        markOutOfStock: "Mark out of stock",
        markInStock: "Mark in stock",
        stock: "Stock",
        delete: "Delete",
        deleting: "Deleting...",
        confirmDelete:
            "Are you sure you want to permanently delete this product?",
        variants: "colors",
        images: "images",
        price: "Price",
        category: "Category",
        status: "Status",
        error: "Failed to load products.",
        updateError: "Failed to update product.",
        back: "Back to Admin",
    },

    de: {
        store: "JAN-GET Admin",
        title: "Produkte",
        subtitle:
            "Erstelle, bearbeite und verwalte alle Produkte deines Shops.",
        newProduct: "Neues Produkt",
        search: "Produkte suchen...",
        allCategories: "Alle Kategorien",
        allStatuses: "Alle Status",
        active: "Aktiv",
        inactive: "Inaktiv",
        allStockStatuses: "Alle Lagerstatus",
        inStock: "Auf Lager",
        outOfStock: "Nicht verfügbar",
        hasUnavailableVariants:
            "Hat nicht verfügbare Varianten",
        allFeatured: "Alle Featured",
        featured: "Featured",
        notFeatured: "Nicht Featured",
        loading: "Produkte werden geladen...",
        noProducts: "Keine Produkte gefunden.",
        retry: "Erneut versuchen",
        edit: "Bearbeiten",
        preview: "Vorschau",
        deactivate: "Deaktivieren",
        activate: "Aktivieren",
        markOutOfStock: "Als nicht verfügbar markieren",
        markInStock: "Als verfügbar markieren",
        stock: "Bestand",
        delete: "Löschen",
        deleting: "Wird gelöscht...",
        confirmDelete:
            "Möchtest du dieses Produkt wirklich dauerhaft löschen?",
        variants: "Farben",
        images: "Bilder",
        price: "Preis",
        category: "Kategorie",
        status: "Status",
        error: "Produkte konnten nicht geladen werden.",
        updateError:
            "Produkt konnte nicht aktualisiert werden.",
        back: "Zur Admin-Seite",
    },

    ar: {
        store: "إدارة JAN-GET",
        title: "المنتجات",
        subtitle:
            "إنشاء وتعديل وإدارة جميع المنتجات في المتجر.",
        newProduct: "منتج جديد",
        search: "البحث عن المنتجات...",
        allCategories: "كل التصنيفات",
        allStatuses: "كل الحالات",
        active: "نشط",
        inactive: "غير نشط",
        allStockStatuses: "كل حالات المخزون",
        inStock: "متوفر",
        outOfStock: "غير متوفر",
        hasUnavailableVariants:
            "يحتوي على ألوان غير متوفرة",
        allFeatured: "كل المنتجات المميزة",
        featured: "مميز",
        notFeatured: "غير مميز",
        loading: "جاري تحميل المنتجات...",
        noProducts: "لا توجد منتجات.",
        retry: "إعادة المحاولة",
        edit: "تعديل",
        preview: "معاينة",
        deactivate: "تعطيل",
        activate: "تفعيل",
        markOutOfStock: "تحديد كغير متوفر",
        markInStock: "تحديد كمتوفر",
        stock: "المخزون",
        delete: "حذف",
        deleting: "جاري الحذف...",
        confirmDelete:
            "هل أنت متأكد أنك تريد حذف هذا المنتج نهائيًا؟",
        variants: "ألوان",
        images: "صور",
        price: "السعر",
        category: "التصنيف",
        status: "الحالة",
        error: "فشل تحميل المنتجات.",
        updateError: "فشل تحديث المنتج.",
        back: "العودة إلى لوحة الإدارة",
    },
};

export default function AdminProductsPage() {
    const router = useRouter();
    const { language } = useLanguage();

    const t = translations[language];
    const isArabic = language === "ar";

    const [products, setProducts] =
        useState<Product[]>([]);
    const [categories, setCategories] =
        useState<string[]>([]);

    const [search, setSearch] = useState("");
    const [category, setCategory] =
        useState("");
    const [active, setActive] =
        useState("");
    const [stockStatus, setStockStatus] =
        useState("");
    const [featured, setFeatured] =
        useState("");

    const [loading, setLoading] =
        useState(true);
    const [error, setError] =
        useState("");
    const [deletingId, setDeletingId] =
        useState<string | null>(null);
    const [updatingId, setUpdatingId] =
        useState<string | null>(null);

    const queryString = useMemo(() => {
        const params =
            new URLSearchParams();

        if (search.trim()) {
            params.set(
                "search",
                search.trim()
            );
        }

        if (category) {
            params.set(
                "category",
                category
            );
        }

        if (active) {
            params.set(
                "active",
                active
            );
        }

        if (featured) {
            params.set(
                "featured",
                featured
            );
        }

        return params.toString();
    }, [
        search,
        category,
        active,
        featured,
    ]);

    const loadProducts =
        useCallback(async () => {
            setLoading(true);
            setError("");

            try {
                const response =
                    await fetch(
                        `/api/admin/products${
                            queryString
                                ? `?${queryString}`
                                : ""
                        }`,
                        {
                            cache: "no-store",
                        }
                    );

                const data =
                    await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.error ||
                            t.error
                    );
                }

                setProducts(
                    data.products ?? []
                );

                setCategories(
                    data.categories ?? []
                );
            } catch (loadError) {
                console.error(loadError);

                setError(
                    loadError instanceof Error
                        ? loadError.message
                        : t.error
                );
            } finally {
                setLoading(false);
            }
        }, [
            queryString,
            t.error,
        ]);

    useEffect(() => {
        const timeout =
            window.setTimeout(() => {
                void loadProducts();
            }, 250);

        return () => {
            window.clearTimeout(
                timeout
            );
        };
    }, [loadProducts]);

    async function toggleActive(
        product: Product
    ) {
        setUpdatingId(product.id);
        setError("");

        try {
            const response =
                await fetch(
                    `/api/admin/products/${encodeURIComponent(
                        product.slug
                    )}`,
                    {
                        method: "PUT",
                        headers: {
                            "Content-Type":
                                "application/json",
                        },
                        body: JSON.stringify({
                            active:
                                !product.active,
                        }),
                    }
                );

            const data =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error ||
                        t.updateError
                );
            }

            setProducts((current) =>
                current.map((item) =>
                    item.id === product.id
                        ? data.product
                        : item
                )
            );
        } catch (updateError) {
            console.error(updateError);

            setError(
                updateError instanceof Error
                    ? updateError.message
                    : t.updateError
            );
        } finally {
            setUpdatingId(null);
        }
    }

    async function toggleStock(
        product: Product
    ) {
        setUpdatingId(product.id);
        setError("");

        try {
            const response =
                await fetch(
                    `/api/admin/products/${encodeURIComponent(
                        product.slug
                    )}`,
                    {
                        method: "PUT",
                        headers: {
                            "Content-Type":
                                "application/json",
                        },
                        body: JSON.stringify({
                            inStock:
                                !product.inStock,
                        }),
                    }
                );

            const data =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error ||
                        t.updateError
                );
            }

            setProducts((current) =>
                current.map((item) =>
                    item.id === product.id
                        ? data.product
                        : item
                )
            );
        } catch (updateError) {
            console.error(updateError);

            setError(
                updateError instanceof Error
                    ? updateError.message
                    : t.updateError
            );
        } finally {
            setUpdatingId(null);
        }
    }

    async function deleteProduct(
        product: Product
    ) {
        if (
            !window.confirm(
                `${t.confirmDelete}\n\n${product.name[language]}`
            )
        ) {
            return;
        }

        setDeletingId(product.id);
        setError("");

        try {
            const response =
                await fetch(
                    `/api/admin/products/${encodeURIComponent(
                        product.slug
                    )}`,
                    {
                        method: "DELETE",
                    }
                );

            const data =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error ||
                        "Failed to delete product."
                );
            }

            setProducts((current) =>
                current.filter(
                    (item) =>
                        item.id !==
                        product.id
                )
            );
        } catch (deleteError) {
            console.error(deleteError);

            setError(
                deleteError instanceof Error
                    ? deleteError.message
                    : "Failed to delete product."
            );
        } finally {
            setDeletingId(null);
        }
    }

    function getProductImage(
        product: Product
    ) {
        if (product.masterImage) {
            return product.masterImage;
        }

        if (
            product.generalImages.length >
            0
        ) {
            return product
                .generalImages[0].url;
        }

        for (const variant of product.variants) {
            if (
                variant.images.length >
                0
            ) {
                return variant.images[0]
                    .url;
            }
        }

        return null;
    }

    const totalImages = (
        product: Product
    ) => {
        return (
            product.generalImages
                .length +
            product.variants.reduce(
                (
                    total,
                    variant
                ) =>
                    total +
                    variant.images
                        .length,
                0
            )
        );
    };

    const getEffectiveAvailability = (
        product: Product
    ) => {
        const productBaseAvailable =
            product.active &&
            product.inStock &&
            (
                product.stock ===
                    null ||
                product.stock > 0
            );

        if (
            !productBaseAvailable
        ) {
            return false;
        }

        if (
            product.variants.length ===
            0
        ) {
            return true;
        }

        return product.variants.some(
            (variant) =>
                variant.active &&
                variant.inStock &&
                (
                    variant.stock ===
                        null ||
                    variant.stock >
                        0
                )
        );
    };

    const hasUnavailableVariants = (
        product: Product
    ) => {
        if (
            product.variants.length ===
            0
        ) {
            return false;
        }

        return product.variants.some(
            (variant) =>
                !variant.active ||
                !variant.inStock ||
                (
                    variant.stock !==
                        null &&
                    variant.stock <= 0
                )
        );
    };

    const getDisplayStock = (
        product: Product
    ) => {
        if (
            product.variants.length >
            0
        ) {
            const availableVariant =
                product.variants.find(
                    (variant) =>
                        variant.active &&
                        variant.inStock &&
                        (
                            variant.stock ===
                                null ||
                            variant.stock >
                                0
                        )
                );

            return (
                availableVariant?.stock ??
                null
            );
        }

        return product.stock;
    };

    const filteredProducts =
        useMemo(() => {
            if (!stockStatus) {
                return products;
            }

            return products.filter(
                (product) => {
                    const available =
                        getEffectiveAvailability(
                            product
                        );

                    if (
                        stockStatus ===
                        "inStock"
                    ) {
                        return available;
                    }

                    if (
                        stockStatus ===
                        "outOfStock"
                    ) {
                        return !available;
                    }

                    if (
                        stockStatus ===
                        "hasUnavailableVariants"
                    ) {
                        return hasUnavailableVariants(
                            product
                        );
                    }

                    return true;
                }
            );
        }, [
            products,
            stockStatus,
        ]);

    const openProduct = (
        product: Product
    ) => {
        router.push(
            `/admin/products/${encodeURIComponent(
                product.slug
            )}`
        );
    };

    const handleCardKeyDown = (
        event: React.KeyboardEvent,
        product: Product
    ) => {
        if (
            event.key ===
                "Enter" ||
            event.key === " "
        ) {
            event.preventDefault();
            openProduct(product);
        }
    };

    return (
        <main
            dir={
                isArabic
                    ? "rtl"
                    : "ltr"
            }
            className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14"
        >
            <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <button
                        type="button"
                        onClick={() =>
                            router.push(
                                "/admin"
                            )
                        }
                        className="mb-4 cursor-pointer text-sm font-semibold text-[var(--brand-strong)] hover:underline"
                    >
                        ← {t.back}
                    </button>

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

                <button
                    type="button"
                    onClick={() =>
                        router.push(
                            "/admin/products/new"
                        )
                    }
                    className="cursor-pointer rounded-2xl bg-[var(--brand)] px-6 py-3 font-bold text-white shadow-sm transition hover:opacity-90"
                >
                    + {t.newProduct}
                </button>
            </div>

            <div className="mb-8 grid gap-3 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm md:grid-cols-2 lg:grid-cols-5">
                <input
                    value={search}
                    onChange={(event) =>
                        setSearch(
                            event.target.value
                        )
                    }
                    placeholder={t.search}
                    className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--brand)]"
                />

                <select
                    value={category}
                    onChange={(event) =>
                        setCategory(
                            event.target.value
                        )
                    }
                    className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--brand)]"
                >
                    <option value="">
                        {
                            t.allCategories
                        }
                    </option>

                    {categories.map(
                        (item) => (
                            <option
                                key={item}
                                value={item}
                            >
                                {item}
                            </option>
                        )
                    )}
                </select>

                <select
                    value={active}
                    onChange={(event) =>
                        setActive(
                            event.target.value
                        )
                    }
                    className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--brand)]"
                >
                    <option value="">
                        {t.allStatuses}
                    </option>

                    <option value="true">
                        {t.active}
                    </option>

                    <option value="false">
                        {t.inactive}
                    </option>
                </select>

                <select
                    value={stockStatus}
                    onChange={(event) =>
                        setStockStatus(
                            event.target.value
                        )
                    }
                    className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--brand)]"
                >
                    <option value="">
                        {
                            t.allStockStatuses
                        }
                    </option>

                    <option value="inStock">
                        {t.inStock}
                    </option>

                    <option value="outOfStock">
                        {t.outOfStock}
                    </option>

                    <option value="hasUnavailableVariants">
                        {
                            t.hasUnavailableVariants
                        }
                    </option>
                </select>

                <select
                    value={featured}
                    onChange={(event) =>
                        setFeatured(
                            event.target.value
                        )
                    }
                    className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--brand)]"
                >
                    <option value="">
                        {t.allFeatured}
                    </option>

                    <option value="true">
                        {t.featured}
                    </option>

                    <option value="false">
                        {
                            t.notFeatured
                        }
                    </option>
                </select>
            </div>

            {error && (
                <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
                    {error}
                </div>
            )}

            {loading ? (
                <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-10 text-center text-[var(--text-secondary)]">
                    {t.loading}
                </div>
            ) : filteredProducts.length ===
              0 ? (
                <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-10 text-center text-[var(--text-secondary)]">
                    {t.noProducts}
                </div>
            ) : (
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                    {filteredProducts.map(
                        (product) => {
                            const image =
                                getProductImage(
                                    product
                                );

                            const available =
                                getEffectiveAvailability(
                                    product
                                );

                            const displayStock =
                                getDisplayStock(
                                    product
                                );

                            return (
                                <article
                                    key={
                                        product.id
                                    }
                                    role="button"
                                    tabIndex={0}
                                    onClick={() =>
                                        openProduct(
                                            product
                                        )
                                    }
                                    onKeyDown={(
                                        event
                                    ) =>
                                        handleCardKeyDown(
                                            event,
                                            product
                                        )
                                    }
                                    className="cursor-pointer overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-sm transition hover:-translate-y-1 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:ring-offset-2"
                                >
                                    <div className="relative aspect-[4/3] overflow-hidden bg-[var(--surface-soft)]">
                                        {image ? (
                                            <Image
                                                src={
                                                    image
                                                }
                                                alt={
                                                    product
                                                        .name[
                                                        language
                                                    ]
                                                }
                                                fill
                                                sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                                                className="object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-full items-center justify-center text-6xl">
                                                {
                                                    product.emoji
                                                }
                                            </div>
                                        )}

                                        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-4">
                                            <div className="flex flex-wrap gap-2">
                                                <span
                                                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                                                        product.active
                                                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                                                            : "bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                                                    }`}
                                                >
                                                    {product.active
                                                        ? t.active
                                                        : t.inactive}
                                                </span>

                                                <span
                                                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                                                        available
                                                            ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                                                            : "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
                                                    }`}
                                                >
                                                    {available
                                                        ? t.inStock
                                                        : t.outOfStock}
                                                </span>
                                            </div>

                                            {product.featured && (
                                                <span className="shrink-0 rounded-full bg-[var(--brand)] px-3 py-1 text-xs font-bold text-white">
                                                    ★{" "}
                                                    {
                                                        t.featured
                                                    }
                                                </span>
                                            )}
                                        </div>

                                        {!available && (
                                            <div className="absolute bottom-3 left-3 rounded-full bg-black/65 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-sm">
                                                {
                                                    t.outOfStock
                                                }
                                            </div>
                                        )}
                                    </div>

                                    <div className="p-5">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <h2 className="truncate text-lg font-black text-[var(--text-primary)]">
                                                    {
                                                        product
                                                            .name[
                                                            language
                                                        ]
                                                    }
                                                </h2>

                                                <p className="mt-1 truncate text-xs text-[var(--text-secondary)]">
                                                    /
                                                    {
                                                        product.slug
                                                    }
                                                </p>
                                            </div>

                                            <span className="shrink-0 text-lg font-black text-[var(--brand-strong)]">
                                                €
                                                {product.price.toFixed(
                                                    2
                                                )}
                                            </span>
                                        </div>

                                        <div className="mt-4 flex flex-wrap gap-2 text-xs">
                                            <span className="rounded-full bg-[var(--surface-soft)] px-3 py-1 text-[var(--text-secondary)]">
                                                {
                                                    product.category
                                                }
                                            </span>

                                            <span className="rounded-full bg-[var(--surface-soft)] px-3 py-1 text-[var(--text-secondary)]">
                                                {
                                                    product
                                                        .variants
                                                        .length
                                                }{" "}
                                                {
                                                    t.variants
                                                }
                                            </span>

                                            <span className="rounded-full bg-[var(--surface-soft)] px-3 py-1 text-[var(--text-secondary)]">
                                                {totalImages(
                                                    product
                                                )}{" "}
                                                {
                                                    t.images
                                                }
                                            </span>

                                            {displayStock !==
                                                null && (
                                                <span className="rounded-full bg-[var(--surface-soft)] px-3 py-1 font-semibold text-[var(--text-secondary)]">
                                                    {
                                                        t.stock
                                                    }
                                                    :{" "}
                                                    {
                                                        displayStock
                                                    }
                                                </span>
                                            )}
                                        </div>

                                        <div className="mt-5 grid grid-cols-2 gap-2">
                                            <button
                                                type="button"
                                                onClick={(
                                                    event
                                                ) => {
                                                    event.stopPropagation();

                                                    openProduct(
                                                        product
                                                    );
                                                }}
                                                className="cursor-pointer rounded-xl bg-[var(--brand)] px-3 py-2.5 text-sm font-bold text-white transition hover:opacity-90"
                                            >
                                                {
                                                    t.edit
                                                }
                                            </button>

                                            <button
                                                type="button"
                                                onClick={(
                                                    event
                                                ) => {
                                                    event.stopPropagation();

                                                    router.push(
                                                        `/products/${encodeURIComponent(
                                                            product.slug
                                                        )}`
                                                    );
                                                }}
                                                className="cursor-pointer rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2.5 text-sm font-bold text-[var(--text-primary)] transition hover:bg-[var(--brand-soft)]"
                                            >
                                                {
                                                    t.preview
                                                }
                                            </button>

                                            <button
                                                type="button"
                                                disabled={
                                                    updatingId ===
                                                    product.id
                                                }
                                                onClick={(
                                                    event
                                                ) => {
                                                    event.stopPropagation();

                                                    void toggleActive(
                                                        product
                                                    );
                                                }}
                                                className="cursor-pointer rounded-xl border border-[var(--border)] px-3 py-2.5 text-sm font-bold text-[var(--text-primary)] transition hover:bg-[var(--brand-soft)] disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                {updatingId ===
                                                product.id
                                                    ? "..."
                                                    : product.active
                                                    ? t.deactivate
                                                    : t.activate}
                                            </button>

                                            <button
                                                type="button"
                                                disabled={
                                                    updatingId ===
                                                    product.id
                                                }
                                                onClick={(
                                                    event
                                                ) => {
                                                    event.stopPropagation();

                                                    void toggleStock(
                                                        product
                                                    );
                                                }}
                                                className={`cursor-pointer rounded-xl border px-3 py-2.5 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                                                    product.inStock
                                                        ? "border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950/30"
                                                        : "border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-900 dark:text-emerald-300 dark:hover:bg-emerald-950/30"
                                                }`}
                                            >
                                                {updatingId ===
                                                product.id
                                                    ? "..."
                                                    : product.inStock
                                                    ? t.markOutOfStock
                                                    : t.markInStock}
                                            </button>

                                            <button
                                                type="button"
                                                disabled={
                                                    deletingId ===
                                                    product.id
                                                }
                                                onClick={(
                                                    event
                                                ) => {
                                                    event.stopPropagation();

                                                    void deleteProduct(
                                                        product
                                                    );
                                                }}
                                                className="cursor-pointer rounded-xl border border-red-200 px-3 py-2.5 text-sm font-bold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-900 dark:hover:bg-red-950/30"
                                            >
                                                {deletingId ===
                                                product.id
                                                    ? "..."
                                                    : t.delete}
                                            </button>
                                        </div>
                                    </div>
                                </article>
                            );
                        }
                    )}
                </div>
            )}
        </main>
    );
}