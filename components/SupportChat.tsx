"use client";

import { useState } from "react";

type Message = {
  id: number;
  sender: "bot" | "user";
  text: string;
};

const quickQuestions = [
  {
    label: "Shipping",
    answer:
      "We currently ship within Germany only. Shipping costs €3 for orders below €50 and is free for orders of €50 or more.",
  },
  {
    label: "Free shipping",
    answer:
      "Free shipping starts at €50.00.",
  },
  {
    label: "Payment",
    answer:
      "Secure online payment will be available during checkout.",
  },
  {
    label: "Returns",
    answer:
      "If you need help with a return, please send us your name, email and message and our support team will help you.",
  },
  {
    label: "Account",
    answer:
      "You can create an account with your name, email, phone and German delivery address. Email verification is required before login.",
  },
];

export default function SupportChat() {
  const [open, setOpen] = useState(false);

  const [messages, setMessages] =
    useState<Message[]>([
      {
        id: 1,
        sender: "bot",
        text:
          "Hi! 👋 I'm the JAN-GET support assistant. How can I help you?",
      },
    ]);

  const [showContact, setShowContact] =
    useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] =
    useState("");

  const [sending, setSending] =
    useState(false);

  const [sent, setSent] =
    useState(false);

  const askQuestion = (
    question: (typeof quickQuestions)[number]
  ) => {
    setMessages((current) => [
      ...current,
      {
        id: Date.now(),
        sender: "user",
        text: question.label,
      },
      {
        id: Date.now() + 1,
        sender: "bot",
        text: question.answer,
      },
    ]);
  };

  const sendMessage = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (
      !name.trim() ||
      !email.trim() ||
      !message.trim()
    ) {
      return;
    }

    setSending(true);

    try {
      const response = await fetch(
        "/api/support",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: name.trim(),
            email: email.trim(),
            message: message.trim(),
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          "Unable to send message."
        );
      }

      setSent(true);
      setMessage("");
    } catch {
      alert(
        "We could not send your message. Please try again."
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {open && (
        <div className="fixed bottom-24 right-4 z-50 w-[min(380px,calc(100vw-2rem))] overflow-hidden rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] shadow-2xl">
          <div className="flex items-center justify-between bg-[var(--brand)] px-5 py-4 text-white">
            <div>
              <p className="font-bold">
                JAN-GET Support
              </p>

              <p className="text-xs text-white/80">
                We are here to help
              </p>
            </div>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-xl hover:bg-white/25"
              aria-label="Close support chat"
            >
              ×
            </button>
          </div>

          <div className="max-h-[420px] overflow-y-auto p-4">
            <div className="space-y-3">
              {messages.map((item) => (
                <div
                  key={item.id}
                  className={`flex ${
                    item.sender === "user"
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                      item.sender === "user"
                        ? "bg-[var(--brand)] text-white"
                        : "bg-[var(--surface-soft)] text-[var(--text-primary)]"
                    }`}
                  >
                    {item.text}
                  </div>
                </div>
              ))}
            </div>

            {!showContact && !sent && (
              <>
                <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  Quick help
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {quickQuestions.map(
                    (question) => (
                      <button
                        key={question.label}
                        type="button"
                        onClick={() =>
                          askQuestion(question)
                        }
                        className="rounded-full border border-[var(--brand-soft)] px-3 py-2 text-xs font-semibold text-[var(--brand-strong)] transition hover:bg-[var(--brand-soft)]"
                      >
                        {question.label}
                      </button>
                    )
                  )}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setShowContact(true)
                  }
                  className="mt-5 w-full rounded-full bg-[var(--brand-soft)] px-4 py-3 text-sm font-bold text-[var(--brand-strong)] transition hover:opacity-80"
                >
                  I need more help
                </button>
              </>
            )}

            {showContact && !sent && (
              <form
                onSubmit={sendMessage}
                className="mt-5 space-y-3"
              >
                <p className="text-sm font-bold">
                  Send us a message
                </p>

                <input
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                  placeholder="Your name"
                  required
                  className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm outline-none focus:border-[var(--brand)]"
                />

                <input
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  placeholder="Your email"
                  required
                  className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm outline-none focus:border-[var(--brand)]"
                />

                <textarea
                  value={message}
                  onChange={(event) =>
                    setMessage(event.target.value)
                  }
                  placeholder="How can we help?"
                  required
                  rows={4}
                  className="w-full resize-none rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm outline-none focus:border-[var(--brand)]"
                />

                <button
                  type="submit"
                  disabled={sending}
                  className="w-full rounded-full bg-[var(--brand)] px-4 py-3 text-sm font-bold text-white disabled:opacity-60"
                >
                  {sending
                    ? "Sending..."
                    : "Send message"}
                </button>
              </form>
            )}

            {sent && (
              <div className="mt-5 rounded-2xl bg-[var(--brand-soft)] p-4 text-sm leading-6 text-[var(--brand-strong)]">
                Thank you! Your message has been sent.
                Our support team will get back to you by
                email.
              </div>
            )}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-label="Open support chat"
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--brand)] text-2xl text-white shadow-xl transition hover:-translate-y-1 hover:opacity-90"
      >
        {open ? "×" : "💬"}
      </button>
    </>
  );
}