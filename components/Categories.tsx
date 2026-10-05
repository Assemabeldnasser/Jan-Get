"use client";

import { useRouter } from "next/navigation";
import { useLanguage } from "./LanguageProvider";
import { translations } from "@/data/translations";

const categories = [
  { key: "all", name: "All", emoji: "🛍️" },
  { key: "kids", name: "Kids & Play", emoji: "🧸" },
  { key: "home", name: "Home & Living", emoji: "🏠" },
  { key: "decor", name: "Decor", emoji: "🪴" },
  { key: "gifts", name: "Gifts", emoji: "🎁" },
  { key: "desk", name: "Desk & Office", emoji: "🖥️" },
  { key: "accessories", name: "Accessories", emoji: "👜" },
  { key: "collectibles", name: "Collectibles", emoji: "🏆" },
  { key: "personalized", name: "Personalized", emoji: "✏️" },
];

export default function Categories() {
  const router = useRouter();
  const { language } = useLanguage();

  const t = translations[language].categories;

  const activeCategory = "All";

  const categoryLabels = {
    all: t.all,
    kids: t.kids,
    home: t.home,
    decor: t.decor,
    gifts: t.gifts,
    desk: t.desk,
    accessories: t.accessories,
    collectibles: t.collectibles,
    personalized: t.personalized,
  };

  const handleCategoryClick = (category: string) => {
    if (category === "All") {
      router.push("/shop");
      return;
    }

    router.push(
      `/shop?category=${encodeURIComponent(category)}`
    );
  };

  return (
    <section
      id="categories"
      className="px-4 py-14 sm:px-6 sm:py-20"
    >
      <div className="mx-auto max-w-7xl">
        {/* Heading */}
        <div className="mb-8 max-w-2xl sm:mb-10">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand)] sm:text-sm">
            {t.explore}
          </p>

          <h2 className="mt-2 text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl lg:text-4xl">
            {t.title}
          </h2>

          <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)] sm:text-base sm:leading-7">
            {t.subtitle}
          </p>
        </div>

        {/* Categories */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8">
          {categories.map((category) => {
            const isActive = activeCategory === category.name;

            return (
              <button
                key={category.key}
                type="button"
                onClick={() =>
                  handleCategoryClick(category.name)
                }
                className={`group cursor-pointer rounded-3xl border p-5 text-center shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-md sm:p-6 ${
                  isActive
                    ? "border-[var(--brand)] bg-[var(--brand-soft)]"
                    : "border-transparent bg-[var(--surface)] hover:border-[var(--brand-soft)]"
                }`}
              >
                <div className="text-4xl transition-transform duration-200 group-hover:scale-110 sm:text-5xl">
                  {category.emoji}
                </div>

                <p
                  className={`mt-3 text-sm font-semibold sm:mt-4 sm:text-base ${
                    isActive
                      ? "text-[var(--brand-strong)]"
                      : "text-[var(--text-primary)]"
                  }`}
                >
                  {
                    categoryLabels[
                      category.key as keyof typeof categoryLabels
                    ]
                  }
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}