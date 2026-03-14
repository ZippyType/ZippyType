import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { client_id } = req.query;

  if (!client_id) {
    return res.status(400).json({ error: 'Missing client_id' });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('oauth_apps')
      .select('name, redirect_uris')
      .eq('client_id', client_id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Application not found' });
    }

    return res.status(200).json(data);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
