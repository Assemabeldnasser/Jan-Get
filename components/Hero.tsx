"use client";

import HeroCarousel from "./HeroCarousel";
import { useLanguage } from "./LanguageProvider";
import { translations } from "@/data/translations";

export default function Hero() {
  const { language } = useLanguage();
  const t = translations[language].hero;

  return (
    <section className="px-4 pb-14 pt-10 sm:px-6 sm:pb-20 sm:pt-14 lg:pb-24 lg:pt-20">
      <div className="mx-auto grid max-w-7xl items-center gap-10 md:grid-cols-2 md:gap-12 lg:gap-16">
        {/* Text */}
        <div className="max-w-xl">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand)] sm:text-sm sm:tracking-[0.2em]">
            {t.badge}
          </p>

          <h1 className="text-4xl font-black leading-[1.08] tracking-tight text-[var(--text-primary)] sm:text-5xl md:text-6xl lg:text-[4.2rem]">
            {t.title}
          </h1>

          <p className="mt-5 max-w-lg text-base leading-7 text-[var(--text-secondary)] sm:mt-6 sm:text-lg sm:leading-8">
            {t.description}
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:mt-8 sm:flex-row">
            <a
              href="#shop"
              className="rounded-full bg-[var(--brand)] px-7 py-3.5 text-center text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:opacity-90 sm:text-base"
            >
              {t.button}
            </a>

            <a
              href="#categories"
              className="rounded-full border border-[var(--brand-soft)] bg-[var(--surface)] px-7 py-3.5 text-center text-sm font-semibold text-[var(--brand-strong)] transition hover:-translate-y-0.5 hover:bg-[var(--surface-soft)] sm:text-base"
            >
              {t.secondaryButton}
            </a>
          </div>
        </div>

        {/* Visual */}
        <div className="w-full">
          <HeroCarousel />
        </div>
      </div>
    </section>
  );
}