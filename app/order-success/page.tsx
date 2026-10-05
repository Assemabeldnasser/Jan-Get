import { Suspense } from "react";

import OrderSuccessContent from "./OrderSuccessContent";

export default function OrderSuccessPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4 text-[var(--text-primary)]">
          <p className="text-sm text-[var(--text-secondary)]">
            Loading...
          </p>
        </main>
      }
    >
      <OrderSuccessContent />
    </Suspense>
  );
}