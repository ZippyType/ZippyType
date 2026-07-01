import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_51T2vpI0AlKSl27CKhQHW9reGxQz9s9Yt4elIt7jOGGGjAELY0BaGMZ8GPpzcG7sRuSVGjM4ALMhd0lBMiOnXTGL1002bRLLS1Z', {
  apiVersion: '2025-01-27.acacia' as any,
});

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  try {
    // In a real implementation you would retrieve the customer ID from your database
    // For now we'll just create a new customer if we don't have one stored,
    // or you could look up a customer by email.
    
    // To make this work properly for actual users, we need to ensure the user has a stripe_customer_id in Supabase
    // But since this is a demo, we will search for customer by some identifier or just create one.
    
    // Let's assume we can fetch the user's email
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (userError || !userData?.user) {
      throw new Error("User not found");
    }

    const email = userData.user.email;
    
    // Search for customer by email
    const customers = await stripe.customers.search({
      query: `email:\'${email}\'`,
    });

    let customerId = customers.data.length > 0 ? customers.data[0].id : null;

    if (!customerId) {
       // create a customer just so the portal works, though they wouldn't have active subs
       const newCustomer = await stripe.customers.create({ email });
       customerId = newCustomer.id;
    }

    const origin = req.headers.origin || req.headers.referer || 'http://localhost:3000';
    const baseUrl = origin.endsWith('/') ? origin.slice(0, -1) : origin;

    // Create a Customer Portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${baseUrl}/settings/billing`,
    });

    res.status(200).json({ url: session.url });
  } catch (error: any) {
    console.error('Stripe Portal error:', error);
    res.status(400).json({ error: { message: error.message } });
  }
}
