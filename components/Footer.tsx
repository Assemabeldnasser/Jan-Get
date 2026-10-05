import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t bg-[var(--surface)] px-6 py-8">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 md:flex-row">
        <div className="font-bold text-[var(--brand)]">
          JAN-GET
        </div>

        <div className="flex flex-col items-center gap-1 text-sm text-[var(--text-muted)]">
          <p>
            © 2026 JAN-GET. Made with love.
          </p>

          <div className="flex items-center gap-5">
            <Link
              href="/policy"
              className="cursor-pointer text-[var(--text-muted)] no-underline"
            >
              Policy
            </Link>

            <Link
              href="/help"
              className="cursor-pointer text-[var(--text-muted)] no-underline"
            >
              Support
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}