"use client";

import Categories from "@/components/Categories";
import Hero from "@/components/Hero";
import Products from "@/components/Products";
import { useLanguage } from "@/components/LanguageProvider";
import { translations } from "@/data/translations";

export default function Home() {
  const { language } = useLanguage();

  const t = translations[language].about;

  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--text-primary)]">
      <Hero />

      <Categories />

      <Products />

      {/* About */}
      <section
        id="about"
        className="px-4 py-16 sm:px-6 sm:py-20 lg:py-24"
      >
        <div className="mx-auto max-w-5xl">
          <div className="rounded-[2rem] border bg-[var(--surface)] px-6 py-12 shadow-sm sm:rounded-[2.5rem] sm:px-10 sm:py-16 lg:px-16">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand)] sm:text-sm">
                {t.label}
              </p>

              <h2 className="mt-3 text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl lg:text-4xl">
                {t.title}
              </h2>

              <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-[var(--text-secondary)] sm:text-base sm:leading-8">
                {t.description}
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}