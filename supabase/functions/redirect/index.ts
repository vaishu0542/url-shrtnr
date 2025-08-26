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
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const url = new URL(req.url)
    const shortCode = url.pathname.split('/').pop()

    if (!shortCode) {
      return new Response('Short code not found', { status: 404 })
    }

    // Get the original URL
    const { data: urlData, error } = await supabase
      .from('urls')
      .select('original_url, click_count, id')
      .eq('short_code', shortCode)
      .single()

    if (error || !urlData) {
      return new Response('Short URL not found', { status: 404 })
    }

    // Increment click count
    await supabase
      .from('urls')
      .update({ click_count: urlData.click_count + 1 })
      .eq('id', urlData.id)

    // Redirect to original URL
    return new Response(null, {
      status: 302,
      headers: {
        'Location': urlData.original_url
      }
    })

  } catch (error) {
    console.error('Redirect error:', error)
    return new Response('Internal server error', { status: 500 })
  }
})