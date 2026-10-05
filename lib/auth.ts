import { betterAuth } from "better-auth";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { DatabaseSync } from "node:sqlite";
import { Resend } from "resend";

const database = new DatabaseSync("database.sqlite");

const resend = new Resend(process.env.RESEND_API_KEY);

const fromEmail =
  process.env.RESEND_FROM_EMAIL || "JAN-GET <onboarding@resend.dev>";

// const supportEmail =
//   process.env.SUPPORT_EMAIL || "support@jan-get.de";

export const auth = betterAuth({
  database,

  secret:
    process.env.BETTER_AUTH_SECRET ||
    "development-secret-change-this-in-production",

  baseURL:
    process.env.BETTER_AUTH_URL || "http://localhost:3000",

  /*
   * Allowed origins for local development.
   *
   * localhost:
   * Used when the application is opened on this computer.
   *
   * 127.0.0.1:
   * Alternative local address for this computer.
   *
   * 192.168.178.67:
   * Used when another device on the same network opens the application.
   */
  trustedOrigins: [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://192.168.178.67:3000",
  ],

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

  /*
   * We intentionally check for an existing email here because
   * the registration UI should clearly tell the user that the
   * email is already registered.
   *
   * Better Auth normally hides this information when
   * requireEmailVerification is enabled.
   */
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
      console.log("=================================");
      console.log("JAN-GET password reset email");
      console.log("To:", user.email);
      console.log("Reset URL:", url);

      try {
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

              <p>Hello ${user.name},</p>

              <p>
                We received a request to reset your JAN-GET password.
              </p>

              <p>
                Click the button below to choose a new password:
              </p>

              <p>
                <a
                  href="${url}"
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

        console.log("Resend result:", result);
        console.log("=================================");
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
    /*
     * Explicitly send the verification email after sign-up.
     */
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
      console.log("=================================");
      console.log("JAN-GET verification email");
      console.log("To:", user.email);
      console.log("Verification URL:", url);
      console.log("From:", fromEmail);

      try {
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

              <p>Hello ${user.name},</p>

              <p>
                Thank you for creating your JAN-GET account.
              </p>

              <p>
                Please verify your email address by clicking
                the button below:
              </p>

              <p>
                <a
                  href="${url}"
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

        console.log("Resend result:", result);
        console.log("=================================");
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