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

  const { client_id, client_secret, code, grant_type } = req.body;

  if (grant_type !== 'authorization_code') {
    return res.status(400).json({ error: 'Unsupported grant type' });
  }

  try {
    const { data: app, error: appError } = await supabaseAdmin
      .from('oauth_apps')
      .select('id')
      .eq('client_id', client_id)
      .eq('client_secret', client_secret)
      .single();

    if (appError || !app) {
      return res.status(401).json({ error: 'Invalid client credentials' });
    }

    const { data: oauthCode, error: codeError } = await supabaseAdmin
      .from('oauth_codes')
      .select('*')
      .eq('code', code)
      .eq('app_id', app.id)
      .eq('used', false)
      .single();

    if (codeError || !oauthCode) {
      return res.status(400).json({ error: 'Invalid or expired code' });
    }

    if (new Date(oauthCode.expires_at) < new Date()) {
      return res.status(400).json({ error: 'Code expired' });
    }

    // Mark code as used
    await supabaseAdmin.from('oauth_codes').update({ used: true }).eq('code', code);

    const accessToken = uuidv4();
    const expiresAt = new Date(Date.now() + 3600 * 1000); // 1 hour

    const { error: tokenError } = await supabaseAdmin
      .from('oauth_tokens')
      .insert({
        app_id: app.id,
        user_id: oauthCode.user_id,
        access_token: accessToken,
        expires_at: expiresAt.toISOString()
      });

    if (tokenError) throw tokenError;

    return res.status(200).json({
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: 3600
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
