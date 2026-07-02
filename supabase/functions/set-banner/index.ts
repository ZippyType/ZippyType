import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { severity, title, message } = await req.json()

    // Validate severity: must be 'error', 'info', or 'warning'
    if (!severity || !['error', 'info', 'warning'].includes(severity)) {
      return new Response(
        JSON.stringify({ error: "Severity must be 'error', 'info', or 'warning'" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate title and message
    if (!title || !message) {
      return new Response(
        JSON.stringify({ error: "Title and message are required" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Retrieve Supabase environment secrets
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase environment variables are not configured in the project settings.")
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Insert new banner. We can mark all other previous banners as active=false (optional but clean)
    await supabase
      .from('system_banners')
      .update({ active: false })
      .eq('active', true)

    // Insert the new active banner
    const { data, error } = await supabase
      .from('system_banners')
      .insert([
        { severity, title, message, active: true }
      ])
      .select()

    if (error) throw error

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Banner successfully set and published to real-time clients.",
        banner: data[0] 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
