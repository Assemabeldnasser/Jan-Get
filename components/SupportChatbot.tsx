"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import {
  useLanguage,
  type Language,
} from "@/components/LanguageProvider";
import { translations } from "@/data/translations";

type Message = {
  id: number;
  sender: "bot" | "user";
  text: string;
};

type Props = {
  onContactSupport?: () => void;
};

function getBotAnswer(
  message: string,
  language: Language,
  t: (typeof translations)[Language]["help"]
) {
  const text = message.trim().toLowerCase();

  const englishWords = [
    "order",
    "where",
    "track",
    "tracking",
    "status",
    "delivery",
  ];

  const germanWords = [
    "bestellung",
    "bestell",
    "wo ist",
    "status",
    "lieferung",
    "sendung",
  ];

  const arabicWords = [
    "Ø·Ù„Ø¨",
    "Ø·Ù„Ø¨ÙŠ",
    "Ø§Ù„Ø·Ù„Ø¨",
    "ØªØªØ¨Ø¹",
    "Ø§Ù„Ø´ØÙ†Ø©",
    "Ø§Ù„ØªÙˆØµÙŠÙ„",
    "Ø§ÙŠÙ†",
    "Ø£ÙŠÙ†",
  ];

  if (
    [...englishWords, ...germanWords, ...arabicWords].some(
      (word) => text.includes(word)
    )
  ) {
    return t.botOrder;
  }

  const paymentWords = [
    "payment",
    "pay",
    "paid",
    "payment problem",
    "zahlung",
    "bezahlen",
    "bezahlt",
    "Ø§Ù„Ø¯ÙØ¹",
    "Ø§Ø¯ÙØ¹",
    "Ø¯ÙØ¹Øª",
    "Ù…Ø´ÙƒÙ„Ø© ÙÙŠ Ø§Ù„Ø¯ÙØ¹",
  ];

  if (
    paymentWords.some((word) => text.includes(word))
  ) {
    return t.botPayment;
  }

  const shippingWords = [
    "shipping",
    "ship",
    "delivery",
    "versand",
    "versenden",
    "lieferung",
    "schiff",
    "Ø§Ù„Ø´ØÙ†",
    "Ø´ØÙ†",
    "ØªÙˆØµÙŠÙ„",
  ];

  if (
    shippingWords.some((word) => text.includes(word))
  ) {
    return t.botShipping;
  }

  const cancelWords = [
    "cancel",
    "cancellation",
    "stornieren",
    "stornierung",
    "kÃ¼ndigen",
    "Ø¥Ù„ØºØ§Ø¡",
    "Ø§Ù„ØºØ§Ø¡",
  ];

  if (
    cancelWords.some((word) => text.includes(word))
  ) {
    return t.botCancel;
  }

  const productWords = [
    "product",
    "products",
    "shop",
    "item",
    "produkt",
    "produkte",
    "artikel",
    "Ù…Ù†ØªØ¬",
    "Ù…Ù†ØªØ¬Ø§Øª",
    "Ø§Ù„Ù…ØªØ¬Ø±",
  ];

  if (
    productWords.some((word) => text.includes(word))
  ) {
    return t.botProduct;
  }

  const accountWords = [
    "account",
    "profile",
    "konto",
    "profil",
    "ØØ³Ø§Ø¨",
    "ØØ³Ø§Ø¨ÙŠ",
    "Ø§Ù„Ù…Ù„Ù Ø§Ù„Ø´Ø®ØµÙŠ",
  ];

  if (
    accountWords.some((word) => text.includes(word))
  ) {
    return t.botAccount;
  }

  const contactWords = [
    "support",
    "contact",
    "help",
    "kontakt",
    "hilfe",
    "Ø¯Ø¹Ù…",
    "Ø§Ù„Ø¯Ø¹Ù…",
    "Ù…Ø³Ø§Ø¹Ø¯Ø©",
    "ØªÙˆØ§ØµÙ„",
  ];

  if (
    contactWords.some((word) => text.includes(word))
  ) {
    return t.botContact;
  }

  if (
    language === "ar" &&
    (text.includes("Ù…Ø±ØØ¨Ø§") ||
      text.includes("Ø§Ù„Ø³Ù„Ø§Ù…") ||
      text.includes("Ø§Ù‡Ù„Ø§") ||
      text.includes("Ø£Ù‡Ù„Ø§"))
  ) {
    return t.assistantWelcome;
  }

  if (
    text === "hi" ||
    text === "hello" ||
    text === "hey" ||
    text === "hallo" ||
    text === "hi!" ||
    text === "hello!"
  ) {
    return t.assistantWelcome;
  }

  return t.botFallback;
}

export default function SupportChatbot({
  onContactSupport,
}: Props) {
  const { language } = useLanguage();

  const t = translations[language].help;

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      sender: "bot",
      text: t.assistantWelcome,
    },
  ]);

  const [input, setInput] = useState("");

  const suggestions = useMemo(
    () => [
      t.orderQuestion,
      t.paymentQuestion,
      t.shippingQuestion,
      t.cancelQuestion,
      t.contactQuestion,
    ],
    [t]
  );

  function sendMessage(text?: string) {
    const value = (text ?? input).trim();

    if (!value) {
      return;
    }

    setMessages((current) => {
      const userMessageId = current.length + 1;
      const botMessageId = current.length + 2;

      const userMessage: Message = {
        id: userMessageId,
        sender: "user",
        text: value,
      };

      const botMessage: Message = {
        id: botMessageId,
        sender: "bot",
        text: getBotAnswer(
          value,
          language,
          t
        ),
      };

      return [
        ...current,
        userMessage,
        botMessage,
      ];
    });

    setInput("");
  }

  function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    sendMessage();
  }

  return (
    <section className="overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
      <div className="border-b border-[var(--border)] bg-[var(--surface-soft)] px-5 py-5 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--brand)] text-xl text-white">
            🤖
          </div>

          <div className="min-w-0">
            <h2 className="font-bold text-[var(--text-primary)]">
              {t.assistantTitle}
            </h2>

            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              {t.assistantSubtitle}
            </p>
          </div>
        </div>
      </div>

      <div className="max-h-[420px] min-h-[300px] space-y-4 overflow-y-auto p-5 sm:p-6">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.sender === "user"
                ? "justify-end"
                : "justify-start"
            }`}
          >
            <div
              className={[
                "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6",
                message.sender === "user"
                  ? "bg-[var(--brand)] text-white"
                  : "bg-[var(--surface-soft)] text-[var(--text-primary)]",
              ].join(" ")}
            >
              {message.text}
            </div>
          </div>
        ))}

        <div className="pt-2">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
            {t.suggestionsTitle}
          </p>

          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => sendMessage(suggestion)}
                className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-semibold text-[var(--text-primary)] transition hover:border-[var(--brand)] hover:bg-[var(--brand-soft)] hover:text-[var(--brand-strong)]"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="border-t border-[var(--border)] p-4 sm:p-5"
      >
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(event) =>
              setInput(event.target.value)
            }
            placeholder={t.assistantPlaceholder}
            className="min-w-0 flex-1 rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-secondary)] focus:border-[var(--brand)]"
            aria-label={t.assistantPlaceholder}
          />

          <button
            type="submit"
            disabled={!input.trim()}
            className="shrink-0 rounded-full bg-[var(--brand)] px-5 py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t.send}
          </button>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onContactSupport}
            className="text-sm font-semibold text-[var(--brand-strong)] transition hover:opacity-80"
          >
            💬 {t.contactSupport}
          </button>

          <Link
            href="/account/orders"
            className="text-sm font-semibold text-[var(--text-secondary)] transition hover:text-[var(--brand)]"
          >
            📦 {t.viewOrders}
          </Link>
        </div>
      </form>
    </section>
  );
}