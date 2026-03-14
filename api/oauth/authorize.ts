import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { client_id, user_id, redirect_uri } = req.body;

  if (!client_id || !user_id) {
    return res.status(400).json({ error: 'Missing parameters' });
  }

  try {
    // Verify app exists
    const { data: app, error: appError } = await supabaseAdmin
      .from('oauth_apps')
      .select('id, redirect_uris')
      .eq('client_id', client_id)
      .single();

    if (appError || !app) {
      return res.status(404).json({ error: 'Application not found' });
    }

    // Validate redirect URI
    if (redirect_uri && !app.redirect_uris.includes(redirect_uri)) {
      return res.status(400).json({ error: 'Invalid redirect URI' });
    }

    const code = uuidv4();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const { error: codeError } = await supabaseAdmin
      .from('oauth_codes')
      .insert({
        app_id: app.id,
        user_id,
        code,
        expires_at: expiresAt.toISOString(),
        redirect_uri: redirect_uri || app.redirect_uris[0]
      });

    if (codeError) throw codeError;

    return res.status(200).json({ code, redirect_uri: redirect_uri || app.redirect_uris[0] });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
