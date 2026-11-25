// import Stripe from "stripe";

// const secretKey = process.env.STRIPE_SECRET_KEY;

// if (!secretKey) {
//   throw new Error("STRIPE_SECRET_KEY is not configured.");
// }

// export const stripe = new Stripe(secretKey);
import Stripe from "stripe";

let stripe: Stripe | null = null;

export function getStripe(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is not configured.");
  }

  if (!stripe) {
    stripe = new Stripe(secretKey);
  }

  return stripe;
}