"use client";

import Link from "next/link";
import { FormEvent, Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import {
  useLanguage,
  type Language,
} from "@/components/LanguageProvider";
import { translations } from "@/data/translations";
import { useSession } from "@/lib/auth-client";

type Message = {
  id: number;
  sender: "bot" | "user";
  text: string;
};

type IssueKey =
  | "order"
  | "payment"
  | "shipping"
  | "product"
  | "account"
  | "other";

function getBotAnswer(
  question: string,
  t: (typeof translations)[Language]["help"]
) {
  const normalized = question.toLowerCase();

  if (
    normalized.includes("order") ||
    normalized.includes("bestellung") ||
    normalized.includes("Ø·Ù„Ø¨") ||
    normalized.includes("Ø·Ù„Ø¨ÙŠ") ||
    normalized.includes("commande")
  ) {
    return t.botOrder;
  }

  if (
    normalized.includes("payment") ||
    normalized.includes("zahlung") ||
    normalized.includes("Ø§Ù„Ø¯ÙØ¹") ||
    normalized.includes("Ø¯ÙØ¹")
  ) {
    return t.botPayment;
  }

  if (
    normalized.includes("shipping") ||
    normalized.includes("delivery") ||
    normalized.includes("versand") ||
    normalized.includes("liefer") ||
    normalized.includes("Ø§Ù„Ø´ØÙ†") ||
    normalized.includes("Ø§Ù„ØªÙˆØµÙŠÙ„")
  ) {
    return t.botShipping;
  }

  if (
    normalized.includes("cancel") ||
    normalized.includes("storn") ||
    normalized.includes("Ø¥Ù„ØºØ§Ø¡") ||
    normalized.includes("Ø§Ù„ØºØ§Ø¡")
  ) {
    return t.botCancel;
  }

  if (
    normalized.includes("product") ||
    normalized.includes("produkt") ||
    normalized.includes("Ù…Ù†ØªØ¬") ||
    normalized.includes("Ø§Ù„Ù…Ù†ØªØ¬")
  ) {
    return t.botProduct;
  }

  if (
    normalized.includes("account") ||
    normalized.includes("konto") ||
    normalized.includes("ØØ³Ø§Ø¨") ||
    normalized.includes("Ø§Ù„ØØ³Ø§Ø¨")
  ) {
    return t.botAccount;
  }

  if (
    normalized.includes("support") ||
    normalized.includes("contact") ||
    normalized.includes("kontakt") ||
    normalized.includes("Ø¯Ø¹Ù…") ||
    normalized.includes("ØªÙˆØ§ØµÙ„")
  ) {
    return t.botContact;
  }

  return t.botFallback;
}

function HelpPageContent() {
  const { language } = useLanguage();
  const { data: session } = useSession();
  const searchParams = useSearchParams();

  const t = translations[language].help;

  const initialOrderNumber =
    searchParams.get("order")?.trim() || "";

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      sender: "bot",
      text: t.assistantWelcome,
    },
  ]);

  const [question, setQuestion] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const [orderNumber, setOrderNumber] = useState(
    initialOrderNumber
  );

  const [issue, setIssue] = useState<IssueKey | "">(
    initialOrderNumber ? "order" : ""
  );

  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const direction = language === "ar" ? "rtl" : "ltr";

  const issueOptions = useMemo(
    () => [
      {
        value: "order" as const,
        label: t.issueOrder,
      },
      {
        value: "payment" as const,
        label: t.issuePayment,
      },
      {
        value: "shipping" as const,
        label: t.issueShipping,
      },
      {
        value: "product" as const,
        label: t.issueProduct,
      },
      {
        value: "account" as const,
        label: t.issueAccount,
      },
      {
        value: "other" as const,
        label: t.issueOther,
      },
    ],
    [t]
  );

  const displayName = session?.user
    ? session.user.name?.trim() || name
    : name;

  const displayEmail = session?.user
    ? session.user.email?.trim().toLowerCase() || email
    : email;

  function askQuestion(text: string) {
    const trimmed = text.trim();

    if (!trimmed) {
      return;
    }

    setMessages((current) => {
      const userMessageId = current.length + 1;
      const botMessageId = current.length + 2;

      return [
        ...current,
        {
          id: userMessageId,
          sender: "user",
          text: trimmed,
        },
        {
          id: botMessageId,
          sender: "bot",
          text: getBotAnswer(trimmed, t),
        },
      ];
    });

    setQuestion("");
  }

  function handleQuestionSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    askQuestion(question);
  }

  function handleSuggestion(
    text: string,
    issueKey?: IssueKey
  ) {
    askQuestion(text);

    if (issueKey) {
      setIssue(issueKey);
    }
  }

  function scrollToContact() {
    document
      .getElementById("contact-support")
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSent(false);

    const trimmedName = displayName.trim();
    const trimmedEmail = displayEmail
      .trim()
      .toLowerCase();
    const trimmedMessage = message.trim();
    const trimmedOrderNumber = orderNumber.trim();

    if (!trimmedName) {
      setError(t.requiredName);
      return;
    }

    if (
      !trimmedEmail ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        trimmedEmail
      )
    ) {
      setError(t.requiredEmail);
      return;
    }

    if (!issue) {
      setError(t.requiredIssue);
      return;
    }

    if (!trimmedMessage) {
      setError(t.requiredMessage);
      return;
    }

    setSending(true);

    try {
      const response = await fetch("/api/support", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: trimmedName,
          email: trimmedEmail,
          orderNumber: trimmedOrderNumber,
          issue,
          message: trimmedMessage,
          language,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || t.messageError
        );
      }

      setSent(true);
      setMessage("");

      if (!session?.user) {
        setName("");
        setEmail("");
      }

      setOrderNumber("");
      setIssue("");
    } catch {
      setError(t.messageError);
    } finally {
      setSending(false);
    }
  }

  return (
    <main
      dir={direction}
      className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14"
    >
      {/* HEADER */}
      <section className="mx-auto max-w-3xl text-center">
        <span className="inline-flex rounded-full bg-[var(--brand-soft)] px-4 py-2 text-sm font-bold text-[var(--brand-strong)]">
          {t.label}
        </span>

        <h1 className="mt-5 text-3xl font-black tracking-tight text-[var(--text-primary)] sm:text-5xl">
          {t.title}
        </h1>

        <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-[var(--text-secondary)] sm:text-lg">
          {t.subtitle}
        </p>
      </section>

      {/* MAIN CONTENT */}
      <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_420px] lg:items-start">
        {/* CHATBOT */}
        <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm sm:p-7">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--brand-soft)] text-2xl">
              🤖
            </div>

            <div className="min-w-0">
              <h2 className="text-xl font-black text-[var(--text-primary)]">
                {t.assistantTitle}
              </h2>

              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                {t.assistantSubtitle}
              </p>
            </div>
          </div>

          {/* CHAT */}
          <div className="mt-6 h-[390px] overflow-y-auto rounded-2xl bg-[var(--surface-soft)] p-4">
            <div className="space-y-4">
              {messages.map((item) => (
                <div
                  key={item.id}
                  className={[
                    "flex",
                    item.sender === "user"
                      ? "justify-end"
                      : "justify-start",
                  ].join(" ")}
                >
                  <div
                    className={[
                      "max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-6",
                      item.sender === "user"
                        ? "rounded-br-md bg-[var(--brand)] text-white"
                        : "rounded-bl-md border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)]",
                    ].join(" ")}
                  >
                    {item.text}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* QUICK QUESTIONS */}
          <div className="mt-5">
            <p className="mb-3 text-sm font-bold text-[var(--text-primary)]">
              {t.suggestionsTitle}
            </p>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  handleSuggestion(
                    t.orderQuestion,
                    "order"
                  )
                }
                className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] transition hover:border-[var(--brand)] hover:bg-[var(--brand-soft)] hover:text-[var(--brand-strong)]"
              >
                {t.orderQuestion}
              </button>

              <button
                type="button"
                onClick={() =>
                  handleSuggestion(
                    t.paymentQuestion,
                    "payment"
                  )
                }
                className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] transition hover:border-[var(--brand)] hover:bg-[var(--brand-soft)] hover:text-[var(--brand-strong)]"
              >
                {t.paymentQuestion}
              </button>

              <button
                type="button"
                onClick={() =>
                  handleSuggestion(
                    t.shippingQuestion,
                    "shipping"
                  )
                }
                className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] transition hover:border-[var(--brand)] hover:bg-[var(--brand-soft)] hover:text-[var(--brand-strong)]"
              >
                {t.shippingQuestion}
              </button>

              <button
                type="button"
                onClick={() =>
                  handleSuggestion(
                    t.cancelQuestion,
                    "order"
                  )
                }
                className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] transition hover:border-[var(--brand)] hover:bg-[var(--brand-soft)] hover:text-[var(--brand-strong)]"
              >
                {t.cancelQuestion}
              </button>

              <button
                type="button"
                onClick={() =>
                  handleSuggestion(
                    t.contactQuestion,
                    "other"
                  )
                }
                className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] transition hover:border-[var(--brand)] hover:bg-[var(--brand-soft)] hover:text-[var(--brand-strong)]"
              >
                {t.contactQuestion}
              </button>
            </div>
          </div>

          {/* CHAT INPUT */}
          <form
            onSubmit={handleQuestionSubmit}
            className="mt-5 flex flex-col gap-2 sm:flex-row"
          >
            <input
              value={question}
              onChange={(event) =>
                setQuestion(event.target.value)
              }
              placeholder={t.assistantPlaceholder}
              className="min-w-0 flex-1 rounded-full border border-[var(--border)] bg-[var(--surface)] px-5 py-3 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-secondary)] focus:border-[var(--brand)]"
            />

            <button
              type="submit"
              disabled={!question.trim()}
              className="rounded-full bg-[var(--brand)] px-6 py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t.send}
            </button>
          </form>

          <button
            type="button"
            onClick={scrollToContact}
            className="mt-4 w-full rounded-full border border-[var(--brand)] px-5 py-3 text-sm font-bold text-[var(--brand-strong)] transition hover:bg-[var(--brand-soft)]"
          >
            {t.contactSupport}
          </button>
        </section>

        {/* QUICK LINKS */}
        <aside className="space-y-4">
          <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm sm:p-7">
            <h2 className="text-xl font-black text-[var(--text-primary)]">
              {t.contactSupport}
            </h2>

            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
              {t.contactSubtitle}
            </p>

            <div className="mt-5 grid gap-3">
              <button
                type="button"
                onClick={scrollToContact}
                className="rounded-2xl bg-[var(--brand)] px-5 py-3.5 text-sm font-bold text-white transition hover:opacity-90"
              >
                {t.contactSupport}
              </button>

              <Link
                href="/account/orders"
                className="rounded-2xl border border-[var(--border)] px-5 py-3.5 text-center text-sm font-bold text-[var(--text-primary)] transition hover:bg-[var(--surface-soft)]"
              >
                {t.viewOrders}
              </Link>

              <Link
                href="/shop"
                className="rounded-2xl border border-[var(--border)] px-5 py-3.5 text-center text-sm font-bold text-[var(--text-primary)] transition hover:bg-[var(--surface-soft)]"
              >
                {t.shopNow}
              </Link>
            </div>
          </div>
        </aside>
      </div>

      {/* CONTACT FORM */}
      <section
        id="contact-support"
        className="mt-8 scroll-mt-24 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm sm:p-8"
      >
        <div className="max-w-3xl">
          <h2 className="text-2xl font-black text-[var(--text-primary)] sm:text-3xl">
            {t.contactTitle}
          </h2>

          <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)] sm:text-base">
            {t.contactSubtitle}
          </p>
        </div>

        <div className="mt-6 rounded-2xl bg-[var(--surface-soft)] p-4 text-sm leading-6 text-[var(--text-secondary)]">
          {session?.user
            ? t.loggedInNotice
            : t.guestNotice}
        </div>

        {sent && (
          <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 px-4 py-4 text-sm font-semibold text-green-800 dark:border-green-900/40 dark:bg-green-950/30 dark:text-green-300">
            {t.messageSent}
          </div>
        )}

        {error && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm font-semibold text-red-800 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="mt-6 grid gap-5 md:grid-cols-2"
        >
          {/* NAME */}
          <div>
            <label
              htmlFor="support-name"
              className="mb-2 block text-sm font-bold text-[var(--text-primary)]"
            >
              {t.name}
            </label>

            <input
              id="support-name"
              type="text"
              value={displayName}
              onChange={(event) =>
                setName(event.target.value)
              }
              disabled={!!session?.user}
              autoComplete="name"
              className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-secondary)] focus:border-[var(--brand)] disabled:cursor-not-allowed disabled:opacity-70"
            />
          </div>

          {/* EMAIL */}
          <div>
            <label
              htmlFor="support-email"
              className="mb-2 block text-sm font-bold text-[var(--text-primary)]"
            >
              {t.email}
            </label>

            <input
              id="support-email"
              type="email"
              value={displayEmail}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              disabled={!!session?.user}
              autoComplete="email"
              className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-secondary)] focus:border-[var(--brand)] disabled:cursor-not-allowed disabled:opacity-70"
            />
          </div>

          {/* ORDER */}
          <div>
            <label
              htmlFor="support-order"
              className="mb-2 flex items-center gap-2 text-sm font-bold text-[var(--text-primary)]"
            >
              <span>{t.orderNumber}</span>

              <span className="font-normal text-[var(--text-secondary)]">
                ({t.orderNumberOptional})
              </span>
            </label>

            <input
              id="support-order"
              type="text"
              value={orderNumber}
              onChange={(event) =>
                setOrderNumber(event.target.value)
              }
              placeholder="JG-123456"
              className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-secondary)] focus:border-[var(--brand)]"
            />
          </div>

          {/* ISSUE */}
          <div>
            <label
              htmlFor="support-issue"
              className="mb-2 block text-sm font-bold text-[var(--text-primary)]"
            >
              {t.issue}
            </label>

            <select
              id="support-issue"
              value={issue}
              onChange={(event) =>
                setIssue(
                  event.target.value as
                    | IssueKey
                    | ""
                )
              }
              className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--brand)]"
            >
              <option value="">
                {t.selectIssue}
              </option>

              {issueOptions.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* MESSAGE */}
          <div className="md:col-span-2">
            <label
              htmlFor="support-message"
              className="mb-2 block text-sm font-bold text-[var(--text-primary)]"
            >
              {t.message}
            </label>

            <textarea
              id="support-message"
              value={message}
              onChange={(event) =>
                setMessage(event.target.value)
              }
              placeholder={t.messagePlaceholder}
              rows={7}
              className="w-full resize-y rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm leading-6 text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-secondary)] focus:border-[var(--brand)]"
            />
          </div>

          {/* SUBMIT */}
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={sending}
              className="w-full rounded-full bg-[var(--brand)] px-6 py-3.5 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:min-w-48"
            >
              {sending
                ? t.sending
                : t.sendMessage}
            </button>
          </div>
        </form>

        <p className="mt-5 text-xs text-[var(--text-secondary)]">
          {t.sentFrom}
        </p>
      </section>
    </main>
  );
}

export default function HelpPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mx-auto h-6 w-32 animate-pulse rounded-full bg-[var(--surface-soft)]" />
            <div className="mx-auto mt-5 h-12 max-w-xl animate-pulse rounded-2xl bg-[var(--surface-soft)]" />
            <div className="mx-auto mt-4 h-6 max-w-2xl animate-pulse rounded-2xl bg-[var(--surface-soft)]" />
          </div>
        </main>
      }
    >
      <HelpPageContent />
    </Suspense>
  );
}