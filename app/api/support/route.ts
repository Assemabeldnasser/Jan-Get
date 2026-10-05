import { NextResponse } from "next/server";
import { Resend } from "resend";

import { auth } from "@/lib/auth";

const resend = new Resend(
  process.env.RESEND_API_KEY
);

const fromEmail =
  process.env.RESEND_FROM_EMAIL ||
  "JAN-GET <onboarding@resend.dev>";

const supportEmail =
  process.env.SUPPORT_EMAIL ||
  process.env.ADMIN_EMAILS
    ?.split(",")[0]
    ?.trim();

type SupportBody = {
  name?: string;
  email?: string;
  orderNumber?: string;
  issue?: string;
  message?: string;
  language?: string;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    email
  );
}

function getIssueLabel(
  issue: string,
  language: string
) {
  const labels: Record<
    string,
    Record<string, string>
  > = {
    en: {
      order: "Order",
      payment: "Payment",
      shipping: "Shipping",
      product: "Product",
      account: "Account",
      other: "Other",
    },
    de: {
      order: "Bestellung",
      payment: "Zahlung",
      shipping: "Versand",
      product: "Produkt",
      account: "Konto",
      other: "Sonstiges",
    },
    ar: {
      order: "الطلب",
      payment: "الدفع",
      shipping: "الشحن",
      product: "المنتج",
      account: "الحساب",
      other: "أخرى",
    },
  };

  return (
    labels[language]?.[issue] ||
    labels.en[issue] ||
    issue
  );
}

export async function POST(request: Request) {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.error(
        "SUPPORT API: RESEND_API_KEY is missing."
      );

      return NextResponse.json(
        {
          error:
            "Support email service is not configured.",
        },
        { status: 500 }
      );
    }

    if (!supportEmail) {
      console.error(
        "SUPPORT API: SUPPORT_EMAIL is missing."
      );

      return NextResponse.json(
        {
          error:
            "Support recipient is not configured.",
        },
        { status: 500 }
      );
    }

    const body =
      (await request.json()) as SupportBody;

    const name = body.name?.trim() || "";
    const submittedEmail =
      body.email?.trim().toLowerCase() || "";
    const orderNumber =
      body.orderNumber?.trim() || "";
    const issue = body.issue?.trim() || "";
    const message = body.message?.trim() || "";
    const language =
      body.language?.trim() || "en";

    if (!name) {
      return NextResponse.json(
        {
          error: "Name is required.",
        },
        { status: 400 }
      );
    }

    if (
      !submittedEmail ||
      !isValidEmail(submittedEmail)
    ) {
      return NextResponse.json(
        {
          error:
            "A valid email is required.",
        },
        { status: 400 }
      );
    }

    if (!issue) {
      return NextResponse.json(
        {
          error:
            "Issue type is required.",
        },
        { status: 400 }
      );
    }

    if (!message) {
      return NextResponse.json(
        {
          error:
            "Message is required.",
        },
        { status: 400 }
      );
    }

    const session =
      await auth.api.getSession({
        headers: request.headers,
      });

    let customerName = name;
    let customerEmail = submittedEmail;

    if (session?.user) {
      customerName =
        session.user.name?.trim() || name;

      customerEmail =
        session.user.email
          ?.trim()
          .toLowerCase() ||
        submittedEmail;
    }

    const safeName =
      escapeHtml(customerName);

    const safeEmail =
      escapeHtml(customerEmail);

    const safeOrderNumber = escapeHtml(
      orderNumber || "Not provided"
    );

    const safeIssue = escapeHtml(
      getIssueLabel(issue, language)
    );

    const safeLanguage =
      escapeHtml(language);

    const safeMessage =
      escapeHtml(message).replace(
        /\n/g,
        "<br />"
      );

    const result =
      await resend.emails.send({
        from: fromEmail,
        to: supportEmail,
        replyTo: customerEmail,
        subject: `[JAN-GET Support] ${getIssueLabel(
          issue,
          language
        )}${
          orderNumber
            ? ` — ${orderNumber}`
            : ""
        }`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="UTF-8" />
              <title>JAN-GET Support Request</title>
            </head>

            <body
              style="
                margin: 0;
                padding: 0;
                background: #f8f5f6;
                font-family: Arial, Helvetica, sans-serif;
                color: #2f2930;
              "
            >
              <div
                style="
                  max-width: 680px;
                  margin: 0 auto;
                  padding: 32px 16px;
                "
              >
                <div
                  style="
                    background: #ffffff;
                    border: 1px solid #eadfe3;
                    border-radius: 20px;
                    overflow: hidden;
                  "
                >
                  <div
                    style="
                      background: #d6a3b5;
                      padding: 24px 28px;
                    "
                  >
                    <h1
                      style="
                        margin: 0;
                        color: #ffffff;
                        font-size: 24px;
                      "
                    >
                      JAN-GET Support
                    </h1>

                    <p
                      style="
                        margin: 8px 0 0;
                        color: #fff8fa;
                        font-size: 14px;
                      "
                    >
                      New support request
                    </p>
                  </div>

                  <div
                    style="
                      padding: 28px;
                    "
                  >
                    <table
                      style="
                        width: 100%;
                        border-collapse: collapse;
                        font-size: 14px;
                      "
                    >
                      <tr>
                        <td
                          style="
                            padding: 8px 0;
                            font-weight: bold;
                            width: 150px;
                          "
                        >
                          Customer
                        </td>

                        <td
                          style="
                            padding: 8px 0;
                          "
                        >
                          ${safeName}
                        </td>
                      </tr>

                      <tr>
                        <td
                          style="
                            padding: 8px 0;
                            font-weight: bold;
                          "
                        >
                          Email
                        </td>

                        <td
                          style="
                            padding: 8px 0;
                          "
                        >
                          ${safeEmail}
                        </td>
                      </tr>

                      <tr>
                        <td
                          style="
                            padding: 8px 0;
                            font-weight: bold;
                          "
                        >
                          Order Number
                        </td>

                        <td
                          style="
                            padding: 8px 0;
                          "
                        >
                          ${safeOrderNumber}
                        </td>
                      </tr>

                      <tr>
                        <td
                          style="
                            padding: 8px 0;
                            font-weight: bold;
                          "
                        >
                          Issue
                        </td>

                        <td
                          style="
                            padding: 8px 0;
                          "
                        >
                          ${safeIssue}
                        </td>
                      </tr>

                      <tr>
                        <td
                          style="
                            padding: 8px 0;
                            font-weight: bold;
                          "
                        >
                          Language
                        </td>

                        <td
                          style="
                            padding: 8px 0;
                          "
                        >
                          ${safeLanguage}
                        </td>
                      </tr>
                    </table>

                    <div
                      style="
                        margin-top: 24px;
                        padding: 20px;
                        border-radius: 14px;
                        background: #f8f5f6;
                        border: 1px solid #eadfe3;
                      "
                    >
                      <p
                        style="
                          margin: 0 0 10px;
                          font-size: 14px;
                          font-weight: bold;
                        "
                      >
                        Customer Message
                      </p>

                      <p
                        style="
                          margin: 0;
                          font-size: 14px;
                          line-height: 1.7;
                        "
                      >
                        ${safeMessage}
                      </p>
                    </div>

                    <p
                      style="
                        margin: 24px 0 0;
                        font-size: 13px;
                        color: #766d73;
                      "
                    >
                      Reply directly to this email
                      to respond to the customer.
                    </p>
                  </div>
                </div>
              </div>
            </body>
          </html>
        `,
      });

    if (result.error) {
      console.error(
        "SUPPORT API: Resend error:",
        result.error
      );

      return NextResponse.json(
        {
          error:
            "Unable to send support message.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(
      "SUPPORT API failed:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to send support message.",
      },
      { status: 500 }
    );
  }
}