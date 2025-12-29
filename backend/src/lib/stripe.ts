import Stripe from 'stripe';
import { config } from '../config/index.js';

export const stripe = new Stripe(config.stripe.secretKey, {
  apiVersion: '2023-10-16',
});

// Verify webhook signature
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string
): Stripe.Event | null {
  try {
    return stripe.webhooks.constructEvent(
      payload,
      signature,
      config.stripe.webhookSecret
    ) as Stripe.Event;
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return null;
  }
}



