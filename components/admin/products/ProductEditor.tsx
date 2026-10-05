"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { useLanguage } from "@/components/LanguageProvider";

type Language = "en" | "de" | "ar";

type LocalizedText = {
  en: string;
  de: string;
  ar: string;
};

type ProductImage = {
  id?: string;
  url: string;
  sortOrder?: number;
};

type ProductPriceDiscount = {
  percentage: number;
  price: number;
  quantityLimit: number | null;
  quantitySold: number;
  startsAt: string | null;
  endsAt: string | null;
};

type ProductSizeKey = "small" | "medium" | "large";

type ProductSize = {
  key: ProductSizeKey;
  price: number | null;
  discount: ProductPriceDiscount | null;
};

type ProductCustomField = {
  id: string;
  label: string;
};

type ProductVariant = {
  id?: string;
  color: LocalizedText;
  price: number | null;
  discount: ProductPriceDiscount | null;
  sizes: ProductSize[];
  customFields: ProductCustomField[];
  images: ProductImage[];
  active: boolean;
  inStock: boolean;
  stock: number | null;
};

type ProductForm = {
  id: string;
  slug: string;
  name: LocalizedText;
  description: LocalizedText;
  price: number;
  discount: ProductPriceDiscount | null;
  category: string;
  emoji: string;
  masterImage: string | null;
  generalImages: ProductImage[];
  variants: ProductVariant[];
  featured: boolean;
  active: boolean;
  inStock: boolean;
  stock: number | null;
};

type ProductEditorProps = {
  mode: "create" | "edit";
  productId?: string;
};

type DiscountTranslations = {
  discount: string;
  enableDiscount: string;
  discountPercentage: string;
  discountedPrice: string;
  discountPercentageHelp: string;
  discountedPriceHelp: string;
  discountQuantityLimit: string;
  discountQuantityHelp: string;
  discountStartsAt: string;
  discountEndsAt: string;
  discountTimeHelp: string;
  discountQuantitySold: string;
  discountQuantityRemaining: string;
  discountNoLimit: string;
  discountNoSchedule: string;
  invalidDiscount: string;
  invalidDiscountPercentage: string;
  invalidDiscountPrice: string;
  invalidDiscountQuantity: string;
  invalidDiscountDates: string;
};

const categories = [
  "Kids & Play",
  "Home & Living",
  "Decor",
  "Gifts",
  "Desk & Office",
  "Accessories",
  "Collectibles",
  "Personalized",
];

const sizeKeys: ProductSizeKey[] = [
  "small",
  "medium",
  "large",
];

const translations = {
  en: {
    back: "← Back to products",
    createTitle: "Create product",
    editTitle: "Edit product",
    basic: "Basic information",
    id: "Product ID",
    slug: "Slug",
    name: "Name",
    description: "Description",
    price: "Price (€)",
    category: "Category",
    emoji: "Emoji",
    featured: "Featured product",
    active: "Product active",
    stock: "Product availability",
    stockQuantity: "Stock quantity",
    stockHelp:
      "Optional. Leave empty for unlimited / unspecified stock. 0 means Out of Stock.",
    inStock: "In Stock",
    outOfStock: "Out of Stock",
    onlyLeft: "left",
    master: "Master image",
    masterHelp:
      "This image is used as the main product image in the shop.",
    general: "General product images",
    colors: "Colors / Variants",
    color: "Color",
    addColor: "Add color",
    variantImages: "Images for this color",
    variantAvailability: "Variant availability",
    variantInStock: "In Stock",
    variantOutOfStock: "Out of Stock",
    variantStock: "Variant stock quantity",
    variantStockHelp:
      "Optional. Leave empty for unlimited / unspecified stock.",
    variantPrice: "Color price (€)",
    variantPriceHelp:
      "Optional. If set, this price replaces the basic product price for this color. Leave empty to use the basic price.",
    sizes: "Sizes",
    sizesHelp:
      "Optional. Enable only the sizes that this color supports. A size price is the complete final price and replaces the color/basic price.",
    sizeSmall: "Small",
    sizeMedium: "Medium",
    sizeLarge: "Large",
    finalPrice: "Final price (€)",
    finalPriceHelp:
      "Optional. This is the complete final price for this size. Leave empty to use the color price, or the basic price if no color price is set.",
    customFields: "Custom fields",
    customFieldsHelp:
      "Optional. Add any information the customer must enter for this color. Every field is mandatory for the customer.",
    customFieldLabel: "Field label",
    customFieldPlaceholder:
      "e.g. Name, Age, Height",
    addCustomField: "Add field",
    noCustomFields:
      "No custom fields. Customers will not be asked for additional information.",
    customFieldRequired:
      "Required for customer",
    addImage: "Add image",
    imageUrl: "Image URL / path",
    remove: "Remove",
    moveUp: "Move up",
    moveDown: "Move down",
    setMaster: "Use as master image",
    selectedMaster: "Master image",
    preview: "Preview",
    close: "Close",
    save: "Save product",
    saving: "Saving...",
    saved: "Saved ✓",
    create: "Create product",
    delete: "Delete product",
    cancel: "Cancel",
    loading: "Loading...",
    deleting: "Deleting...",
    errorRequired: "Please complete all required fields.",
    invalidId:
      "Product ID may contain only letters, numbers, _ and -.",
    invalidSlug:
      "Slug may contain only lowercase letters, numbers and hyphens.",
    invalidPrice:
      "Price must be a valid non-negative number.",
    invalidStock:
      "Stock must be a non-negative whole number or empty.",
    invalidColor:
      "Every active color must have English, German and Arabic names.",
    invalidVariantPrice:
      "Every color price must be empty or a valid non-negative number.",
    invalidSize:
      "Every size final price must be empty or a valid non-negative number.",
    invalidCustomField:
      "Every custom field must have a label.",
    success: "Product saved successfully.",
    deleteConfirm:
      "Are you sure you want to delete this product?",
    noImages: "No images added yet.",
    noVariants:
      "No colors / variants added yet.",
    inactive: "Inactive",
    activeLabel: "Active",
    noMaster: "No master image selected.",
    loadingProduct: "Loading product...",
    previewOutOfStock: "Out of Stock",
    basePrice: "Base price",
    customerOptions:
      "Customer options",

    discount: "Direct discount",
    enableDiscount: "Enable discount",
    discountPercentage: "Discount percentage (%)",
    discountedPrice: "Discounted price (€)",
    discountPercentageHelp:
      "Enter the percentage and the discounted price is calculated automatically.",
    discountedPriceHelp:
      "Enter the final discounted price and the percentage is calculated automatically.",
    discountQuantityLimit:
      "Discount quantity limit",
    discountQuantityHelp:
      "Optional. Leave empty for unlimited discounted units. This is separate from product stock.",
    discountStartsAt: "Discount starts",
    discountEndsAt: "Discount ends",
    discountTimeHelp:
      "Optional. Leave empty if the discount should not be limited by time.",
    discountQuantitySold: "Units sold at discount",
    discountQuantityRemaining:
      "Discount units remaining",
    discountNoLimit: "No quantity limit",
    discountNoSchedule: "No time limit",
    invalidDiscount:
      "The discount configuration is invalid.",
    invalidDiscountPercentage:
      "Discount percentage must be between 0 and 100.",
    invalidDiscountPrice:
      "Discounted price must be a valid price not greater than the original price.",
    invalidDiscountQuantity:
      "Discount quantity must be a non-negative whole number.",
    invalidDiscountDates:
      "Discount end time must be later than the start time.",
  },

  de: {
    back: "← Zurück zu Produkten",
    createTitle: "Produkt erstellen",
    editTitle: "Produkt bearbeiten",
    basic: "Grundinformationen",
    id: "Produkt-ID",
    slug: "Slug",
    name: "Name",
    description: "Beschreibung",
    price: "Preis (€)",
    category: "Kategorie",
    emoji: "Emoji",
    featured: "Hervorgehobenes Produkt",
    active: "Produkt aktiv",
    stock: "Produktverfügbarkeit",
    stockQuantity: "Bestandsmenge",
    stockHelp:
      "Optional. Leer lassen für unbegrenzten / nicht festgelegten Bestand. 0 bedeutet nicht verfügbar.",
    inStock: "Auf Lager",
    outOfStock: "Nicht auf Lager",
    onlyLeft: "übrig",
    master: "Hauptbild",
    masterHelp:
      "Dieses Bild wird als Hauptbild im Shop verwendet.",
    general: "Allgemeine Produktbilder",
    colors: "Farben / Varianten",
    color: "Farbe",
    addColor: "Farbe hinzufügen",
    variantImages: "Bilder für diese Farbe",
    variantAvailability: "Verfügbarkeit der Variante",
    variantInStock: "Auf Lager",
    variantOutOfStock: "Nicht auf Lager",
    variantStock: "Bestand dieser Variante",
    variantStockHelp:
      "Optional. Leer lassen für unbegrenzten / nicht festgelegten Bestand.",
    variantPrice: "Farbpreis (€)",
    variantPriceHelp:
      "Optional. Wenn gesetzt, ersetzt dieser Preis den Grundpreis für diese Farbe. Leer lassen, um den Grundpreis zu verwenden.",
    sizes: "Größen",
    sizesHelp:
      "Optional. Aktivieren Sie nur die Größen, die diese Farbe unterstützt. Der Größenpreis ist der vollständige Endpreis und ersetzt Farb- und Grundpreis.",
    sizeSmall: "Small",
    sizeMedium: "Medium",
    sizeLarge: "Large",
    finalPrice: "Endpreis (€)",
    finalPriceHelp:
      "Optional. Dies ist der vollständige Endpreis für diese Größe. Leer lassen, um den Farbpreis oder, falls keiner gesetzt ist, den Grundpreis zu verwenden.",
    customFields: "Benutzerdefinierte Felder",
    customFieldsHelp:
      "Optional. Fügen Sie Informationen hinzu, die der Kunde für diese Farbe eingeben muss. Jedes Feld ist für den Kunden Pflicht.",
    customFieldLabel: "Feldbezeichnung",
    customFieldPlaceholder:
      "z. B. Name, Alter, Größe",
    addCustomField: "Feld hinzufügen",
    noCustomFields:
      "Keine benutzerdefinierten Felder. Kunden werden keine zusätzlichen Angaben gefragt.",
    customFieldRequired:
      "Für den Kunden erforderlich",
    addImage: "Bild hinzufügen",
    imageUrl: "Bild-URL / Pfad",
    remove: "Entfernen",
    moveUp: "Nach oben",
    moveDown: "Nach unten",
    setMaster: "Als Hauptbild verwenden",
    selectedMaster: "Hauptbild",
    preview: "Vorschau",
    close: "Schließen",
    save: "Produkt speichern",
    saving: "Speichern...",
    saved: "Gespeichert ✓",
    create: "Produkt erstellen",
    delete: "Produkt löschen",
    cancel: "Abbrechen",
    loading: "Laden...",
    deleting: "Löschen...",
    errorRequired:
      "Bitte füllen Sie alle Pflichtfelder aus.",
    invalidId:
      "Die Produkt-ID darf nur Buchstaben, Zahlen, _ und - enthalten.",
    invalidSlug:
      "Der Slug darf nur Kleinbuchstaben, Zahlen und Bindestriche enthalten.",
    invalidPrice:
      "Der Preis muss eine gültige nicht-negative Zahl sein.",
    invalidStock:
      "Der Bestand muss eine nicht-negative ganze Zahl oder leer sein.",
    invalidColor:
      "Jede aktive Farbe benötigt einen englischen, deutschen und arabischen Namen.",
    invalidVariantPrice:
      "Jeder Farbpreis muss leer oder eine gültige nicht-negative Zahl sein.",
    invalidSize:
      "Jeder Größenendpreis muss leer oder eine gültige nicht-negative Zahl sein.",
    invalidCustomField:
      "Jedes benutzerdefinierte Feld benötigt eine Bezeichnung.",
    success: "Produkt erfolgreich gespeichert.",
    deleteConfirm:
      "Möchten Sie dieses Produkt wirklich löschen?",
    noImages: "Noch keine Bilder hinzugefügt.",
    noVariants:
      "Noch keine Farben / Varianten hinzugefügt.",
    inactive: "Inaktiv",
    activeLabel: "Aktiv",
    noMaster: "Kein Hauptbild ausgewählt.",
    loadingProduct: "Produkt wird geladen...",
    previewOutOfStock: "Nicht auf Lager",
    basePrice: "Grundpreis",
    customerOptions:
      "Kundenoptionen",

    discount: "Direkter Rabatt",
    enableDiscount: "Rabatt aktivieren",
    discountPercentage: "Rabatt in Prozent (%)",
    discountedPrice: "Reduzierter Preis (€)",
    discountPercentageHelp:
      "Prozentsatz eingeben. Der reduzierte Preis wird automatisch berechnet.",
    discountedPriceHelp:
      "Reduzierten Endpreis eingeben. Der Prozentsatz wird automatisch berechnet.",
    discountQuantityLimit:
      "Rabatt-Mengenlimit",
    discountQuantityHelp:
      "Optional. Leer lassen für unbegrenzt viele Einheiten zum Rabattpreis. Unabhängig vom Produktbestand.",
    discountStartsAt: "Rabatt beginnt",
    discountEndsAt: "Rabatt endet",
    discountTimeHelp:
      "Optional. Leer lassen, wenn der Rabatt zeitlich nicht begrenzt sein soll.",
    discountQuantitySold:
      "Zum Rabattpreis verkauft",
    discountQuantityRemaining:
      "Verbleibende Rabattmenge",
    discountNoLimit: "Kein Mengenlimit",
    discountNoSchedule: "Kein Zeitlimit",
    invalidDiscount:
      "Die Rabattkonfiguration ist ungültig.",
    invalidDiscountPercentage:
      "Der Rabattprozentsatz muss zwischen 0 und 100 liegen.",
    invalidDiscountPrice:
      "Der reduzierte Preis muss gültig sein und darf nicht höher als der Originalpreis sein.",
    invalidDiscountQuantity:
      "Die Rabattmenge muss eine nicht-negative ganze Zahl sein.",
    invalidDiscountDates:
      "Das Rabattende muss nach dem Rabattbeginn liegen.",
  },

  ar: {
    back: "→ العودة إلى المنتجات",
    createTitle: "إنشاء منتج",
    editTitle: "تعديل المنتج",
    basic: "المعلومات الأساسية",
    id: "معرّف المنتج",
    slug: "Slug",
    name: "الاسم",
    description: "الوصف",
    price: "السعر (€)",
    category: "التصنيف",
    emoji: "Emoji",
    featured: "منتج مميز",
    active: "المنتج نشط",
    stock: "حالة توفر المنتج",
    stockQuantity: "كمية المخزون",
    stockHelp:
      "اختياري. اتركه فارغًا إذا لم تحدد كمية مخزون. الرقم 0 يعني غير متوفر.",
    inStock: "متوفر",
    outOfStock: "غير متوفر",
    onlyLeft: "متبقي",
    master: "الصورة الرئيسية",
    masterHelp:
      "هذه الصورة ستظهر كالصورة الأساسية للمنتج في المتجر.",
    general: "صور المنتج العامة",
    colors: "الألوان / المتغيرات",
    color: "اللون",
    addColor: "إضافة لون",
    variantImages: "صور هذا اللون",
    variantAvailability: "حالة توفر هذا اللون",
    variantInStock: "متوفر",
    variantOutOfStock: "غير متوفر",
    variantStock: "كمية مخزون هذا اللون",
    variantStockHelp:
      "اختياري. اتركه فارغًا إذا لم تحدد كمية مخزون لهذا اللون.",
    variantPrice: "سعر اللون (€)",
    variantPriceHelp:
      "اختياري. إذا تم إدخاله فإنه يستبدل السعر الأساسي لهذا اللون. اتركه فارغًا لاستخدام السعر الأساسي.",
    sizes: "المقاسات",
    sizesHelp:
      "اختياري. فعّل فقط المقاسات التي يدعمها هذا اللون. سعر المقاس هو السعر النهائي الكامل ويستبدل سعر اللون والسعر الأساسي.",
    sizeSmall: "Small",
    sizeMedium: "Medium",
    sizeLarge: "Large",
    finalPrice: "السعر النهائي (€)",
    finalPriceHelp:
      "اختياري. هذا هو السعر النهائي الكامل لهذا المقاس. اتركه فارغًا لاستخدام سعر اللون، أو السعر الأساسي إذا لم يتم تحديد سعر للون.",
    customFields: "الحقول المخصصة",
    customFieldsHelp:
      "اختياري. أضف أي بيانات يجب على العميل إدخالها لهذا اللون. كل حقل تتم إضافته سيكون إجباريًا للعميل.",
    customFieldLabel: "اسم الحقل",
    customFieldPlaceholder:
      "مثال: الاسم، العمر، الطول",
    addCustomField: "إضافة حقل",
    noCustomFields:
      "لا توجد حقول مخصصة. لن يُطلب من العميل إدخال بيانات إضافية.",
    customFieldRequired:
      "إجباري للعميل",
    addImage: "إضافة صورة",
    imageUrl: "رابط / مسار الصورة",
    remove: "حذف",
    moveUp: "تحريك لأعلى",
    moveDown: "تحريك لأسفل",
    setMaster: "استخدام كصورة رئيسية",
    selectedMaster: "الصورة الرئيسية",
    preview: "معاينة",
    close: "إغلاق",
    save: "حفظ المنتج",
    saving: "جاري الحفظ...",
    saved: "تم الحفظ ✓",
    create: "إنشاء المنتج",
    delete: "حذف المنتج",
    cancel: "إلغاء",
    loading: "جاري التحميل...",
    deleting: "جاري الحذف...",
    errorRequired:
      "يرجى إكمال جميع الحقول المطلوبة.",
    invalidId:
      "معرّف المنتج يجب أن يحتوي فقط على الحروف والأرقام و _ و -.",
    invalidSlug:
      "الـSlug يجب أن يحتوي فقط على حروف صغيرة وأرقام وشرطات.",
    invalidPrice:
      "السعر يجب أن يكون رقمًا صالحًا غير سالب.",
    invalidStock:
      "المخزون يجب أن يكون رقمًا صحيحًا غير سالب أو فارغًا.",
    invalidColor:
      "كل لون نشط يجب أن يحتوي على اسم بالإنجليزية والألمانية والعربية.",
    invalidVariantPrice:
      "سعر اللون يجب أن يكون فارغًا أو رقمًا صالحًا غير سالب.",
    invalidSize:
      "السعر النهائي لكل مقاس يجب أن يكون فارغًا أو رقمًا صالحًا غير سالب.",
    invalidCustomField:
      "كل حقل مخصص يجب أن يحتوي على اسم.",
    success: "تم حفظ المنتج بنجاح.",
    deleteConfirm:
      "هل أنت متأكد من حذف هذا المنتج؟",
    noImages: "لم تتم إضافة صور بعد.",
    noVariants: "لم تتم إضافة ألوان / متغيرات بعد.",
    inactive: "غير نشط",
    activeLabel: "نشط",
    noMaster: "لم يتم اختيار صورة رئيسية.",
    loadingProduct: "جاري تحميل المنتج...",
    previewOutOfStock: "غير متوفر",
    basePrice: "السعر الأساسي",
    customerOptions: "خيارات العميل",

    discount: "خصم مباشر",
    enableDiscount: "تفعيل الخصم",
    discountPercentage: "نسبة الخصم (%)",
    discountedPrice: "السعر بعد الخصم (€)",
    discountPercentageHelp:
      "أدخل نسبة الخصم وسيتم حساب السعر بعد الخصم تلقائيًا.",
    discountedPriceHelp:
      "أدخل السعر النهائي بعد الخصم وسيتم حساب نسبة الخصم تلقائيًا.",
    discountQuantityLimit:
      "الحد الأقصى لكمية الخصم",
    discountQuantityHelp:
      "اختياري. اتركه فارغًا لعدد غير محدود من الوحدات بسعر الخصم. هذا مستقل عن مخزون المنتج.",
    discountStartsAt: "بداية الخصم",
    discountEndsAt: "نهاية الخصم",
    discountTimeHelp:
      "اختياري. اتركهما فارغين إذا لم ترد تحديد مدة زمنية للخصم.",
    discountQuantitySold:
      "الوحدات المباعة بسعر الخصم",
    discountQuantityRemaining:
      "الوحدات المتبقية بسعر الخصم",
    discountNoLimit: "بدون حد للكمية",
    discountNoSchedule: "بدون حد زمني",
    invalidDiscount:
      "إعدادات الخصم غير صحيحة.",
    invalidDiscountPercentage:
      "نسبة الخصم يجب أن تكون بين 0 و100.",
    invalidDiscountPrice:
      "السعر بعد الخصم يجب أن يكون سعرًا صالحًا وألا يكون أكبر من السعر الأصلي.",
    invalidDiscountQuantity:
      "كمية الخصم يجب أن تكون رقمًا صحيحًا غير سالب.",
    invalidDiscountDates:
      "يجب أن تكون نهاية الخصم بعد بدايته.",
  },
} as const;

function createCustomFieldId() {
  return `field-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 9)}`;
}

function emptyLocalized(): LocalizedText {
  return {
    en: "",
    de: "",
    ar: "",
  };
}

function emptyVariant(): ProductVariant {
  return {
    color: emptyLocalized(),
    price: null,
    discount: null,
    sizes: [],
    customFields: [],
    images: [],
    active: true,
    inStock: true,
    stock: null,
  };
}

function emptyProduct(): ProductForm {
  return {
    id: "",
    slug: "",
    name: emptyLocalized(),
    description: emptyLocalized(),
    price: 0,
    discount: null,
    category: categories[0],
    emoji: "🧸",
    masterImage: null,
    generalImages: [],
    variants: [],
    featured: false,
    active: true,
    inStock: true,
    stock: null,
  };
}

function roundPrice(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function roundPercentage(
  value: number
): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function normalizeLocalized(
  value: unknown
): LocalizedText {
  const source =
    value && typeof value === "object"
      ? (value as Record<string, unknown>)
      : {};

  return {
    en:
      typeof source.en === "string"
        ? source.en
        : "",
    de:
      typeof source.de === "string"
        ? source.de
        : "",
    ar:
      typeof source.ar === "string"
        ? source.ar
        : "",
  };
}

function normalizeImage(
  value: unknown
): ProductImage | null {
  if (typeof value === "string") {
    return {
      url: value,
    };
  }

  if (
    !value ||
    typeof value !== "object"
  ) {
    return null;
  }

  const source =
    value as Record<
      string,
      unknown
    >;

  const url =
    typeof source.url === "string"
      ? source.url
      : typeof source.imageUrl === "string"
        ? source.imageUrl
        : "";

  if (!url.trim()) {
    return null;
  }

  return {
    id:
      typeof source.id === "string"
        ? source.id
        : undefined,

    url: url.trim(),

    sortOrder:
      typeof source.sortOrder ===
      "number"
        ? source.sortOrder
        : typeof source.sort_order ===
            "number"
          ? source.sort_order
          : undefined,
  };
}

function normalizeImages(
  value: unknown
): ProductImage[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map(normalizeImage)
    .filter(
      (
        image
      ): image is ProductImage =>
        Boolean(image)
    );
}

function normalizeStock(
  value: unknown
): number | null {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  if (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 0
  ) {
    return value;
  }

  return null;
}

function normalizePrice(
  value: unknown,
  fallback = 0
): number {
  if (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= 0
  ) {
    return value;
  }

  return fallback;
}

function normalizeNullablePrice(
  value: unknown
): number | null {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  if (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= 0
  ) {
    return value;
  }

  return null;
}

function normalizeSizeKey(
  value: unknown
): ProductSizeKey | null {
  if (
    value === "small" ||
    value === "medium" ||
    value === "large"
  ) {
    return value;
  }

  return null;
}

function normalizeDiscount(
  value: unknown
): ProductPriceDiscount | null {
  if (
    !value ||
    typeof value !== "object"
  ) {
    return null;
  }

  const source =
    value as Record<
      string,
      unknown
    >;

  const percentage =
    typeof source.percentage ===
      "number" &&
    Number.isFinite(
      source.percentage
    )
      ? roundPercentage(
          source.percentage
        )
      : null;

  const price =
    typeof source.price ===
      "number" &&
    Number.isFinite(
      source.price
    )
      ? roundPrice(
          source.price
        )
      : null;

  if (
    percentage === null ||
    price === null
  ) {
    return null;
  }

  const quantityLimit =
    normalizeStock(
      source.quantityLimit
    );

  const quantitySold =
    normalizeStock(
      source.quantitySold
    ) ?? 0;

  return {
    percentage,
    price,
    quantityLimit,
    quantitySold,
    startsAt:
      typeof source.startsAt ===
        "string" &&
      source.startsAt.trim()
        ? source.startsAt
        : null,
    endsAt:
      typeof source.endsAt ===
        "string" &&
      source.endsAt.trim()
        ? source.endsAt
        : null,
  };
}

function normalizeSizes(
  value: unknown
): ProductSize[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const seen = new Set<ProductSizeKey>();
  const result: ProductSize[] = [];

  for (const item of value) {
    if (
      !item ||
      typeof item !== "object"
    ) {
      continue;
    }

    const source =
      item as Record<
        string,
        unknown
      >;

    const key =
      normalizeSizeKey(
        source.key
      );

    if (!key || seen.has(key)) {
      continue;
    }

    seen.add(key);

    const price =
      normalizeNullablePrice(
        source.price
      );

    result.push({
      key,
      price,
      discount:
        price !== null
          ? normalizeDiscount(
              source.discount
            )
          : null,
    });
  }

  return sizeKeys
    .map((key) =>
      result.find(
        (size) =>
          size.key === key
      )
    )
    .filter(
      (
        size
      ): size is ProductSize =>
        Boolean(size)
    );
}

function normalizeCustomFields(
  value: unknown
): ProductCustomField[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (
        !item ||
        typeof item !== "object"
      ) {
        return null;
      }

      const source =
        item as Record<
          string,
          unknown
        >;

      const label =
        typeof source.label ===
        "string"
          ? source.label.trim()
          : "";

      if (!label) {
        return null;
      }

      return {
        id:
          typeof source.id ===
          "string"
            ? source.id
            : createCustomFieldId(),
        label,
      };
    })
    .filter(
      (
        field
      ): field is ProductCustomField =>
        Boolean(field)
    );
}

function normalizeVariant(
  value: unknown
): ProductVariant | null {
  if (
    !value ||
    typeof value !== "object"
  ) {
    return null;
  }

  const source =
    value as Record<
      string,
      unknown
    >;

  const stock =
    normalizeStock(
      source.stock
    );

  const price =
    normalizeNullablePrice(
      source.price
    );

  return {
    id:
      typeof source.id === "string"
        ? source.id
        : undefined,

    color:
      normalizeLocalized(
        source.color
      ),

    price,

    discount:
      price !== null
        ? normalizeDiscount(
            source.discount
          )
        : null,

    sizes:
      normalizeSizes(
        source.sizes
      ),

    customFields:
      normalizeCustomFields(
        source.customFields
      ),

    images:
      normalizeImages(
        source.images
      ),

    active:
      source.active !== false,

    inStock:
      stock === 0
        ? false
        : source.inStock !== false,

    stock,
  };
}

function normalizeProduct(
  value: unknown
): ProductForm {
  if (
    !value ||
    typeof value !== "object"
  ) {
    return emptyProduct();
  }

  const source =
    value as Record<
      string,
      unknown
    >;

  const productPrice =
    normalizePrice(
      source.price,
      0
    );

  const variants =
    Array.isArray(
      source.variants
    )
      ? source.variants
          .map((variant) =>
            normalizeVariant(
              variant
            )
          )
          .filter(
            (
              variant
            ): variant is ProductVariant =>
              Boolean(variant)
          )
      : [];

  const stock =
    normalizeStock(
      source.stock
    );

  return {
    id:
      typeof source.id === "string"
        ? source.id
        : "",

    slug:
      typeof source.slug === "string"
        ? source.slug
        : "",

    name:
      normalizeLocalized(
        source.name
      ),

    description:
      normalizeLocalized(
        source.description
      ),

    price: productPrice,

    discount:
      normalizeDiscount(
        source.discount
      ),

    category:
      typeof source.category ===
      "string"
        ? source.category
        : categories[0],

    emoji:
      typeof source.emoji === "string"
        ? source.emoji
        : "🧸",

    masterImage:
      typeof source.masterImage ===
        "string" &&
      source.masterImage.trim()
        ? source.masterImage
        : null,

    generalImages:
      normalizeImages(
        source.generalImages
      ),

    variants,

    featured:
      source.featured === true,

    active:
      source.active !== false,

    inStock:
      stock === 0
        ? false
        : source.inStock !== false,

    stock,
  };
}

function moveItem<T>(
  items: T[],
  from: number,
  to: number
): T[] {
  if (
    from === to ||
    from < 0 ||
    to < 0 ||
    from >= items.length ||
    to >= items.length
  ) {
    return items;
  }

  const next = [...items];

  const [item] =
    next.splice(from, 1);

  next.splice(to, 0, item);

  return next;
}

function isValidImageUrl(
  value: string
) {
  const url = value.trim();

  if (!url) {
    return false;
  }

  return (
    url.startsWith("/") ||
    url.startsWith("http://") ||
    url.startsWith("https://")
  );
}

function getImageSrc(
  value: string
) {
  const trimmed =
    value.trim();

  return isValidImageUrl(
    trimmed
  )
    ? trimmed
    : null;
}

function hasCompleteColor(
  color: LocalizedText
) {
  return Boolean(
    color.en.trim() &&
      color.de.trim() &&
      color.ar.trim()
  );
}

function hasAnyColor(
  color: LocalizedText
) {
  return Boolean(
    color.en.trim() ||
      color.de.trim() ||
      color.ar.trim()
  );
}

function parseOptionalStock(
  value: string
): number | null {
  const trimmed =
    value.trim();

  if (!trimmed) {
    return null;
  }

  const number =
    Number(trimmed);

  if (
    !Number.isInteger(number) ||
    number < 0
  ) {
    return null;
  }

  return number;
}

function isValidStockInput(
  value: string
): boolean {
  const trimmed =
    value.trim();

  if (!trimmed) {
    return true;
  }

  const number =
    Number(trimmed);

  return (
    Number.isInteger(number) &&
    number >= 0
  );
}

function isVariantAvailable(
  variant: ProductVariant
): boolean {
  return (
    variant.active &&
    variant.inStock &&
    (variant.stock === null ||
      variant.stock > 0)
  );
}

function getSizeLabel(
  key: ProductSizeKey,
  t: {
    sizeSmall: string;
    sizeMedium: string;
    sizeLarge: string;
  }
) {
  if (key === "small") {
    return t.sizeSmall;
  }

  if (key === "medium") {
    return t.sizeMedium;
  }

  return t.sizeLarge;
}

function getEffectiveColorPrice(
  variant: ProductVariant,
  basicPrice: number
): number {
  return (
    variant.price !== null &&
    Number.isFinite(variant.price)
  )
    ? variant.price
    : basicPrice;
}

function isDiscountActive(
  discount: ProductPriceDiscount | null
): boolean {
  if (!discount) {
    return false;
  }

  const now = Date.now();

  if (
    discount.startsAt &&
    Number.isFinite(
      new Date(
        discount.startsAt
      ).getTime()
    ) &&
    now <
      new Date(
        discount.startsAt
      ).getTime()
  ) {
    return false;
  }

  if (
    discount.endsAt &&
    Number.isFinite(
      new Date(
        discount.endsAt
      ).getTime()
    ) &&
    now >=
      new Date(
        discount.endsAt
      ).getTime()
  ) {
    return false;
  }

  if (
    discount.quantityLimit !==
      null &&
    discount.quantitySold >=
      discount.quantityLimit
  ) {
    return false;
  }

  return true;
}

function getDiscountRemainingQuantity(
  discount: ProductPriceDiscount | null
): number | null {
  if (
    !discount ||
    discount.quantityLimit ===
      null
  ) {
    return null;
  }

  return Math.max(
    0,
    discount.quantityLimit -
      discount.quantitySold
  );
}

function toDateTimeLocal(
  value: string | null
): string {
  if (!value) {
    return "";
  }

  const date =
    new Date(value);

  if (
    !Number.isFinite(
      date.getTime()
    )
  ) {
    return "";
  }

  const pad = (
    number: number
  ) =>
    String(number).padStart(
      2,
      "0"
    );

  return `${date.getFullYear()}-${pad(
    date.getMonth() + 1
  )}-${pad(
    date.getDate()
  )}T${pad(
    date.getHours()
  )}:${pad(
    date.getMinutes()
  )}`;
}

function fromDateTimeLocal(
  value: string
): string | null {
  if (!value.trim()) {
    return null;
  }

  const date =
    new Date(value);

  if (
    !Number.isFinite(
      date.getTime()
    )
  ) {
    return null;
  }

  return date.toISOString();
}

function createDiscount(
  originalPrice: number
): ProductPriceDiscount {
  return {
    percentage: 0,
    price: roundPrice(
      Math.max(0, originalPrice)
    ),
    quantityLimit: null,
    quantitySold: 0,
    startsAt: null,
    endsAt: null,
  };
}

function recalculateDiscountPrice(
  discount: ProductPriceDiscount,
  originalPrice: number
): ProductPriceDiscount {
  const percentage = roundPercentage(
    Math.max(
      0,
      Math.min(
        100,
        Number(discount.percentage) || 0
      )
    )
  );

  return {
    ...discount,
    percentage,
    price: roundPrice(
      Math.max(0, originalPrice) *
        (1 - percentage / 100)
    ),
  };
}

function validateDiscount(
  discount: ProductPriceDiscount | null,
  originalPrice: number,
  t: DiscountTranslations
): string | null {
  if (!discount) {
    return null;
  }

  if (
    !Number.isFinite(
      discount.percentage
    ) ||
    discount.percentage < 0 ||
    discount.percentage > 100
  ) {
    return t.invalidDiscountPercentage;
  }

  if (
    !Number.isFinite(
      discount.price
    ) ||
    discount.price < 0 ||
    discount.price >
      originalPrice
  ) {
    return t.invalidDiscountPrice;
  }

  if (
    discount.quantityLimit !==
      null &&
    (
      !Number.isInteger(
        discount.quantityLimit
      ) ||
      discount.quantityLimit < 0
    )
  ) {
    return t.invalidDiscountQuantity;
  }

  if (
    !Number.isInteger(
      discount.quantitySold
    ) ||
    discount.quantitySold < 0
  ) {
    return t.invalidDiscountQuantity;
  }

  if (
    discount.quantityLimit !==
      null &&
    discount.quantitySold >
      discount.quantityLimit
  ) {
    return t.invalidDiscountQuantity;
  }

  if (
    discount.startsAt &&
    !Number.isFinite(
      new Date(
        discount.startsAt
      ).getTime()
    )
  ) {
    return t.invalidDiscountDates;
  }

  if (
    discount.endsAt &&
    !Number.isFinite(
      new Date(
        discount.endsAt
      ).getTime()
    )
  ) {
    return t.invalidDiscountDates;
  }

  if (
    discount.startsAt &&
    discount.endsAt &&
    new Date(
      discount.endsAt
    ).getTime() <=
      new Date(
        discount.startsAt
      ).getTime()
  ) {
    return t.invalidDiscountDates;
  }

  return null;
}

function DiscountEditor({
  discount,
  originalPrice,
  translations: t,
  onChange,
}: {
  discount: ProductPriceDiscount | null;
  originalPrice: number;
  translations: DiscountTranslations;
  onChange: (
    discount: ProductPriceDiscount | null
  ) => void;
}) {
  const updateDiscount = (
    patch: Partial<ProductPriceDiscount>
  ) => {
    if (!discount) {
      return;
    }

    onChange({
      ...discount,
      ...patch,
    });
  };

  const handlePercentageChange = (
    value: string
  ) => {
    if (!discount) {
      return;
    }

    const percentage =
      Number(value);

    if (
      !Number.isFinite(
        percentage
      )
    ) {
      updateDiscount({
        percentage: 0,
      });
      return;
    }

    const clamped =
      Math.min(
        100,
        Math.max(
          0,
          percentage
        )
      );

    const price =
      roundPrice(
        Math.max(
          0,
          originalPrice *
            (1 -
              clamped /
                100)
        )
      );

    updateDiscount({
      percentage:
        roundPercentage(
          clamped
        ),
      price,
    });
  };

  const handlePriceChange = (
    value: string
  ) => {
    if (!discount) {
      return;
    }

    const price =
      Number(value);

    if (
      !Number.isFinite(price)
    ) {
      return;
    }

    const clamped =
      Math.min(
        Math.max(
          0,
          originalPrice
        ),
        Math.max(
          0,
          price
        )
      );

    const percentage =
      originalPrice > 0
        ? roundPercentage(
            (1 -
              clamped /
                originalPrice) *
              100
          )
        : 0;

    updateDiscount({
      price:
        roundPrice(
          clamped
        ),
      percentage,
    });
  };

  return (
    <div className="mt-4 rounded-2xl border border-[var(--brand-soft)] bg-[var(--brand-soft)]/40 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h4 className="text-sm font-black">
            {t.discount}
          </h4>

          <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">
            {t.discountedPriceHelp}
          </p>
        </div>

        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={
              discount !== null
            }
            onChange={(event) => {
              if (
                event.target
                  .checked
              ) {
                onChange(
                  createDiscount(
                    originalPrice
                  )
                );
              } else {
                onChange(null);
              }
            }}
            className="h-5 w-5 cursor-pointer accent-[var(--brand)]"
          />

          <span className="text-sm font-bold">
            {t.enableDiscount}
          </span>
        </label>
      </div>

      {discount && (
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-[var(--text-secondary)]">
              {
                t.discountPercentage
              }
            </span>

            <input
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={
                Number.isFinite(
                  discount.percentage
                )
                  ? discount.percentage
                  : 0
              }
              onChange={(event) =>
                handlePercentageChange(
                  event.target
                    .value
                )
              }
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm font-semibold outline-none focus:border-[var(--brand)]"
            />

            <p className="mt-2 text-xs leading-5 text-[var(--text-secondary)]">
              {
                t.discountPercentageHelp
              }
            </p>
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-[var(--text-secondary)]">
              {
                t.discountedPrice
              }
            </span>

            <input
              type="number"
              min="0"
              max={originalPrice}
              step="0.01"
              value={
                Number.isFinite(
                  discount.price
                )
                  ? discount.price
                  : 0
              }
              onChange={(event) =>
                handlePriceChange(
                  event.target
                    .value
                )
              }
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm font-semibold outline-none focus:border-[var(--brand)]"
            />

            <p className="mt-2 text-xs leading-5 text-[var(--text-secondary)]">
              {
                t.discountedPriceHelp
              }
            </p>
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-[var(--text-secondary)]">
              {
                t.discountQuantityLimit
              }
            </span>

            <input
              type="number"
              min="0"
              step="1"
              inputMode="numeric"
              value={
                discount.quantityLimit ??
                ""
              }
              onChange={(event) => {
                const value =
                  event.target
                    .value
                    .trim();

                if (value === "") {
                  onChange({
                    ...discount,
                    quantityLimit: null,
                  });
                  return;
                }

                const parsed = Number(value);

                if (!Number.isFinite(parsed)) {
                  return;
                }

                onChange({
                  ...discount,
                  quantityLimit: Math.max(
                    0,
                    Math.floor(parsed)
                  ),
                });
              }}
              placeholder="—"
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm outline-none focus:border-[var(--brand)]"
            />

            <p className="mt-2 text-xs leading-5 text-[var(--text-secondary)]">
              {
                t.discountQuantityHelp
              }
            </p>
          </label>

          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
            <div className="flex flex-wrap gap-2 text-xs font-bold">
              <span className="rounded-full bg-[var(--surface-soft)] px-3 py-1.5">
                {
                  t.discountQuantitySold
                }
                :{" "}
                {
                  discount.quantitySold
                }
              </span>

              {discount.quantityLimit !==
                null ? (
                <span className="rounded-full bg-[var(--brand-soft)] px-3 py-1.5 text-[var(--brand-strong)]">
                  {
                    t.discountQuantityRemaining
                  }
                  :{" "}
                  {getDiscountRemainingQuantity(
                    discount
                  )}
                </span>
              ) : (
                <span className="rounded-full bg-[var(--surface-soft)] px-3 py-1.5">
                  {
                    t.discountNoLimit
                  }
                </span>
              )}
            </div>
          </div>

          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-[var(--text-secondary)]">
              {
                t.discountStartsAt
              }
            </span>

            <input
              type="datetime-local"
              value={toDateTimeLocal(
                discount.startsAt
              )}
              onChange={(event) =>
                updateDiscount({
                  startsAt:
                    fromDateTimeLocal(
                      event
                        .target
                        .value
                    ),
                })
              }
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm outline-none focus:border-[var(--brand)]"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-[var(--text-secondary)]">
              {
                t.discountEndsAt
              }
            </span>

            <input
              type="datetime-local"
              value={toDateTimeLocal(
                discount.endsAt
              )}
              onChange={(event) =>
                updateDiscount({
                  endsAt:
                    fromDateTimeLocal(
                      event
                        .target
                        .value
                    ),
                })
              }
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm outline-none focus:border-[var(--brand)]"
            />

            <p className="mt-2 text-xs leading-5 text-[var(--text-secondary)]">
              {
                t.discountTimeHelp
              }
            </p>
          </label>

          <div className="md:col-span-2">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-xs text-[var(--text-secondary)]">
              <div className="flex flex-wrap gap-x-4 gap-y-2">
                <span>
                  {t.discountNoSchedule}
                  :{" "}
                  {discount.startsAt ||
                  discount.endsAt
                    ? "—"
                    : "✓"}
                </span>

                <span>
                  {t.discount}:
                  {" "}
                  {isDiscountActive(
                    discount
                  )
                    ? `${discount.percentage}% → €${discount.price.toFixed(
                        2
                      )}`
                    : "—"}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProductEditor({
  mode,
  productId,
}: ProductEditorProps) {
  const router = useRouter();

  const { language } =
    useLanguage();

  const t =
    translations[language];

  const [form, setForm] =
    useState<ProductForm>(
      emptyProduct()
    );

  const [loading, setLoading] =
    useState(
      mode === "edit"
    );

  const [saving, setSaving] =
    useState(false);

  const [deleting, setDeleting] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [saveState, setSaveState] =
    useState<
      "idle" | "saving" | "saved" | "error"
    >("idle");

  const [previewOpen, setPreviewOpen] =
    useState(false);

  useEffect(() => {
    if (
      mode !== "edit" ||
      !productId
    ) {
      return;
    }

    const currentProductId =
      productId;

    async function loadProduct() {
      try {
        setLoading(true);
        setError("");
        setSuccess("");
        setSaveState("idle");

        const response =
          await fetch(
            `/api/admin/products/${encodeURIComponent(
              currentProductId
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
              "Unable to load product."
          );
        }

        setForm(
          normalizeProduct(
            data.product
          )
        );
      } catch (loadError) {
        setError(
          loadError instanceof
            Error
            ? loadError.message
            : "Unable to load product."
        );

        setSaveState("error");
      } finally {
        setLoading(false);
      }
    }

    loadProduct();
  }, [mode, productId]);

  useEffect(() => {
    if (
      saveState !== "saved"
    ) {
      return;
    }

    const timeout =
      window.setTimeout(
        () => {
          setSaveState("idle");
          setSuccess("");
        },
        4000
      );

    return () => {
      window.clearTimeout(
        timeout
      );
    };
  }, [saveState]);

  const allImages =
    useMemo(() => {
      const values: string[] =
        [];

      if (form.masterImage) {
        values.push(
          form.masterImage
        );
      }

      for (const image of
        form.generalImages) {
        values.push(
          image.url
        );
      }

      for (const variant of
        form.variants) {
        for (const image of
          variant.images) {
          values.push(
            image.url
          );
        }
      }

      return [
        ...new Set(
          values.filter(
            isValidImageUrl
          )
        ),
      ];
    }, [form]);

  const productEffectiveInStock =
    form.active &&
    form.inStock &&
    (
      form.variants.length === 0
        ? (
            form.stock === null ||
            form.stock > 0
          )
        : form.variants.some(
            isVariantAvailable
          )
    );

  const productNumericStock =
    form.variants.length === 0
      ? form.stock
      : null;

  const updateLocalized = (
    field:
      | "name"
      | "description",
    languageKey: Language,
    value: string
  ) => {
    setSaveState("idle");
    setSuccess("");
    setError("");

    setForm(
      (current) => ({
        ...current,
        [field]: {
          ...current[field],
          [languageKey]:
            value,
        },
      })
    );
  };

  const updateVariantColor = (
    index: number,
    languageKey: Language,
    value: string
  ) => {
    setSaveState("idle");
    setSuccess("");
    setError("");

    setForm(
      (current) => {
        const variants =
          [
            ...current.variants,
          ];

        variants[index] = {
          ...variants[index],
          color: {
            ...variants[index]
              .color,
            [languageKey]:
              value,
          },
        };

        return {
          ...current,
          variants,
        };
      }
    );
  };

  const updateProductDiscount = (
    discount: ProductPriceDiscount | null
  ) => {
    setSaveState("idle");
    setSuccess("");
    setError("");

    setForm(
      (current) => ({
        ...current,
        discount,
      })
    );
  };

  const updateVariantDiscount = (
    index: number,
    discount: ProductPriceDiscount | null
  ) => {
    setSaveState("idle");
    setSuccess("");
    setError("");

    setForm(
      (current) => {
        const variants =
          [
            ...current.variants,
          ];

        variants[index] = {
          ...variants[index],
          discount,
        };

        return {
          ...current,
          variants,
        };
      }
    );
  };

  const updateVariantSizeDiscount = (
    variantIndex: number,
    sizeKey: ProductSizeKey,
    discount: ProductPriceDiscount | null
  ) => {
    setSaveState("idle");
    setSuccess("");
    setError("");

    setForm(
      (current) => {
        const variants =
          [
            ...current.variants,
          ];

        const variant =
          variants[
            variantIndex
          ];

        variants[
          variantIndex
        ] = {
          ...variant,
          sizes:
            variant.sizes.map(
              (size) =>
                size.key ===
                sizeKey
                  ? {
                      ...size,
                      discount,
                    }
                  : size
            ),
        };

        return {
          ...current,
          variants,
        };
      }
    );
  };

  const updateVariantPrice = (
    index: number,
    value: string
  ) => {
    setSaveState("idle");
    setSuccess("");
    setError("");

    const trimmed =
      value.trim();

    setForm(
      (current) => {
        const variants =
          [
            ...current.variants,
          ];

        const currentVariant =
          variants[index];

        const nextPrice =
          trimmed === ""
            ? null
            : (() => {
                const price =
                  Number(
                    trimmed
                  );

                return Number.isFinite(
                  price
                )
                  ? price
                  : currentVariant.price;
              })();

        variants[index] = {
          ...currentVariant,
          price: nextPrice,
          discount:
            nextPrice === null
              ? null
              : currentVariant.discount
                ? recalculateDiscountPrice(
                    currentVariant.discount,
                    nextPrice
                  )
                : null,
        };

        return {
          ...current,
          variants,
        };
      }
    );
  };

  const toggleVariantSize = (
    variantIndex: number,
    sizeKey: ProductSizeKey
  ) => {
    setSaveState("idle");
    setSuccess("");
    setError("");

    setForm(
      (current) => {
        const variants =
          [
            ...current.variants,
          ];

        const variant =
          variants[
            variantIndex
          ];

        const exists =
          variant.sizes.some(
            (size) =>
              size.key ===
              sizeKey
          );

        variants[
          variantIndex
        ] = {
          ...variant,
          sizes: exists
            ? variant.sizes.filter(
                (size) =>
                  size.key !==
                  sizeKey
              )
            : [
                ...variant.sizes,
                {
                  key: sizeKey,
                  price: null,
                  discount: null,
                },
              ].sort(
                (a, b) =>
                  sizeKeys.indexOf(
                    a.key
                  ) -
                  sizeKeys.indexOf(
                    b.key
                  )
              ),
        };

        return {
          ...current,
          variants,
        };
      }
    );
  };

  const updateVariantSizePrice = (
    variantIndex: number,
    sizeKey: ProductSizeKey,
    value: string
  ) => {
    setSaveState("idle");
    setSuccess("");
    setError("");

    const trimmed =
      value.trim();

    setForm(
      (current) => {
        const variants =
          [
            ...current.variants,
          ];

        const variant =
          variants[
            variantIndex
          ];

        variants[
          variantIndex
        ] = {
          ...variant,
          sizes:
            variant.sizes.map(
              (size) => {
                if (
                  size.key !==
                  sizeKey
                ) {
                  return size;
                }

                const nextPrice =
                  trimmed === ""
                    ? null
                    : (() => {
                        const parsed =
                          Number(
                            trimmed
                          );

                        return Number.isFinite(
                          parsed
                        )
                          ? parsed
                          : size.price;
                      })();

                return {
                  ...size,
                  price:
                    nextPrice,
                  discount:
                    nextPrice ===
                    null
                      ? null
                      : size.discount
                        ? recalculateDiscountPrice(
                            size.discount,
                            nextPrice
                          )
                        : null,
                };
              }
            ),
        };

        return {
          ...current,
          variants,
        };
      }
    );
  };

  const addCustomField = (
    variantIndex: number
  ) => {
    setSaveState("idle");
    setSuccess("");
    setError("");

    setForm(
      (current) => {
        const variants =
          [
            ...current.variants,
          ];

        variants[
          variantIndex
        ] = {
          ...variants[
            variantIndex
          ],
          customFields: [
            ...variants[
              variantIndex
            ].customFields,
            {
              id: createCustomFieldId(),
              label: "",
            },
          ],
        };

        return {
          ...current,
          variants,
        };
      }
    );
  };

  const updateCustomField = (
    variantIndex: number,
    fieldIndex: number,
    value: string
  ) => {
    setSaveState("idle");
    setSuccess("");
    setError("");

    setForm(
      (current) => {
        const variants =
          [
            ...current.variants,
          ];

        const customFields =
          [
            ...variants[
              variantIndex
            ].customFields,
          ];

        customFields[
          fieldIndex
        ] = {
          ...customFields[
            fieldIndex
          ],
          label: value,
        };

        variants[
          variantIndex
        ] = {
          ...variants[
            variantIndex
          ],
          customFields,
        };

        return {
          ...current,
          variants,
        };
      }
    );
  };

  const removeCustomField = (
    variantIndex: number,
    fieldIndex: number
  ) => {
    setSaveState("idle");
    setSuccess("");
    setError("");

    setForm(
      (current) => {
        const variants =
          [
            ...current.variants,
          ];

        variants[
          variantIndex
        ] = {
          ...variants[
            variantIndex
          ],
          customFields:
            variants[
              variantIndex
            ].customFields.filter(
              (
                _,
                currentIndex
              ) =>
                currentIndex !==
                fieldIndex
            ),
        };

        return {
          ...current,
          variants,
        };
      }
    );
  };

  const addGeneralImage =
    () => {
      setSaveState("idle");
      setSuccess("");
      setError("");

      setForm(
        (current) => ({
          ...current,
          generalImages: [
            ...current.generalImages,
            {
              url: "",
            },
          ],
        })
      );
    };

  const updateGeneralImage = (
    index: number,
    value: string
  ) => {
    setSaveState("idle");
    setSuccess("");
    setError("");

    setForm(
      (current) => {
        const images = [
          ...current.generalImages,
        ];

        images[index] = {
          ...images[index],
          url: value,
        };

        return {
          ...current,
          generalImages:
            images,
        };
      }
    );
  };

  const removeGeneralImage = (
    index: number
  ) => {
    setSaveState("idle");
    setSuccess("");
    setError("");

    setForm(
      (current) => ({
        ...current,
        generalImages:
          current.generalImages.filter(
            (
              _,
              imageIndex
            ) =>
              imageIndex !==
              index
          ),
      })
    );
  };

  const moveGeneralImage = (
    index: number,
    direction: -1 | 1
  ) => {
    setSaveState("idle");
    setSuccess("");
    setError("");

    setForm(
      (current) => {
        const nextIndex =
          index + direction;

        return {
          ...current,
          generalImages:
            moveItem(
              current.generalImages,
              index,
              nextIndex
            ),
        };
      }
    );
  };

  const addVariant = () => {
    setSaveState("idle");
    setSuccess("");
    setError("");

    setForm(
      (current) => ({
        ...current,
        variants: [
          ...current.variants,
          emptyVariant(),
        ],
      })
    );
  };

  const removeVariant = (
    index: number
  ) => {
    setSaveState("idle");
    setSuccess("");
    setError("");

    setForm(
      (current) => ({
        ...current,
        variants:
          current.variants.filter(
            (
              _,
              variantIndex
            ) =>
              variantIndex !==
              index
          ),
      })
    );
  };

  const moveVariant = (
    index: number,
    direction: -1 | 1
  ) => {
    setSaveState("idle");
    setSuccess("");
    setError("");

    setForm(
      (current) => {
        const nextIndex =
          index + direction;

        return {
          ...current,
          variants:
            moveItem(
              current.variants,
              index,
              nextIndex
            ),
        };
      }
    );
  };

  const toggleVariant = (
    index: number
  ) => {
    setSaveState("idle");
    setSuccess("");
    setError("");

    setForm(
      (current) => {
        const variants = [
          ...current.variants,
        ];

        variants[index] = {
          ...variants[index],
          active:
            !variants[index]
              .active,
        };

        return {
          ...current,
          variants,
        };
      }
    );
  };

  const toggleVariantStock = (
    index: number
  ) => {
    setSaveState("idle");
    setSuccess("");
    setError("");

    setForm(
      (current) => {
        const variants = [
          ...current.variants,
        ];

        const currentVariant =
          variants[index];

        const nextInStock =
          !currentVariant.inStock;

        variants[index] = {
          ...currentVariant,
          inStock:
            nextInStock,
          stock:
            nextInStock &&
            currentVariant.stock ===
              0
              ? 1
              : currentVariant.stock,
        };

        return {
          ...current,
          variants,
        };
      }
    );
  };

  const updateVariantStock = (
    index: number,
    value: string
  ) => {
    setSaveState("idle");
    setSuccess("");
    setError("");

    if (
      !isValidStockInput(
        value
      )
    ) {
      return;
    }

    const stock =
      parseOptionalStock(
        value
      );

    setForm(
      (current) => {
        const variants = [
          ...current.variants,
        ];

        variants[index] = {
          ...variants[index],
          stock,
          inStock:
            stock === 0
              ? false
              : variants[index]
                  .inStock,
        };

        return {
          ...current,
          variants,
        };
      }
    );
  };

  const updateProductStock =
    (value: string) => {
      setSaveState("idle");
      setSuccess("");
      setError("");

      if (
        !isValidStockInput(
          value
        )
      ) {
        return;
      }

      const stock =
        parseOptionalStock(
          value
        );

      setForm(
        (current) => ({
          ...current,
          stock,
          inStock:
            stock === 0
              ? false
              : current.inStock,
        })
      );
    };

  const toggleProductStock =
    () => {
      setSaveState("idle");
      setSuccess("");
      setError("");

      setForm(
        (current) => {
          const nextInStock =
            !current.inStock;

          return {
            ...current,
            inStock:
              nextInStock,
            stock:
              nextInStock &&
              current.stock ===
                0
                ? 1
                : current.stock,
          };
        }
      );
    };

  const addVariantImage = (
    variantIndex: number
  ) => {
    setSaveState("idle");
    setSuccess("");
    setError("");

    setForm(
      (current) => {
        const variants = [
          ...current.variants,
        ];

        variants[
          variantIndex
        ] = {
          ...variants[
            variantIndex
          ],
          images: [
            ...variants[
              variantIndex
            ].images,
            {
              url: "",
            },
          ],
        };

        return {
          ...current,
          variants,
        };
      }
    );
  };

  const updateVariantImage = (
    variantIndex: number,
    imageIndex: number,
    value: string
  ) => {
    setSaveState("idle");
    setSuccess("");
    setError("");

    setForm(
      (current) => {
        const variants = [
          ...current.variants,
        ];

        const images = [
          ...variants[
            variantIndex
          ].images,
        ];

        images[imageIndex] = {
          ...images[imageIndex],
          url: value,
        };

        variants[
          variantIndex
        ] = {
          ...variants[
            variantIndex
          ],
          images,
        };

        return {
          ...current,
          variants,
        };
      }
    );
  };

  const removeVariantImage = (
    variantIndex: number,
    imageIndex: number
  ) => {
    setSaveState("idle");
    setSuccess("");
    setError("");

    setForm(
      (current) => {
        const variants = [
          ...current.variants,
        ];

        variants[
          variantIndex
        ] = {
          ...variants[
            variantIndex
          ],
          images:
            variants[
              variantIndex
            ].images.filter(
              (
                _,
                currentIndex
              ) =>
                currentIndex !==
                imageIndex
            ),
        };

        return {
          ...current,
          variants,
        };
      }
    );
  };

  const moveVariantImage = (
    variantIndex: number,
    imageIndex: number,
    direction: -1 | 1
  ) => {
    setSaveState("idle");
    setSuccess("");
    setError("");

    setForm(
      (current) => {
        const variants = [
          ...current.variants,
        ];

        const nextIndex =
          imageIndex +
          direction;

        variants[
          variantIndex
        ] = {
          ...variants[
            variantIndex
          ],
          images:
            moveItem(
              variants[
                variantIndex
              ].images,
              imageIndex,
              nextIndex
            ),
        };

        return {
          ...current,
          variants,
        };
      }
    );
  };

  const buildPayload = () => {
    const variants =
      form.variants
        .filter(
          (variant) =>
            hasAnyColor(
              variant.color
            ) ||
            variant.images
              .length > 0 ||
            variant.sizes
              .length > 0 ||
            variant.customFields
              .length > 0
        )
        .map(
          (variant) => ({
            id: variant.id,

            color: {
              en: variant.color.en.trim(),
              de: variant.color.de.trim(),
              ar: variant.color.ar.trim(),
            },

            price:
              variant.price === null
                ? null
                : Number(
                    variant.price
                  ),

            discount:
              variant.price ===
                null ||
              !variant.discount
                ? null
                : {
                    ...variant.discount,
                    percentage:
                      roundPercentage(
                        Number(
                          variant
                            .discount
                            .percentage
                        )
                      ),
                    price:
                      roundPrice(
                        Number(
                          variant
                            .discount
                            .price
                        )
                      ),
                  },

            sizes:
              variant.sizes.map(
                (size) => ({
                  key:
                    size.key,
                  price:
                    size.price ===
                    null
                      ? null
                      : Number(
                          size.price
                        ),
                  discount:
                    size.price ===
                      null ||
                    !size.discount
                      ? null
                      : {
                          ...size.discount,
                          percentage:
                            roundPercentage(
                              Number(
                                size
                                  .discount
                                  .percentage
                              )
                            ),
                          price:
                            roundPrice(
                              Number(
                                size
                                  .discount
                                  .price
                              )
                            ),
                        },
                })
              ),

            customFields:
              variant.customFields
                .map(
                  (field) => ({
                    id:
                      field.id ||
                      createCustomFieldId(),
                    label:
                      field.label.trim(),
                  })
                )
                .filter(
                  (field) =>
                    Boolean(
                      field.label
                    )
                ),

            active:
              variant.active,

            inStock:
              variant.stock === 0
                ? false
                : variant.inStock,

            stock:
              variant.stock,

            images:
              variant.images
                .filter(
                  (image) =>
                    isValidImageUrl(
                      image.url
                    )
                )
                .map(
                  (
                    image,
                    index
                  ) => ({
                    id: image.id,
                    url: image.url.trim(),
                    sortOrder:
                      index,
                  })
                ),
          })
        );

    return {
      id: form.id.trim(),

      slug: form.slug.trim(),

      name: {
        en: form.name.en.trim(),
        de: form.name.de.trim(),
        ar: form.name.ar.trim(),
      },

      description: {
        en:
          form.description.en.trim(),
        de:
          form.description.de.trim(),
        ar:
          form.description.ar.trim(),
      },

      price:
        Number(form.price),

      discount:
        form.discount
          ? {
              ...form.discount,
              percentage:
                roundPercentage(
                  Number(
                    form.discount
                      .percentage
                  )
                ),
              price:
                roundPrice(
                  Number(
                    form.discount
                      .price
                  )
                ),
            }
          : null,

      category:
        form.category,

      emoji:
        form.emoji.trim(),

      masterImage:
        form.masterImage?.trim() ||
        null,

      generalImages:
        form.generalImages
          .filter(
            (image) =>
              isValidImageUrl(
                image.url
              )
          )
          .map(
            (
              image,
              index
            ) => ({
              id: image.id,
              url:
                image.url.trim(),
              sortOrder:
                index,
            })
          ),

      variants,

      featured:
        form.featured,

      active:
        form.active,

      inStock:
        form.stock === 0
          ? false
          : form.inStock,

      stock:
        form.stock,
    };
  };

  const saveProduct =
    async () => {
      if (saving) {
        return;
      }

      setSaving(true);
      setSaveState("saving");
      setError("");
      setSuccess("");

      try {
        const payload =
          buildPayload();

        if (
          !payload.id ||
          !payload.slug ||
          !payload.name.en ||
          !payload.name.de ||
          !payload.name.ar
        ) {
          throw new Error(
            t.errorRequired
          );
        }

        if (
          !/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(
            payload.id
          )
        ) {
          throw new Error(
            t.invalidId
          );
        }

        if (
          !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(
            payload.slug
          )
        ) {
          throw new Error(
            t.invalidSlug
          );
        }

        if (
          !Number.isFinite(
            payload.price
          ) ||
          payload.price < 0
        ) {
          throw new Error(
            t.invalidPrice
          );
        }

        const basicDiscountError =
          validateDiscount(
            payload.discount,
            payload.price,
            t
          );

        if (basicDiscountError) {
          throw new Error(
            basicDiscountError
          );
        }

        if (
          payload.stock !==
            null &&
          (!Number.isInteger(
            payload.stock
          ) ||
            payload.stock < 0)
        ) {
          throw new Error(
            t.invalidStock
          );
        }

        for (
          const variant of
            payload.variants
        ) {
          if (
            variant.active &&
            !hasCompleteColor(
              variant.color
            )
          ) {
            throw new Error(
              t.invalidColor
            );
          }

          if (
            variant.price !== null &&
            (
              !Number.isFinite(
                variant.price
              ) ||
              variant.price < 0
            )
          ) {
            throw new Error(
              t.invalidVariantPrice
            );
          }

          const variantDiscountError =
            variant.price !== null
              ? validateDiscount(
                  variant.discount,
                  variant.price,
                  t
                )
              : null;

          if (
            variant.discount &&
            variant.price ===
              null
          ) {
            throw new Error(
              t.invalidDiscount
            );
          }

          if (
            variantDiscountError
          ) {
            throw new Error(
              variantDiscountError
            );
          }

          if (
            variant.stock !==
              null &&
            (!Number.isInteger(
              variant.stock
            ) ||
              variant.stock < 0)
          ) {
            throw new Error(
              t.invalidStock
            );
          }

          const seenSizes =
            new Set<string>();

          for (
            const size of
              variant.sizes
          ) {
            if (
              seenSizes.has(
                size.key
              )
            ) {
              throw new Error(
                t.invalidSize
              );
            }

            seenSizes.add(
              size.key
            );

            if (
              size.price !== null &&
              (
                !Number.isFinite(
                  size.price
                ) ||
                size.price < 0
              )
            ) {
              throw new Error(
                t.invalidSize
              );
            }

            if (
              size.discount &&
              size.price ===
                null
            ) {
              throw new Error(
                t.invalidDiscount
              );
            }

            const sizeDiscountError =
              size.price !== null
                ? validateDiscount(
                    size.discount,
                    size.price,
                    t
                  )
                : null;

            if (
              sizeDiscountError
            ) {
              throw new Error(
                sizeDiscountError
              );
            }
          }

          for (
            const field of
              variant.customFields
          ) {
            if (
              !field.label.trim()
            ) {
              throw new Error(
                t.invalidCustomField
              );
            }
          }
        }

        const endpoint =
          mode === "create"
            ? "/api/admin/products"
            : `/api/admin/products/${encodeURIComponent(
                productId ??
                  payload.id
              )}`;

        const method =
          mode === "create"
            ? "POST"
            : "PUT";

        const response =
          await fetch(
            endpoint,
            {
              method,
              headers: {
                "Content-Type":
                  "application/json",
              },
              body:
                JSON.stringify(
                  payload
                ),
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data?.error ||
              "Unable to save product."
          );
        }

        const savedProduct =
          normalizeProduct(
            data.product
          );

        setForm(
          savedProduct
        );

        setSuccess(
          t.success
        );

        setSaveState(
          "saved"
        );

        if (
          mode === "create"
        ) {
          router.replace(
            `/admin/products/${encodeURIComponent(
              savedProduct.slug ||
                savedProduct.id
            )}`
          );
        }
      } catch (saveError) {
        setError(
          saveError instanceof
            Error
            ? saveError.message
            : "Unable to save product."
        );

        setSuccess("");

        setSaveState(
          "error"
        );
      } finally {
        setSaving(false);
      }
    };

  const deleteProduct =
    async () => {
      if (
        mode !== "edit" ||
        !productId ||
        deleting ||
        saving
      ) {
        return;
      }

      const confirmed =
        window.confirm(
          t.deleteConfirm
        );

      if (!confirmed) {
        return;
      }

      setDeleting(true);
      setError("");
      setSuccess("");
      setSaveState("idle");

      try {
        const response =
          await fetch(
            `/api/admin/products/${encodeURIComponent(
              productId
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
              "Unable to delete product."
          );
        }

        router.push(
          "/admin/products"
        );

        router.refresh();
      } catch (deleteError) {
        setError(
          deleteError instanceof
            Error
            ? deleteError.message
            : "Unable to delete product."
        );

        setSaveState(
          "error"
        );
      } finally {
        setDeleting(false);
      }
    };

  if (loading) {
    return (
      <main className="min-h-screen bg-[var(--background)] px-4 py-10 text-[var(--text-primary)]">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-sm">
            {t.loadingProduct}
          </div>
        </div>
      </main>
    );
  }

  const title =
    mode === "create"
      ? t.createTitle
      : t.editTitle;

  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-8 text-[var(--text-primary)] sm:px-6 lg:py-12">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={() =>
              router.push(
                "/admin/products"
              )
            }
            className="inline-flex w-fit cursor-pointer items-center rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-semibold text-[var(--text-primary)] shadow-sm transition hover:-translate-y-0.5 hover:bg-[var(--surface-soft)]"
          >
            {t.back}
          </button>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() =>
                setPreviewOpen(
                  true
                )
              }
              className="cursor-pointer rounded-full border border-[var(--brand-soft)] bg-[var(--surface)] px-5 py-2.5 text-sm font-semibold text-[var(--brand-strong)] transition hover:bg-[var(--brand-soft)]"
            >
              {t.preview}
            </button>

            <button
              type="button"
              onClick={saveProduct}
              disabled={saving}
              className={`rounded-full px-6 py-2.5 text-sm font-bold text-white transition ${
                saving
                  ? "cursor-not-allowed bg-[var(--border)]"
                  : "cursor-pointer bg-[var(--brand)] hover:-translate-y-0.5 hover:opacity-90"
              }`}
            >
              {saving
                ? t.saving
                : saveState ===
                    "saved"
                  ? t.saved
                  : t.save}
            </button>
          </div>
        </div>

        <div className="mt-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
              Product Management
            </p>

            <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
              {title}
            </h1>
          </div>

          <div className="flex flex-wrap justify-end gap-2">
            <div
              className={`rounded-full px-4 py-2 text-xs font-bold ${
                form.active
                  ? "bg-[var(--brand-soft)] text-[var(--brand-strong)]"
                  : "bg-[var(--surface-soft)] text-[var(--text-secondary)]"
              }`}
            >
              {form.active
                ? t.activeLabel
                : t.inactive}
            </div>

            <div
              className={`rounded-full px-4 py-2 text-xs font-bold ${
                productEffectiveInStock
                  ? "bg-[var(--brand-soft)] text-[var(--brand-strong)]"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {productEffectiveInStock
                ? t.inStock
                : t.outOfStock}
            </div>

            {productNumericStock !==
              null && (
              <div className="rounded-full bg-[var(--surface-soft)] px-4 py-2 text-xs font-bold text-[var(--text-secondary)]">
                {t.stockQuantity}:{" "}
                {productNumericStock}
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="mt-6 rounded-2xl border border-red-300 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-6 rounded-2xl border border-[var(--brand-soft)] bg-[var(--brand-soft)] px-5 py-4 text-sm font-bold text-[var(--brand-strong)]">
            {success}
          </div>
        )}

        <div className="mt-8 space-y-8">
          <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm sm:p-7">
            <h2 className="text-xl font-black">
              {t.basic}
            </h2>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold">
                  {t.id}
                </span>

                <input
                  value={
                    form.id
                  }
                  onChange={(
                    event
                  ) => {
                    setSaveState(
                      "idle"
                    );
                    setSuccess("");
                    setError("");

                    setForm(
                      (
                        current
                      ) => ({
                        ...current,
                        id: event
                          .target
                          .value,
                      })
                    );
                  }}
                  disabled={
                    mode ===
                    "edit"
                  }
                  className="w-full rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 outline-none transition focus:border-[var(--brand)] disabled:cursor-not-allowed disabled:opacity-60"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold">
                  {t.slug}
                </span>

                <input
                  value={
                    form.slug
                  }
                  onChange={(
                    event
                  ) => {
                    setSaveState(
                      "idle"
                    );
                    setSuccess("");
                    setError("");

                    setForm(
                      (
                        current
                      ) => ({
                        ...current,
                        slug: event.target.value.toLowerCase(),
                      })
                    );
                  }}
                  className="w-full rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 outline-none transition focus:border-[var(--brand)]"
                />
              </label>

              <div className="block">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold">
                    {t.price}
                  </span>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      Number.isFinite(
                        form.price
                      )
                        ? form.price
                        : 0
                    }
                    onChange={(
                      event
                    ) => {
                      setSaveState(
                        "idle"
                      );
                      setSuccess("");
                      setError("");

                      const nextPrice = Number(
                        event
                          .target
                          .value
                      );

                      setForm(
                        (
                          current
                        ) => ({
                          ...current,
                          price: nextPrice,
                          discount:
                            Number.isFinite(
                              nextPrice
                            ) &&
                            current.discount
                              ? recalculateDiscountPrice(
                                  current.discount,
                                  nextPrice
                                )
                              : current.discount,
                        })
                      );
                    }}
                    className="w-full rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 outline-none transition focus:border-[var(--brand)]"
                  />
                </label>

                <DiscountEditor
                  discount={
                    form.discount
                  }
                  originalPrice={
                    form.price
                  }
                  translations={
                    t
                  }
                  onChange={
                    updateProductDiscount
                  }
                />
              </div>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold">
                  {t.category}
                </span>

                <select
                  value={
                    form.category
                  }
                  onChange={(
                    event
                  ) => {
                    setSaveState(
                      "idle"
                    );
                    setSuccess("");
                    setError("");

                    setForm(
                      (
                        current
                      ) => ({
                        ...current,
                        category:
                          event
                            .target
                            .value,
                      })
                    );
                  }}
                  className="w-full cursor-pointer rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 outline-none transition focus:border-[var(--brand)]"
                >
                  {categories.map(
                    (
                      category
                    ) => (
                      <option
                        key={
                          category
                        }
                        value={
                          category
                        }
                      >
                        {
                          category
                        }
                      </option>
                    )
                  )}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold">
                  {t.emoji}
                </span>

                <input
                  value={
                    form.emoji
                  }
                  onChange={(
                    event
                  ) => {
                    setSaveState(
                      "idle"
                    );
                    setSuccess("");
                    setError("");

                    setForm(
                      (
                        current
                      ) => ({
                        ...current,
                        emoji:
                          event
                            .target
                            .value,
                      })
                    );
                  }}
                  className="w-full rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-2xl outline-none transition focus:border-[var(--brand)]"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold">
                  {t.stockQuantity}
                </span>

                <input
                  type="number"
                  min="0"
                  step="1"
                  inputMode="numeric"
                  value={
                    form.stock ??
                    ""
                  }
                  onChange={(
                    event
                  ) =>
                    updateProductStock(
                      event
                        .target
                        .value
                    )
                  }
                  placeholder="—"
                  className="w-full rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 outline-none transition focus:border-[var(--brand)]"
                />

                <p className="mt-2 text-xs leading-5 text-[var(--text-secondary)]">
                  {
                    t.stockHelp
                  }
                </p>

                {form.variants.length >
                  0 && (
                  <p className="mt-2 text-xs leading-5 text-[var(--brand-strong)]">
                    Variant stock is used for products with colors / variants. The product-level numeric stock is ignored for purchase limits when variants exist.
                  </p>
                )}
              </label>

              <div className="flex flex-col justify-end gap-3">
                <label className="flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={
                      form.featured
                    }
                    onChange={(
                      event
                    ) => {
                      setSaveState(
                        "idle"
                      );
                      setSuccess("");
                      setError("");

                      setForm(
                        (
                          current
                        ) => ({
                          ...current,
                          featured:
                            event
                              .target
                              .checked,
                        })
                      );
                    }}
                    className="h-5 w-5 cursor-pointer accent-[var(--brand)]"
                  />

                  <span className="text-sm font-semibold">
                    {
                      t.featured
                    }
                  </span>
                </label>

                <label className="flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={
                      form.active
                    }
                    onChange={(
                      event
                    ) => {
                      setSaveState(
                        "idle"
                      );
                      setSuccess("");
                      setError("");

                      setForm(
                        (
                          current
                        ) => ({
                          ...current,
                          active:
                            event
                              .target
                              .checked,
                        })
                      );
                    }}
                    className="h-5 w-5 cursor-pointer accent-[var(--brand)]"
                  />

                  <span className="text-sm font-semibold">
                    {t.active}
                  </span>
                </label>

                <label className="flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={
                      form.inStock
                    }
                    onChange={
                      toggleProductStock
                    }
                    className="h-5 w-5 cursor-pointer accent-[var(--brand)]"
                  />

                  <span className="text-sm font-semibold">
                    {t.inStock}
                  </span>
                </label>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm sm:p-7">
            <h2 className="text-xl font-black">
              {t.name}
            </h2>

            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {(
                [
                  "en",
                  "de",
                  "ar",
                ] as Language[]
              ).map(
                (
                  languageKey
                ) => (
                  <label
                    key={
                      languageKey
                    }
                    className="block"
                  >
                    <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-[var(--text-secondary)]">
                      {
                        languageKey
                      }
                    </span>

                    <input
                      value={
                        form.name[
                          languageKey
                        ]
                      }
                      dir={
                        languageKey ===
                        "ar"
                          ? "rtl"
                          : "ltr"
                      }
                      onChange={(
                        event
                      ) =>
                        updateLocalized(
                          "name",
                          languageKey,
                          event
                            .target
                            .value
                        )
                      }
                      className="w-full rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 outline-none transition focus:border-[var(--brand)]"
                    />
                  </label>
                )
              )}
            </div>
          </section>

          <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm sm:p-7">
            <h2 className="text-xl font-black">
              {t.description}
            </h2>

            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {(
                [
                  "en",
                  "de",
                  "ar",
                ] as Language[]
              ).map(
                (
                  languageKey
                ) => (
                  <label
                    key={
                      languageKey
                    }
                    className="block"
                  >
                    <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-[var(--text-secondary)]">
                      {
                        languageKey
                      }
                    </span>

                    <textarea
                      rows={6}
                      value={
                        form
                          .description[
                          languageKey
                        ]
                      }
                      dir={
                        languageKey ===
                        "ar"
                          ? "rtl"
                          : "ltr"
                      }
                      onChange={(
                        event
                      ) =>
                        updateLocalized(
                          "description",
                          languageKey,
                          event
                            .target
                            .value
                        )
                      }
                      className="w-full resize-y rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 outline-none transition focus:border-[var(--brand)]"
                    />
                  </label>
                )
              )}
            </div>
          </section>

          <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm sm:p-7">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-black">
                  {t.master}
                </h2>

                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  {
                    t.masterHelp
                  }
                </p>
              </div>

              {form.masterImage && (
                <button
                  type="button"
                  onClick={() => {
                    setSaveState(
                      "idle"
                    );
                    setSuccess("");
                    setError("");

                    setForm(
                      (
                        current
                      ) => ({
                        ...current,
                        masterImage:
                          null,
                      })
                    );
                  }}
                  className="cursor-pointer rounded-full border border-[var(--border)] px-4 py-2 text-xs font-semibold transition hover:bg-[var(--surface-soft)]"
                >
                  {t.remove}
                </button>
              )}
            </div>

            <div className="mt-5">
              {form.masterImage ? (
                <div className="relative aspect-square max-w-sm overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface-soft)]">
                  {getImageSrc(
                    form.masterImage
                  ) ? (
                    <Image
                      src={
                        form.masterImage
                      }
                      alt={
                        t.selectedMaster
                      }
                      fill
                      className="object-cover"
                      sizes="384px"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center p-6 text-center text-sm text-[var(--text-secondary)]">
                      {
                        form.masterImage
                      }
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-[var(--border)] p-6 text-sm text-[var(--text-secondary)]">
                  {
                    t.noMaster
                  }
                </div>
              )}
            </div>

            {allImages.length >
              0 && (
              <div className="mt-6">
                <p className="mb-3 text-sm font-bold">
                  {
                    t.setMaster
                  }
                </p>

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
                  {allImages.map(
                    (url) => (
                      <button
                        key={url}
                        type="button"
                        onClick={() => {
                          setSaveState(
                            "idle"
                          );
                          setSuccess("");
                          setError("");

                          setForm(
                            (
                              current
                            ) => ({
                              ...current,
                              masterImage:
                                url,
                            })
                          );
                        }}
                        className={`relative aspect-square cursor-pointer overflow-hidden rounded-2xl border-2 ${
                          form.masterImage ===
                          url
                            ? "border-[var(--brand)]"
                            : "border-transparent"
                        }`}
                      >
                        <Image
                          src={url}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="160px"
                        />
                      </button>
                    )
                  )}
                </div>
              </div>
            )}
          </section>

          <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm sm:p-7">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-black">
                {t.general}
              </h2>

              <button
                type="button"
                onClick={
                  addGeneralImage
                }
                className="cursor-pointer rounded-full bg-[var(--brand)] px-4 py-2 text-xs font-bold text-white transition hover:opacity-90"
              >
                +{" "}
                {t.addImage}
              </button>
            </div>

            <div className="mt-6 space-y-4">
              {form.generalImages
                .length ===
                0 && (
                <p className="rounded-2xl border border-dashed border-[var(--border)] p-5 text-sm text-[var(--text-secondary)]">
                  {
                    t.noImages
                  }
                </p>
              )}

              {form.generalImages.map(
                (
                  image,
                  index
                ) => (
                  <div
                    key={
                      image.id ??
                      `general-${index}`
                    }
                    className="rounded-2xl border border-[var(--border)] p-4"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row">
                      <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-2xl bg-[var(--surface-soft)]">
                        {getImageSrc(
                          image.url
                        ) ? (
                          <Image
                            src={
                              image.url
                            }
                            alt=""
                            fill
                            className="object-cover"
                            sizes="112px"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-xs text-[var(--text-secondary)]">
                            —
                          </div>
                        )}
                      </div>

                      <div className="flex-1">
                        <label className="block">
                          <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-[var(--text-secondary)]">
                            {
                              t.imageUrl
                            }
                          </span>

                          <input
                            value={
                              image.url
                            }
                            onChange={(
                              event
                            ) =>
                              updateGeneralImage(
                                index,
                                event
                                  .target
                                  .value
                              )
                            }
                            className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm outline-none focus:border-[var(--brand)]"
                          />
                        </label>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setSaveState(
                                "idle"
                              );
                              setSuccess("");
                              setError("");

                              setForm(
                                (
                                  current
                                ) => ({
                                  ...current,
                                  masterImage:
                                    image.url,
                                })
                              );
                            }}
                            className="cursor-pointer rounded-full border border-[var(--brand-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--brand-strong)] hover:bg-[var(--brand-soft)]"
                          >
                            {
                              t.setMaster
                            }
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              moveGeneralImage(
                                index,
                                -1
                              )
                            }
                            disabled={
                              index ===
                              0
                            }
                            className="cursor-pointer rounded-full border border-[var(--border)] px-3 py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            ↑
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              moveGeneralImage(
                                index,
                                1
                              )
                            }
                            disabled={
                              index ===
                              form
                                .generalImages
                                .length -
                                1
                            }
                            className="cursor-pointer rounded-full border border-[var(--border)] px-3 py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            ↓
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              removeGeneralImage(
                                index
                              )
                            }
                            className="cursor-pointer rounded-full border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                          >
                            {
                              t.remove
                            }
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          </section>

          <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm sm:p-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-black">
                  {t.colors}
                </h2>

                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  Color prices are optional overrides of the basic price. Size prices are optional complete final prices.
                </p>
              </div>

              <button
                type="button"
                onClick={
                  addVariant
                }
                className="cursor-pointer rounded-full bg-[var(--brand)] px-5 py-2.5 text-sm font-bold text-white transition hover:opacity-90"
              >
                +{" "}
                {t.addColor}
              </button>
            </div>

            <div className="mt-6 space-y-6">
              {form.variants
                .length ===
                0 && (
                <div className="rounded-2xl border border-dashed border-[var(--border)] p-6 text-sm text-[var(--text-secondary)]">
                  {
                    t.noVariants
                  }
                </div>
              )}

              {form.variants.map(
                (
                  variant,
                  variantIndex
                ) => {
                  const variantEffectiveInStock =
                    isVariantAvailable(
                      variant
                    );

                  const effectiveColorPrice =
                    getEffectiveColorPrice(
                      variant,
                      form.price
                    );

                  return (
                    <div
                      key={
                        variant.id ??
                        `variant-${variantIndex}`
                      }
                      className={`rounded-3xl border p-5 ${
                        variant.active
                          ? "border-[var(--border)]"
                          : "border-dashed border-[var(--border)] opacity-70"
                      }`}
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <p className="text-sm font-black">
                            {
                              t.color
                            }{" "}
                            {variantIndex +
                              1}
                          </p>

                          <div className="mt-2 flex flex-wrap gap-2">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-bold ${
                                variant.active
                                  ? "bg-[var(--brand-soft)] text-[var(--brand-strong)]"
                                  : "bg-[var(--surface-soft)] text-[var(--text-secondary)]"
                              }`}
                            >
                              {variant.active
                                ? t.activeLabel
                                : t.inactive}
                            </span>

                            <span className="rounded-full bg-[var(--brand-soft)] px-3 py-1 text-xs font-bold text-[var(--brand-strong)]">
                              €{effectiveColorPrice.toFixed(2)}
                            </span>

                            <span
                              className={`rounded-full px-3 py-1 text-xs font-bold ${
                                variantEffectiveInStock
                                  ? "bg-[var(--brand-soft)] text-[var(--brand-strong)]"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {variantEffectiveInStock
                                ? t.variantInStock
                                : t.variantOutOfStock}
                            </span>

                            {variant.stock !==
                              null && (
                              <span className="rounded-full bg-[var(--surface-soft)] px-3 py-1 text-xs font-bold text-[var(--text-secondary)]">
                                {
                                  t.variantStock
                                }
                                :{" "}
                                {
                                  variant.stock
                                }
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              toggleVariant(
                                variantIndex
                              )
                            }
                            className="cursor-pointer rounded-full border border-[var(--border)] px-4 py-2 text-xs font-semibold hover:bg-[var(--surface-soft)]"
                          >
                            {variant.active
                              ? t.inactive
                              : t.activeLabel}
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              toggleVariantStock(
                                variantIndex
                              )
                            }
                            className={`cursor-pointer rounded-full border px-4 py-2 text-xs font-semibold ${
                              variant.inStock &&
                              variant.stock !==
                                0
                                ? "border-red-300 text-red-600 hover:bg-red-50"
                                : "border-[var(--brand-soft)] text-[var(--brand-strong)] hover:bg-[var(--brand-soft)]"
                            }`}
                          >
                            {variant.inStock &&
                            variant.stock !==
                              0
                              ? t.variantOutOfStock
                              : t.variantInStock}
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              moveVariant(
                                variantIndex,
                                -1
                              )
                            }
                            disabled={
                              variantIndex ===
                              0
                            }
                            className="cursor-pointer rounded-full border border-[var(--border)] px-3 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            ↑
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              moveVariant(
                                variantIndex,
                                1
                              )
                            }
                            disabled={
                              variantIndex ===
                              form
                                .variants
                                .length -
                                1
                            }
                            className="cursor-pointer rounded-full border border-[var(--border)] px-3 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            ↓
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              removeVariant(
                                variantIndex
                              )
                            }
                            className="cursor-pointer rounded-full border border-red-300 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
                          >
                            {
                              t.remove
                            }
                          </button>
                        </div>
                      </div>

                      <div className="mt-5 grid gap-4 md:grid-cols-2">
                        {(
                          [
                            "en",
                            "de",
                            "ar",
                          ] as Language[]
                        ).map(
                          (
                            languageKey
                          ) => (
                            <label
                              key={
                                languageKey
                              }
                              className="block"
                            >
                              <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-[var(--text-secondary)]">
                                {
                                  languageKey
                                }
                              </span>

                              <input
                                value={
                                  variant
                                    .color[
                                    languageKey
                                  ]
                                }
                                dir={
                                  languageKey ===
                                  "ar"
                                    ? "rtl"
                                    : "ltr"
                                }
                                onChange={(
                                  event
                                ) =>
                                  updateVariantColor(
                                    variantIndex,
                                    languageKey,
                                    event
                                      .target
                                      .value
                                  )
                                }
                                className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm outline-none focus:border-[var(--brand)]"
                              />
                            </label>
                          )
                        )}

                        <div className="block">
                          <label className="block">
                            <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-[var(--text-secondary)]">
                              {
                                t.variantPrice
                              }
                            </span>

                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={
                                variant.price ??
                                ""
                              }
                              onChange={(
                                event
                              ) =>
                                updateVariantPrice(
                                  variantIndex,
                                  event
                                    .target
                                    .value
                                )
                              }
                              placeholder={`${form.price.toFixed(
                                2
                              )}`}
                              className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm font-semibold outline-none focus:border-[var(--brand)]"
                            />

                            <p className="mt-2 text-xs leading-5 text-[var(--text-secondary)]">
                              {
                                t.variantPriceHelp
                              }
                            </p>
                          </label>

                          {variant.price !==
                            null && (
                            <DiscountEditor
                              discount={
                                variant.discount
                              }
                              originalPrice={
                                variant.price
                              }
                              translations={
                                t
                              }
                              onChange={(
                                discount
                              ) =>
                                updateVariantDiscount(
                                  variantIndex,
                                  discount
                                )
                              }
                            />
                          )}
                        </div>

                        <label className="block">
                          <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-[var(--text-secondary)]">
                            {
                              t.variantStock
                            }
                          </span>

                          <input
                            type="number"
                            min="0"
                            step="1"
                            inputMode="numeric"
                            value={
                              variant.stock ??
                              ""
                            }
                            onChange={(
                              event
                            ) =>
                              updateVariantStock(
                                variantIndex,
                                event
                                  .target
                                  .value
                              )
                            }
                            placeholder="—"
                            className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm outline-none focus:border-[var(--brand)]"
                          />

                          <p className="mt-2 text-xs leading-5 text-[var(--text-secondary)]">
                            {
                              t.variantStockHelp
                            }
                          </p>
                        </label>
                      </div>

                      <div className="mt-6 rounded-3xl border border-[var(--border)] bg-[var(--surface-soft)] p-5">
                        <div>
                          <h3 className="text-base font-black">
                            {
                              t.sizes
                            }
                          </h3>

                          <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">
                            {
                              t.sizesHelp
                            }
                          </p>
                        </div>

                        <div className="mt-5 grid gap-4 md:grid-cols-3">
                          {sizeKeys.map(
                            (
                              sizeKey
                            ) => {
                              const size =
                                variant.sizes.find(
                                  (
                                    item
                                  ) =>
                                    item.key ===
                                    sizeKey
                                );

                              const enabled =
                                Boolean(
                                  size
                                );

                              return (
                                <div
                                  key={
                                    sizeKey
                                  }
                                  className={`rounded-2xl border p-4 ${
                                    enabled
                                      ? "border-[var(--brand)] bg-[var(--surface)]"
                                      : "border-[var(--border)] bg-[var(--background)]"
                                  }`}
                                >
                                  <label className="flex cursor-pointer items-center gap-3">
                                    <input
                                      type="checkbox"
                                      checked={
                                        enabled
                                      }
                                      onChange={() =>
                                        toggleVariantSize(
                                          variantIndex,
                                          sizeKey
                                        )
                                      }
                                      className="h-5 w-5 cursor-pointer accent-[var(--brand)]"
                                    />

                                    <span className="font-bold">
                                      {getSizeLabel(
                                        sizeKey,
                                        t
                                      )}
                                    </span>
                                  </label>

                                  {enabled &&
                                    size && (
                                      <div>
                                        <label className="mt-4 block">
                                          <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-[var(--text-secondary)]">
                                            {
                                              t.finalPrice
                                            }
                                          </span>

                                          <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={
                                              size.price ??
                                              ""
                                            }
                                            onChange={(
                                              event
                                            ) =>
                                              updateVariantSizePrice(
                                                variantIndex,
                                                sizeKey,
                                                event
                                                  .target
                                                  .value
                                              )
                                            }
                                            placeholder={effectiveColorPrice.toFixed(
                                              2
                                            )}
                                            className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm outline-none focus:border-[var(--brand)]"
                                          />

                                          <p className="mt-2 text-xs leading-5 text-[var(--text-secondary)]">
                                            {
                                              t.finalPriceHelp
                                            }
                                          </p>
                                        </label>

                                        {size.price !==
                                          null && (
                                          <DiscountEditor
                                            discount={
                                              size.discount
                                            }
                                            originalPrice={
                                              size.price
                                            }
                                            translations={
                                              t
                                            }
                                            onChange={(
                                              discount
                                            ) =>
                                              updateVariantSizeDiscount(
                                                variantIndex,
                                                sizeKey,
                                                discount
                                              )
                                            }
                                          />
                                        )}
                                      </div>
                                    )}
                                </div>
                              );
                            }
                          )}
                        </div>
                      </div>

                      <div className="mt-6 rounded-3xl border border-[var(--border)] bg-[var(--surface-soft)] p-5">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <h3 className="text-base font-black">
                              {
                                t.customFields
                              }
                            </h3>

                            <p className="mt-1 max-w-3xl text-xs leading-5 text-[var(--text-secondary)]">
                              {
                                t.customFieldsHelp
                              }
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              addCustomField(
                                variantIndex
                              )
                            }
                            className="inline-flex w-fit cursor-pointer items-center rounded-full bg-[var(--brand)] px-4 py-2 text-xs font-bold text-white hover:opacity-90"
                          >
                            +{" "}
                            {
                              t.addCustomField
                            }
                          </button>
                        </div>

                        <div className="mt-5 space-y-3">
                          {variant.customFields
                            .length ===
                            0 && (
                            <div className="rounded-2xl border border-dashed border-[var(--border)] p-4 text-sm text-[var(--text-secondary)]">
                              {
                                t.noCustomFields
                              }
                            </div>
                          )}

                          {variant.customFields.map(
                            (
                              field,
                              fieldIndex
                            ) => (
                              <div
                                key={
                                  field.id
                                }
                                className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4"
                              >
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                                  <label className="block flex-1">
                                    <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-[var(--text-secondary)]">
                                      {
                                        t.customFieldLabel
                                      }
                                    </span>

                                    <input
                                      value={
                                        field.label
                                      }
                                      onChange={(
                                        event
                                      ) =>
                                        updateCustomField(
                                          variantIndex,
                                          fieldIndex,
                                          event
                                            .target
                                            .value
                                        )
                                      }
                                      placeholder={
                                        t.customFieldPlaceholder
                                      }
                                      className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm outline-none focus:border-[var(--brand)]"
                                    />
                                  </label>

                                  <div className="flex items-center gap-2">
                                    <span className="rounded-full bg-[var(--brand-soft)] px-3 py-2 text-xs font-bold text-[var(--brand-strong)]">
                                      ✓{" "}
                                      {
                                        t.customFieldRequired
                                      }
                                    </span>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        removeCustomField(
                                          variantIndex,
                                          fieldIndex
                                        )
                                      }
                                      className="cursor-pointer rounded-full border border-red-300 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
                                    >
                                      {
                                        t.remove
                                      }
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      </div>

                      <div className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <h3 className="text-sm font-black">
                              {
                                t.variantAvailability
                              }
                            </h3>

                            <p className="mt-1 text-xs text-[var(--text-secondary)]">
                              {variantEffectiveInStock
                                ? t.variantInStock
                                : t.variantOutOfStock}

                              {variant.stock !==
                                null && (
                                <>
                                  {" "}
                                  ·{" "}
                                  {
                                    variant.stock
                                  }
                                </>
                              )}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              toggleVariantStock(
                                variantIndex
                              )
                            }
                            className={`cursor-pointer rounded-full px-5 py-2.5 text-xs font-bold transition ${
                              variantEffectiveInStock
                                ? "bg-red-100 text-red-700 hover:bg-red-200"
                                : "bg-[var(--brand)] text-white hover:opacity-90"
                            }`}
                          >
                            {variantEffectiveInStock
                              ? t.variantOutOfStock
                              : t.variantInStock}
                          </button>
                        </div>
                      </div>

                      <div className="mt-6 flex items-center justify-between gap-4">
                        <h3 className="text-sm font-black">
                          {
                            t.variantImages
                          }
                        </h3>

                        <button
                          type="button"
                          onClick={() =>
                            addVariantImage(
                              variantIndex
                            )
                          }
                          className="cursor-pointer rounded-full bg-[var(--brand-soft)] px-4 py-2 text-xs font-bold text-[var(--brand-strong)] hover:opacity-80"
                        >
                          +{" "}
                          {
                            t.addImage
                          }
                        </button>
                      </div>

                      <div className="mt-4 space-y-4">
                        {variant.images
                          .length ===
                          0 && (
                          <p className="rounded-2xl border border-dashed border-[var(--border)] p-5 text-sm text-[var(--text-secondary)]">
                            {
                              t.noImages
                            }
                          </p>
                        )}

                        {variant.images.map(
                          (
                            image,
                            imageIndex
                          ) => (
                            <div
                              key={
                                image.id ??
                                `${variantIndex}-${imageIndex}`
                              }
                              className="rounded-2xl border border-[var(--border)] p-4"
                            >
                              <div className="flex flex-col gap-4 sm:flex-row">
                                <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-2xl bg-[var(--surface-soft)]">
                                  {getImageSrc(
                                    image.url
                                  ) ? (
                                    <Image
                                      src={
                                        image.url
                                      }
                                      alt=""
                                      fill
                                      className="object-cover"
                                      sizes="112px"
                                    />
                                  ) : (
                                    <div className="flex h-full items-center justify-center text-xs text-[var(--text-secondary)]">
                                      —
                                    </div>
                                  )}
                                </div>

                                <div className="flex-1">
                                  <label className="block">
                                    <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-[var(--text-secondary)]">
                                      {
                                        t.imageUrl
                                      }
                                    </span>

                                    <input
                                      value={
                                        image.url
                                      }
                                      onChange={(
                                        event
                                      ) =>
                                        updateVariantImage(
                                          variantIndex,
                                          imageIndex,
                                          event
                                            .target
                                            .value
                                        )
                                      }
                                      className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm outline-none focus:border-[var(--brand)]"
                                    />
                                  </label>

                                  <div className="mt-3 flex flex-wrap gap-2">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSaveState(
                                          "idle"
                                        );
                                        setSuccess("");
                                        setError("");

                                        setForm(
                                          (
                                            current
                                          ) => ({
                                            ...current,
                                            masterImage:
                                              image.url,
                                          })
                                        );
                                      }}
                                      className="cursor-pointer rounded-full border border-[var(--brand-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--brand-strong)] hover:bg-[var(--brand-soft)]"
                                    >
                                      {
                                        t.setMaster
                                      }
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        moveVariantImage(
                                          variantIndex,
                                          imageIndex,
                                          -1
                                        )
                                      }
                                      disabled={
                                        imageIndex ===
                                        0
                                      }
                                      className="cursor-pointer rounded-full border border-[var(--border)] px-3 py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                      ↑
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        moveVariantImage(
                                          variantIndex,
                                          imageIndex,
                                          1
                                        )
                                      }
                                      disabled={
                                        imageIndex ===
                                        variant
                                          .images
                                          .length -
                                          1
                                      }
                                      className="cursor-pointer rounded-full border border-[var(--border)] px-3 py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                      ↓
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        removeVariantImage(
                                          variantIndex,
                                          imageIndex
                                        )
                                      }
                                      className="cursor-pointer rounded-full border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                                    >
                                      {
                                        t.remove
                                      }
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </section>
        </div>

        <section className="sticky bottom-4 z-20 mt-8 rounded-3xl border border-[var(--border)] bg-[var(--surface)]/95 p-4 shadow-2xl backdrop-blur sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-h-12 flex-1">
              {saveState ===
              "saving" ? (
                <div className="flex items-center gap-3 text-sm font-bold text-[var(--brand-strong)]">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--brand-soft)] border-t-[var(--brand)]" />

                  <span>
                    {t.saving}
                  </span>
                </div>
              ) : saveState ===
                "saved" ? (
                <div className="inline-flex items-center gap-2 rounded-full bg-[var(--brand-soft)] px-4 py-2 text-sm font-bold text-[var(--brand-strong)]">
                  <span aria-hidden="true">
                    ✓
                  </span>

                  <span>
                    {t.saved}
                  </span>
                </div>
              ) : saveState ===
                "error" ? (
                <div className="max-w-xl rounded-2xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600">
                  {error}
                </div>
              ) : (
                <p className="text-sm text-[var(--text-secondary)]">
                  {mode ===
                  "create"
                    ? t.create
                    : t.editTitle}
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              {mode ===
                "edit" && (
                <button
                  type="button"
                  onClick={
                    deleteProduct
                  }
                  disabled={
                    deleting ||
                    saving
                  }
                  className="cursor-pointer rounded-full border border-red-300 px-5 py-3 text-sm font-bold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {deleting
                    ? t.deleting
                    : t.delete}
                </button>
              )}

              <button
                type="button"
                onClick={() =>
                  router.push(
                    "/admin/products"
                  )
                }
                disabled={
                  saving ||
                  deleting
                }
                className="cursor-pointer rounded-full border border-[var(--border)] px-5 py-3 text-sm font-bold transition hover:bg-[var(--surface-soft)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {t.cancel}
              </button>

              <button
                type="button"
                onClick={
                  saveProduct
                }
                disabled={saving}
                className={`inline-flex min-w-[150px] cursor-pointer items-center justify-center gap-2 rounded-full px-7 py-3 text-sm font-black text-white shadow-sm transition ${
                  saving
                    ? "cursor-not-allowed bg-[var(--border)]"
                    : saveState ===
                        "saved"
                      ? "cursor-pointer bg-[var(--brand-strong)] hover:-translate-y-0.5 hover:opacity-90"
                      : "cursor-pointer bg-[var(--brand)] hover:-translate-y-0.5 hover:opacity-90"
                }`}
              >
                {saving ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />

                    <span>
                      {t.saving}
                    </span>
                  </>
                ) : saveState ===
                  "saved" ? (
                  <>
                    <span
                      aria-hidden="true"
                      className="text-base"
                    >
                      ✓
                    </span>

                    <span>
                      {t.saved}
                    </span>
                  </>
                ) : (
                  <span>
                    {t.save}
                  </span>
                )}
              </button>
            </div>
          </div>
        </section>
      </div>

      {previewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-3xl bg-[var(--surface)] p-5 shadow-2xl sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-2xl font-black">
                {t.preview}
              </h2>

              <button
                type="button"
                onClick={() =>
                  setPreviewOpen(
                    false
                  )
                }
                className="cursor-pointer rounded-full border border-[var(--border)] px-4 py-2 text-sm font-bold hover:bg-[var(--surface-soft)]"
              >
                {t.close}
              </button>
            </div>

            <div className="mt-8 grid gap-8 lg:grid-cols-2">
              <div className="relative aspect-square overflow-hidden rounded-3xl bg-[var(--surface-soft)]">
                {form.masterImage &&
                getImageSrc(
                  form.masterImage
                ) ? (
                  <Image
                    src={
                      form.masterImage
                    }
                    alt={
                      form.name[
                        language
                      ]
                    }
                    fill
                    className="object-cover"
                    sizes="600px"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-8xl">
                    {
                      form.emoji
                    }
                  </div>
                )}
              </div>

              <div className="flex flex-col justify-center">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--brand)]">
                    {
                      form.category
                    }
                  </p>

                  {!productEffectiveInStock && (
                    <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">
                      {
                        t.previewOutOfStock
                      }
                    </span>
                  )}

                  {productNumericStock !==
                    null &&
                    productEffectiveInStock && (
                      <span className="rounded-full bg-[var(--surface-soft)] px-3 py-1 text-xs font-bold text-[var(--text-secondary)]">
                        {
                          productNumericStock
                        }{" "}
                        {
                          t.onlyLeft
                        }
                      </span>
                    )}

                  {!form.active && (
                    <span className="rounded-full bg-[var(--surface-soft)] px-3 py-1 text-xs font-bold text-[var(--text-secondary)]">
                      {
                        t.inactive
                      }
                    </span>
                  )}
                </div>

                <h3 className="mt-3 text-4xl font-black">
                  {
                    form.name[
                      language
                    ]
                  }
                </h3>

                <p className="mt-5 leading-7 text-[var(--text-secondary)]">
                  {
                    form
                      .description[
                      language
                    ]
                  }
                </p>

                <div className="mt-6">
                  {form.discount &&
                  isDiscountActive(
                    form.discount
                  ) ? (
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-3xl font-black text-[var(--brand-strong)]">
                        €
                        {form.discount.price.toFixed(
                          2
                        )}
                      </span>

                      <span className="text-lg font-bold text-[var(--text-secondary)] line-through">
                        €
                        {form.price.toFixed(
                          2
                        )}
                      </span>

                      <span className="rounded-full bg-[var(--brand-soft)] px-3 py-1 text-xs font-black text-[var(--brand-strong)]">
                        -
                        {
                          form.discount
                            .percentage
                        }
                        %
                      </span>
                    </div>
                  ) : (
                    <p className="text-3xl font-black text-[var(--brand-strong)]">
                      €{Number(
                        form.price
                      ).toFixed(2)}
                    </p>
                  )}
                </div>

                {form.variants.filter(
                  (
                    variant
                  ) =>
                    variant.active
                ).length > 0 && (
                  <div className="mt-6">
                    <p className="mb-3 text-sm font-black">
                      {
                        t.colors
                      }
                    </p>

                    <div className="flex flex-wrap gap-2">
                      {form.variants
                        .filter(
                          (
                            variant
                          ) =>
                            variant.active
                        )
                        .map(
                          (
                            variant,
                            index
                          ) => {
                            const effective =
                              isVariantAvailable(
                                variant
                              );

                            const colorPrice =
                              getEffectiveColorPrice(
                                variant,
                                form.price
                              );

                            const colorDiscount =
                              variant.price !==
                                null &&
                              variant.discount &&
                              isDiscountActive(
                                variant.discount
                              )
                                ? variant.discount
                                : null;

                            return (
                              <div
                                key={
                                  variant.id ??
                                  index
                                }
                                className={`rounded-2xl border px-4 py-3 ${
                                  effective
                                    ? "border-[var(--brand-soft)] bg-[var(--brand-soft)]"
                                    : "border-red-200 bg-red-50"
                                }`}
                              >
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-semibold">
                                    {
                                      variant
                                        .color[
                                        language
                                      ]
                                    }
                                  </span>

                                  {colorDiscount ? (
                                    <>
                                      <span className="font-black">
                                        €
                                        {colorDiscount.price.toFixed(
                                          2
                                        )}
                                      </span>

                                      <span className="text-xs font-bold line-through text-[var(--text-secondary)]">
                                        €
                                        {colorPrice.toFixed(
                                          2
                                        )}
                                      </span>

                                      <span className="text-xs font-black text-[var(--brand-strong)]">
                                        -
                                        {
                                          colorDiscount.percentage
                                        }
                                        %
                                      </span>
                                    </>
                                  ) : (
                                    <span className="font-black">
                                      €
                                      {colorPrice.toFixed(
                                        2
                                      )}
                                    </span>
                                  )}

                                  {!effective && (
                                    <span className="text-xs font-bold text-red-700">
                                      ·{" "}
                                      {
                                        t.previewOutOfStock
                                      }
                                    </span>
                                  )}

                                  {effective &&
                                    variant.stock !==
                                      null && (
                                    <span className="text-xs font-bold text-[var(--text-secondary)]">
                                      ·{" "}
                                      {
                                        variant.stock
                                      }{" "}
                                      {
                                        t.onlyLeft
                                      }
                                    </span>
                                  )}
                                </div>

                                {variant.sizes.length >
                                  0 && (
                                  <div className="mt-2 text-xs text-[var(--text-secondary)]">
                                    {t.sizes}:{" "}
                                    {variant.sizes
                                      .map(
                                        (
                                          size
                                        ) => {
                                          const sizePrice =
                                            size.price !==
                                              null &&
                                            Number.isFinite(
                                              size.price
                                            )
                                              ? size.price
                                              : colorPrice;

                                          const sizeDiscount =
                                            size.price !==
                                              null &&
                                            size.discount &&
                                            isDiscountActive(
                                              size.discount
                                            )
                                              ? size.discount
                                              : null;

                                          if (
                                            sizeDiscount
                                          ) {
                                            return `${getSizeLabel(
                                              size.key,
                                              t
                                            )} €${sizeDiscount.price.toFixed(
                                              2
                                            )} (-${sizeDiscount.percentage}%)`;
                                          }

                                          return `${getSizeLabel(
                                            size.key,
                                            t
                                          )} €${sizePrice.toFixed(
                                            2
                                          )}`;
                                        }
                                      )
                                      .join(
                                        " · "
                                      )}
                                  </div>
                                )}

                                {variant.customFields
                                  .length >
                                  0 && (
                                  <div className="mt-1 text-xs text-[var(--text-secondary)]">
                                    {
                                      variant
                                        .customFields
                                        .length
                                    }{" "}
                                    {t.customFields.toLowerCase()}
                                  </div>
                                )}
                              </div>
                            );
                          }
                        )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}