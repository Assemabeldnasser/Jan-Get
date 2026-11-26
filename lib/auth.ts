
import { betterAuth } from "better-auth";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { mongodbAdapter } from "@better-auth/mongo-adapter";
import { Resend } from "resend";

import { mongoClient, mongoDb } from "@/lib/mongodb";

// During Next.js production build, DigitalOcean may not expose
// runtime secrets to the Docker build stage.
const isNextBuild =
  process.env.NEXT_PHASE === "phase-production-build";

const secret =
  process.env.BETTER_AUTH_SECRET ||
  (isNextBuild
    ? "JAN-GET-BUILD-ONLY-PLACEHOLDER-SECRET-DO-NOT-USE"
    : undefined);

// Never allow the application to run without the real secret.
if (!secret || secret.length < 32) {
  throw new Error(
    "BETTER_AUTH_SECRET must be set to a strong secret of at least 32 characters."
  );
}

const getResend = () => {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error("Missing RESEND_API_KEY environment variable.");
  }

  return new Resend(apiKey);
};

const fromEmail =
  process.env.RESEND_FROM_EMAIL ||
  "JAN-GET <noreply@janget.de>";

const escapeHtml = (value: string): string =>
  value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[character];
  });

const trustedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://192.168.178.67:3000",
  "https://janget.de",
  "https://www.janget.de",
  "https://jan-get-lkbcl.ondigitalocean.app",
];

export const auth = betterAuth({
  database: mongodbAdapter(mongoDb, {
    client: mongoClient,
  }),

  secret,

  baseURL:
    process.env.BETTER_AUTH_URL ||
    "http://localhost:3000",

  trustedOrigins,

  user: {
    additionalFields: {
      firstName: {
        type: "string",
        required: true,
      },

      lastName: {
        type: "string",
        required: true,
      },

      phone: {
        type: "string",
        required: true,
      },

      address: {
        type: "string",
        required: true,
      },

      apartment: {
        type: "string",
        required: false,
      },

      postalCode: {
        type: "string",
        required: true,
      },

      city: {
        type: "string",
        required: true,
      },

      country: {
        type: "string",
        required: true,
        defaultValue: "Germany",
      },
    },
  },

  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/sign-up/email") {
        return;
      }

      const email =
        typeof ctx.body?.email === "string"
          ? ctx.body.email.trim().toLowerCase()
          : "";

      if (!email) {
        return;
      }

      const existingUser =
        await ctx.context.internalAdapter.findUserByEmail(email);

      if (existingUser) {
        throw new APIError("UNPROCESSABLE_ENTITY", {
          message: "User already exists. Use another email.",
        });
      }
    }),
  },

  emailAndPassword: {
    enabled: true,

    requireEmailVerification: false,

    minPasswordLength: 8,

    resetPasswordTokenExpiresIn: 3600,

    revokeSessionsOnPasswordReset: true,

    sendResetPassword: async ({
      user,
      url,
    }: {
      user: {
        email: string;
        name: string;
      };
      url: string;
    }) => {
      try {
        const resend = getResend();

        const result = await resend.emails.send({
          from: fromEmail,
          to: user.email,
          subject: "Reset your JAN-GET password",
          html: `
            <div
              style="
                font-family: Arial, sans-serif;
                line-height: 1.6;
                max-width: 600px;
                margin: 0 auto;
                padding: 24px;
              "
            >
              <h2>Reset your JAN-GET password</h2>

              <p>Hello ${escapeHtml(user.name)},</p>

              <p>
                We received a request to reset your JAN-GET password.
              </p>

              <p>
                Click the button below to choose a new password:
              </p>

              <p>
                <a
                  href="${escapeHtml(url)}"
                  style="
                    display:inline-block;
                    padding:12px 20px;
                    background:#d48b9f;
                    color:white;
                    text-decoration:none;
                    border-radius:999px;
                    font-weight:bold;
                  "
                >
                  Reset my password
                </a>
              </p>

              <p>
                This link will expire after 1 hour.
              </p>

              <p>
                If you did not request this, you can safely ignore this email.
              </p>

              <p>
                JAN-GET<br />
                3D Printed Creations
              </p>
            </div>
          `,
        });

        if (result.error) {
          console.error(
            "JAN-GET password reset email failed:",
            result.error
          );

          throw new Error("Failed to send password reset email.");
        }

        console.log("JAN-GET password reset email sent.");
      } catch (error) {
        console.error(
          "JAN-GET password reset email failed:",
          error
        );

        throw error;
      }
    },
  },

  emailVerification: {
    sendOnSignUp: true,

    sendVerificationEmail: async ({
      user,
      url,
    }: {
      user: {
        email: string;
        name: string;
      };
      url: string;
    }) => {
      try {
        const resend = getResend();

        const result = await resend.emails.send({
          from: fromEmail,
          to: user.email,
          subject: "Verify your JAN-GET email address",
          html: `
            <div
              style="
                font-family: Arial, sans-serif;
                line-height: 1.6;
                max-width: 600px;
                margin: 0 auto;
                padding: 24px;
              "
            >
              <h2>Welcome to JAN-GET!</h2>

              <p>Hello ${escapeHtml(user.name)},</p>

              <p>
                Thank you for creating your JAN-GET account.
              </p>

              <p>
                Please verify your email address by clicking
                the button below:
              </p>

              <p>
                <a
                  href="${escapeHtml(url)}"
                  style="
                    display:inline-block;
                    padding:12px 20px;
                    background:#d48b9f;
                    color:white;
                    text-decoration:none;
                    border-radius:8px;
                    font-weight:bold;
                  "
                >
                  Verify my email
                </a>
              </p>

              <p>
                If you did not create this account,
                you can safely ignore this email.
              </p>

              <p>
                JAN-GET<br />
                3D Printed Creations
              </p>
            </div>
          `,
        });

        if (result.error) {
          console.error(
            "JAN-GET verification email failed:",
            result.error
          );

          throw new Error("Failed to send verification email.");
        }

        console.log("JAN-GET verification email sent.");
      } catch (error) {
        console.error(
          "JAN-GET verification email failed:",
          error
        );

        throw error;
      }
    },
  },

  advanced: {
    database: {
      joins: true,
    },
  },
});