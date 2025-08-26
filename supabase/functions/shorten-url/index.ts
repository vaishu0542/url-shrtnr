import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { url: originalUrl } = await req.json()

    if (!originalUrl) {
      return new Response(
        JSON.stringify({ error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate URL format
    try {
      new URL(originalUrl)
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid URL format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if URL already exists
    const { data: existingUrl } = await supabase
      .from('urls')
      .select('short_code')
      .eq('original_url', originalUrl)
      .single()

    if (existingUrl) {
      return new Response(
        JSON.stringify({ 
          shortCode: existingUrl.short_code,
          shortUrl: `${req.headers.get('origin') || 'https://rkbfxlnahnnvfvyuqrfa.supabase.co'}/${existingUrl.short_code}`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Generate unique short code
    const generateShortCode = () => {
      const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
      let result = ''
      for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length))
      }
      return result
    }

    let shortCode = generateShortCode()
    
    // Ensure uniqueness
    let attempts = 0
    while (attempts < 10) {
      const { data: existing } = await supabase
        .from('urls')
        .select('id')
        .eq('short_code', shortCode)
        .single()

      if (!existing) break
      
      shortCode = generateShortCode()
      attempts++
    }

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()

    // Insert new URL
    const { data, error } = await supabase
      .from('urls')
      .insert({
        original_url: originalUrl,
        short_code: shortCode,
        created_by: user?.id
      })
      .select('short_code')
      .single()

    if (error) {
      console.error('Database error:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to create short URL' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const origin = req.headers.get('origin') || 'https://rkbfxlnahnnvfvyuqrfa.supabase.co'
    
    return new Response(
      JSON.stringify({
        shortCode: data.short_code,
        shortUrl: `${origin}/${data.short_code}`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})