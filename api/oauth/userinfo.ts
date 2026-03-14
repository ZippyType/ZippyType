import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid token' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const { data: oauthToken, error: tokenError } = await supabaseAdmin
      .from('oauth_tokens')
      .select('user_id, expires_at')
      .eq('access_token', token)
      .single();

    if (tokenError || !oauthToken) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    if (new Date(oauthToken.expires_at) < new Date()) {
      return res.status(401).json({ error: 'Token expired' });
    }

    const { data: user, error: userError } = await supabaseAdmin
      .from('user_profiles')
      .select('id, username, handle, avatar_url, is_pro')
      .eq('id', oauthToken.user_id)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json(user);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
