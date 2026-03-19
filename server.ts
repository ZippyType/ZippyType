import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { createClient } from "@supabase/supabase-js";

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
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
