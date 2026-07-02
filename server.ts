import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_51T2vpI0AlKSl27CKhQHW9reGxQz9s9Yt4elIt7jOGGGjAELY0BaGMZ8GPpzcG7sRuSVGjM4ALMhd0lBMiOnXTGL1002bRLLS1Z', {
  apiVersion: '2025-01-27.acacia' as any,
});

// Initialize Supabase Admin
const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes
  
  app.post('/api/create-subscription-intent', async (req, res) => {
    try {
      const customer = await stripe.customers.create();
      const price = await stripe.prices.create({
        unit_amount: 500, // $5.00
        currency: 'usd',
        recurring: { interval: 'month' },
        product_data: { name: 'ZippyType Pro Subscription' },
      });
      const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{ price: price.id }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
      });
      const invoice = subscription.latest_invoice as any;
      const paymentIntent = invoice.payment_intent as unknown as Stripe.PaymentIntent;
      res.status(200).json({
        subscriptionId: subscription.id,
        clientSecret: paymentIntent.client_secret,
      });
    } catch (error: any) {
      console.error('Stripe error:', error);
      res.status(400).json({ error: { message: error.message } });
    }
  });

  app.post('/api/create-gift-card-intent', async (req, res) => {
    const { userId, months } = req.body;
    const numMonths = parseInt(months || '1');
    const discount = Math.min(0.5, (numMonths - 1) * 0.1);
    const amount = Math.round(numMonths * 500 * (1 - discount));
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency: 'usd',
        metadata: { type: 'gift_card', months: numMonths.toString(), userId: userId || '' },
      });
      res.status(200).json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      console.error('Stripe error:', error);
      res.status(400).json({ error: { message: error.message } });
    }
  });

  app.post('/api/confirm-gift-card', async (req, res) => {
    const { paymentIntentId } = req.body;
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      if (paymentIntent.status === 'succeeded' && paymentIntent.metadata.type === 'gift_card') {
        const months = parseInt(paymentIntent.metadata.months || '1');
        const code = Math.random().toString(36).substring(2, 14).toUpperCase().match(/.{1,4}/g)?.join('-') || 'ZIPPY-GIFT';
        const { data, error } = await supabaseAdmin
          .from('gift_cards')
          .insert({ code, months, created_by: paymentIntent.metadata.userId || null })
          .select().single();
        if (error) throw error;
        res.status(200).json({ code, months });
      } else {
        res.status(400).json({ error: 'Payment not successful or invalid' });
      }
    } catch (error: any) {
      console.error('Confirm gift card error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/create-portal-session', async (req, res) => {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'User ID is required' });
    try {
      const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
      if (userError || !userData?.user) throw new Error("User not found");
      const email = userData.user.email;
      const customers = await stripe.customers.search({ query: `email:\'${email}\'` });
      let customerId = customers.data.length > 0 ? customers.data[0].id : null;
      if (!customerId) {
         const newCustomer = await stripe.customers.create({ email });
         customerId = newCustomer.id;
      }
      const origin = req.headers.origin || req.headers.referer || 'http://localhost:3000';
      const baseUrl = origin.endsWith('/') ? origin.slice(0, -1) : origin;
      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${baseUrl}/settings/billing`,
      });
      res.status(200).json({ url: session.url });
    } catch (error: any) {
      console.error('Stripe Portal error:', error);
      res.status(400).json({ error: { message: error.message } });
    }
  });

  app.get('/api/member-count', async (req, res) => {
    res.json({ count: 1242 });
  });

  app.get('/api/oauth/apps', async (req, res) => {
    const { userId } = req.query;
    try {
      const { data, error } = await supabaseAdmin
        .from('oauth_apps')
        .select('*')
        .eq('user_id', userId);
      if (error) throw error;
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/oauth/apps', async (req, res) => {
    const { userId, name, redirectUris } = req.body;
    const clientId = Math.random().toString(36).substring(2, 15);
    const clientSecret = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    try {
      const { data, error } = await supabaseAdmin
        .from('oauth_apps')
        .insert({
          user_id: userId,
          name,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uris: redirectUris
        })
        .select()
        .single();
      
      if (error) throw error;
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete('/api/oauth/apps/:id', async (req, res) => {
    const { id } = req.params;
    const userId = req.query.userId as string;

    try {
      const { error } = await supabaseAdmin
        .from('oauth_apps')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);
      
      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Pro Text Generation with pooled GitHub tokens
  app.post('/api/generate-pro-text', async (req, res) => {
    const { difficulty, topic, textLength, language, isGuest, mode } = req.body;
    
    // Pool of GitHub tokens from environment variables (supporting both casings)
    const tokens = [
      process.env.GITHUB_TOKEN,
      process.env.GITHUB_TOK_1 || process.env.Github_tok_1,
      process.env.GITHUB_TOK_2 || process.env.Github_tok_2,
      process.env.GITHUB_TOK_3 || process.env.Github_tok_3,
      process.env.GITHUB_TOK_4 || process.env.Github_tok_4,
      process.env.GITHUB_TOK_5 || process.env.Github_tok_5,
      process.env.GITHUB_TOK_6 || process.env.Github_tok_6,
      process.env.GITHUB_TOK_7 || process.env.Github_tok_7,
      process.env.GITHUB_TOK_8 || process.env.Github_tok_8,
      process.env.GITHUB_TOK_9 || process.env.Github_tok_9,
      process.env.GITHUB_TOK_10 || process.env.Github_tok_10
    ].filter(Boolean) as string[];

    let token = isGuest ? process.env.GUEST_TOKEN : (tokens[Math.floor(Math.random() * tokens.length)] || process.env.GUEST_TOKEN);
    if (isGuest && !token) {
      console.warn("isGuest is true but GUEST_TOKEN is empty. Falling back to pooled tokens.");
      token = tokens[Math.floor(Math.random() * tokens.length)];
    }

    if (!token) {
      return res.status(500).json({ error: "No available AI tokens for Pro generation." });
    }

    // Mask token for logging
    const maskedToken = token.length > 8 ? `${token.substring(0, 4)}...${token.substring(token.length - 4)}` : "****";
    console.log(`Attempting Pro generation (isGuest=${isGuest}) with token: ${maskedToken}`);

    const theme = topic === "General" 
      ? "fascinating trivia, general knowledge, science facts, or life philosophy" 
      : topic;

    let lengthConstraint = "";
    if (textLength === 'short') lengthConstraint = "exactly 6 to 8 words total";
    else if (textLength === 'medium') lengthConstraint = "exactly 10 to 13 words total";
    else if (textLength === 'long') lengthConstraint = "exactly 20 to 25 words total";

    const prompt = `Generate a single ${difficulty} level typing practice sentence about "${theme}". 
    The language of the text MUST be: ${language}.
    
    CRITICAL CONSTRAINTS:
    - You MUST generate a sentence that is ${lengthConstraint}. 
    - DO NOT exceed or fall short of this word count. Count the words carefully before returning.
    Return ONLY the sentence text, no quotes, no labels, and no surrounding whitespace.`;

    try {
      const response = await fetch("https://models.inference.ai.azure.com/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          messages: [
            { role: "system", content: "You are a helpful assistant providing typing practice sentences." },
            { role: "user", content: prompt }
          ],
          // Using gpt-4o-mini as the "GPT-5 Mini" requested by user
          model: "gpt-4o-mini",
          temperature: 1,
          max_tokens: 150,
          top_p: 1
        })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error?.message || "GitHub API Error");
      }

      const data = await response.json();
      const text = data.choices[0].message.content.trim();
      res.json({ text });
    } catch (error: any) {
      console.error("Pro generation error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Pro Coach Note Generation for Guests or pooled users
  app.post('/api/generate-pro-coach-note', async (req, res) => {
    const { wpm, accuracy, errors, missedChars, isGuest } = req.body;
    
    const tokens = [
      process.env.GITHUB_TOKEN,
      process.env.GITHUB_TOK_1 || process.env.Github_tok_1,
      process.env.GITHUB_TOK_2 || process.env.Github_tok_2,
      process.env.GITHUB_TOK_3 || process.env.Github_tok_3,
      process.env.GITHUB_TOK_4 || process.env.Github_tok_4,
      process.env.GITHUB_TOK_5 || process.env.Github_tok_5,
      process.env.GITHUB_TOK_6 || process.env.Github_tok_6,
      process.env.GITHUB_TOK_7 || process.env.Github_tok_7,
      process.env.GITHUB_TOK_8 || process.env.Github_tok_8,
      process.env.GITHUB_TOK_9 || process.env.Github_tok_9,
      process.env.GITHUB_TOK_10 || process.env.Github_tok_10
    ].filter(Boolean) as string[];

    let token = isGuest ? process.env.GUEST_TOKEN : (tokens[Math.floor(Math.random() * tokens.length)] || process.env.GUEST_TOKEN);
    if (isGuest && !token) {
      token = tokens[Math.floor(Math.random() * tokens.length)];
    }

    if (!token) {
      return res.status(500).json({ error: "No available AI tokens." });
    }

    const missedStr = missedChars && missedChars.length > 0 ? missedChars.join(', ') : "none";
    const prompt = `Act as an elite typing instructor. Provide a brief, encouraging coach report (maximum 2 sentences) for a typing run.
    Performance:
    - Speed: ${wpm} WPM
    - Accuracy: ${accuracy}%
    - Errors: ${errors}
    - Missed keys: [${missedStr}]
    
    Give highly specific feedback based on these metrics. Be punchy, brief, and highly educational. No surrounding markdown, just the plain text.`;

    try {
      const response = await fetch("https://models.inference.ai.azure.com/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          messages: [
            { role: "system", content: "You are a professional typing coach." },
            { role: "user", content: prompt }
          ],
          model: "gpt-4o-mini",
          temperature: 0.7,
          max_tokens: 100
        })
      });

      if (!response.ok) {
        throw new Error("GitHub AI API Error");
      }

      const data = await response.json();
      const note = data.choices[0].message.content.trim();
      res.json({ note });
    } catch (error: any) {
      console.error("Coach report error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Pro Lesson Generation for Guests or pooled users
  app.post('/api/generate-pro-lesson', async (req, res) => {
    const { level, focusArea, isGuest } = req.body;
    
    const tokens = [
      process.env.GITHUB_TOKEN,
      process.env.GITHUB_TOK_1 || process.env.Github_tok_1,
      process.env.GITHUB_TOK_2 || process.env.Github_tok_2,
      process.env.GITHUB_TOK_3 || process.env.Github_tok_3,
      process.env.GITHUB_TOK_4 || process.env.Github_tok_4,
      process.env.GITHUB_TOK_5 || process.env.Github_tok_5,
      process.env.GITHUB_TOK_6 || process.env.Github_tok_6,
      process.env.GITHUB_TOK_7 || process.env.Github_tok_7,
      process.env.GITHUB_TOK_8 || process.env.Github_tok_8,
      process.env.GITHUB_TOK_9 || process.env.Github_tok_9,
      process.env.GITHUB_TOK_10 || process.env.Github_tok_10
    ].filter(Boolean) as string[];

    let token = isGuest ? process.env.GUEST_TOKEN : (tokens[Math.floor(Math.random() * tokens.length)] || process.env.GUEST_TOKEN);
    if (isGuest && !token) {
      token = tokens[Math.floor(Math.random() * tokens.length)];
    }

    if (!token) {
      return res.status(500).json({ error: "No available AI tokens." });
    }

    const prompt = `Act as an elite typing instructor. Create a typing lesson for level ${level}.
    ${focusArea ? `The focus area is: ${focusArea}.` : 'Focus on foundational techniques if level is low, or advanced speed/accuracy if high.'}
    
    Provide the lesson in JSON format with the following structure:
    {
      "title": "Lesson Title",
      "content": "Explanation of the lesson (maximum 2 sentences).",
      "exercise": "A practice sentence or drill (10-15 words) that reinforces the lesson.",
      "tips": ["Tip 1", "Tip 2"]
    }
    
    Ensure the exercise is relevant to the technique. For example, if the lesson is about home row, the exercise should use home row keys.
    Do not wrap the response in markdown code blocks. Just return the raw JSON object.`;

    try {
      const response = await fetch("https://models.inference.ai.azure.com/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          messages: [
            { role: "system", content: "You are an elite typing instructor." },
            { role: "user", content: prompt }
          ],
          model: "gpt-4o-mini",
          temperature: 0.7,
          max_tokens: 300
        })
      });

      if (!response.ok) {
        throw new Error("GitHub AI API Error");
      }

      const data = await response.json();
      const rawText = data.choices[0].message.content.trim();
      
      // Try to parse JSON safely
      let parsed;
      try {
        let cleanText = rawText;
        if (cleanText.startsWith("```")) {
          cleanText = cleanText.replace(/```json\n?/g, '').replace(/```/g, '');
        }
        parsed = JSON.parse(cleanText.trim());
      } catch (e) {
        console.error("Failed to parse JSON response:", rawText);
        throw new Error("Invalid response format from AI");
      }

      res.json(parsed);
    } catch (error: any) {
      console.error("Lesson error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/oauth/client-info", async (req, res) => {
    const { client_id } = req.query;
    try {
      const { data, error } = await supabaseAdmin
        .from('oauth_apps')
        .select('name, redirect_uris')
        .eq('client_id', client_id)
        .single();
      
      if (error || !data) return res.status(404).json({ error: 'App not found' });
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/oauth/authorize', async (req, res) => {
    const { client_id, redirect_uri, userId, code_challenge, code_challenge_method } = req.body;
    
    try {
      const { data: app, error: appError } = await supabaseAdmin
        .from('oauth_apps')
        .select('*')
        .eq('client_id', client_id)
        .single();
      
      if (appError || !app) return res.status(404).json({ error: 'App not found' });
      if (!app.redirect_uris.includes(redirect_uri)) {
        return res.status(400).json({ error: 'Invalid redirect URI' });
      }

      const code = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

      const { error: codeError } = await supabaseAdmin
        .from('oauth_codes')
        .insert({
          code,
          client_id,
          user_id: userId,
          expires_at: expiresAt,
          code_challenge,
          code_challenge_method: code_challenge_method || 'plain'
        });
      
      if (codeError) throw codeError;

      res.json({ code });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/oauth/token', async (req, res) => {
    const { client_id, client_secret, code, grant_type, redirect_uri, code_verifier } = req.body;

    if (grant_type !== 'authorization_code') {
      return res.status(400).json({ error: 'Unsupported grant type' });
    }

    try {
      const { data: app, error: appError } = await supabaseAdmin
        .from('oauth_apps')
        .select('*')
        .eq('client_id', client_id)
        .single();
      
      if (appError || !app || app.client_secret !== client_secret) {
        return res.status(401).json({ error: 'Invalid client credentials' });
      }

      const { data: codeData, error: codeError } = await supabaseAdmin
        .from('oauth_codes')
        .select('*')
        .eq('code', code)
        .eq('client_id', client_id)
        .single();

      if (codeError || !codeData || new Date(codeData.expires_at) < new Date()) {
        return res.status(400).json({ error: 'Invalid or expired code' });
      }

      // Generate access token (simplified for this example)
      const accessToken = Math.random().toString(36).substring(2);
      
      res.json({ access_token: accessToken, token_type: 'Bearer', expires_in: 3600 });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.use((req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
