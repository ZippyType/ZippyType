import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { userId } = req.query;

  if (req.method === 'GET') {
    if (!userId) return res.status(400).json({ error: 'Missing userId' });
    const { data, error } = await supabaseAdmin
      .from('oauth_apps')
      .select('*')
      .eq('user_id', userId);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === 'POST') {
    const { userId, name, redirectUris } = req.body;
    if (!userId || !name || !redirectUris) return res.status(400).json({ error: 'Missing fields' });
    
    const clientId = uuidv4().replace(/-/g, '').substring(0, 22);
    const clientSecret = uuidv4().replace(/-/g, '');

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

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === 'PUT') {
    const { id } = req.query;
    const { name, redirectUris } = req.body;
    if (!id || !name || !redirectUris) return res.status(400).json({ error: 'Missing fields' });

    const { data, error } = await supabaseAdmin
      .from('oauth_apps')
      .update({
        name,
        redirect_uris: redirectUris
      })
      .eq('id', id)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === 'DELETE') {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'Missing id' });
    const { error } = await supabaseAdmin
      .from('oauth_apps')
      .delete()
      .eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
