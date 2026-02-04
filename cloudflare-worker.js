// EzCMS License Verification API
// Cloudflare Workers

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Verify license endpoint
    if (path === '/verify' && request.method === 'GET') {
      const licenseKey = url.searchParams.get('key');
      
      if (!licenseKey) {
        return new Response(JSON.stringify({
          valid: false,
          error: 'No license key provided'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Check license in KV store
      const licenseData = await env.LICENSES.get(licenseKey);
      
      if (!licenseData) {
        return new Response(JSON.stringify({
          valid: false,
          error: 'Invalid license key'
        }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const license = JSON.parse(licenseData);
      
      // Check if expired
      if (license.expires && new Date(license.expires) < new Date()) {
        return new Response(JSON.stringify({
          valid: false,
          error: 'License expired'
        }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Valid license
      return new Response(JSON.stringify({
        valid: true,
        email: license.email,
        purchaseDate: license.purchaseDate,
        expires: license.expires || 'never'
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Health check
    if (path === '/health') {
      return new Response(JSON.stringify({
        status: 'ok',
        service: 'EzCMS License API',
        version: '1.0.0'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 404 for other routes
    return new Response(JSON.stringify({
      error: 'Not found'
    }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
};
