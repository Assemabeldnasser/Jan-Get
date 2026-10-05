"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const images = [
  "/images/hero/hero-products-1.jpg",
  "/images/hero/hero-products-2.jpg",
  "/images/hero/hero-products-3.jpg",
  "/images/hero/hero-products-4.jpg",
  "/images/hero/hero-products-5.jpg",
  "/images/hero/hero-products-6.jpg",
  "/images/hero/hero-products-7.jpg",
  // Add more images here:
  // "/images/hero/hero-products-8.jpg",
  // "/images/hero/hero-products-9.jpg",
];

const AUTO_SLIDE_DELAY = 4000;

export default function HeroCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);

  /*
   * Automatic slide
   *
   * Important:
   * The timer depends on currentIndex.
   *
   * So:
   * 1 -> wait 4 sec -> 2
   * 2 -> wait 4 sec -> 3
   * 3 -> wait 4 sec -> 4
   * 4 -> wait 4 sec -> 5
   * 5 -> wait 4 sec -> 6
   * 6 -> wait 4 sec -> 7
   * 7 -> wait 4 sec -> 1
   */
  useEffect(() => {
    if (images.length <= 1) {
      return;
    }

    const timer = setTimeout(() => {
      setCurrentIndex((current) => {
        return current === images.length - 1 ? 0 : current + 1;
      });
    }, AUTO_SLIDE_DELAY);

    return () => clearTimeout(timer);
  }, [currentIndex]);

  /*
   * Previous image
   */
  const previousImage = () => {
    setCurrentIndex((current) => {
      if (current === 0) {
        return images.length - 1;
      }

      return current - 1;
    });
  };

  /*
   * Next image
   */
  const nextImage = () => {
    setCurrentIndex((current) => {
      if (current === images.length - 1) {
        return 0;
      }

      return current + 1;
    });
  };

  /*
   * Go directly to an image
   */
  const goToImage = (index: number) => {
    setCurrentIndex(index);
  };

  return (
    <div className="relative min-h-[280px] overflow-hidden rounded-[2rem] bg-[var(--surface-soft)] sm:min-h-[340px] sm:rounded-[2.5rem] md:min-h-[380px] md:rounded-[3rem]">
      {/* Main Image */}
      <Image
        src={images[currentIndex]}
        alt={`JAN-GET 3D printed creations - image ${currentIndex + 1}`}
        fill
        priority={currentIndex === 0}
        className="object-cover"
        sizes="(max-width: 768px) 100vw, 50vw"
      />

      {images.length > 1 && (
        <>
          {/* Previous */}
          <button
            type="button"
            onClick={previousImage}
            aria-label="Previous image"
            className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-xl text-[#7d5262] shadow-md backdrop-blur-sm transition hover:scale-105 hover:bg-white dark:bg-[#2b2025]/85 dark:text-[#f9dce7] dark:hover:bg-[#35272d]"
          >
            ←
          </button>

          {/* Next */}
          <button
            type="button"
            onClick={nextImage}
            aria-label="Next image"
            className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-xl text-[#7d5262] shadow-md backdrop-blur-sm transition hover:scale-105 hover:bg-white dark:bg-[#2b2025]/85 dark:text-[#f9dce7] dark:hover:bg-[#35272d]"
          >
            →
          </button>

          {/* Dots */}
          <div className="absolute bottom-4 left-1/2 flex max-w-[85%] -translate-x-1/2 gap-2 overflow-x-auto rounded-full bg-black/10 px-3 py-2 backdrop-blur-sm">
            {images.map((image, index) => (
              <button
                key={image}
                type="button"
                onClick={() => goToImage(index)}
                aria-label={`Go to image ${index + 1}`}
                aria-current={index === currentIndex}
                className={`h-2.5 shrink-0 rounded-full transition-all ${
                  index === currentIndex
                    ? "w-7 bg-[var(--brand)]"
                    : "w-2.5 bg-white/80 dark:bg-white/50"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}