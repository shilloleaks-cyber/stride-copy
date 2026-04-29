import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/** Extract lat/lng from a URL string using common Google Maps patterns */
function extractCoords(url) {
  // @lat,lng pattern (most common in /maps/place/... URLs)
  let m = url.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (m) return { latitude: parseFloat(m[1]), longitude: parseFloat(m[2]) };

  // q=lat,lng or query=lat,lng
  m = url.match(/[?&](?:q|query)=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (m) return { latitude: parseFloat(m[1]), longitude: parseFloat(m[2]) };

  // ll=lat,lng
  m = url.match(/[?&]ll=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (m) return { latitude: parseFloat(m[1]), longitude: parseFloat(m[2]) };

  return null;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { maps_link } = await req.json();
    if (!maps_link) return Response.json({ success: false, error: 'No maps_link provided' });

    // 1. Try extracting directly from the provided URL
    const direct = extractCoords(maps_link);
    if (direct) {
      return Response.json({ success: true, ...direct, resolved_url: maps_link });
    }

    // 2. For short links (maps.app.goo.gl, goo.gl, etc.) — follow redirects server-side
    const isShortLink = /goo\.gl|maps\.app\.goo\.gl|maps\.google\.com\/maps\?/.test(maps_link);
    if (isShortLink || !direct) {
      try {
        const resp = await fetch(maps_link, {
          method: 'GET',
          redirect: 'follow',
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; BoomXBot/1.0)' },
        });
        const finalUrl = resp.url;

        const fromRedirect = extractCoords(finalUrl);
        if (fromRedirect) {
          return Response.json({ success: true, ...fromRedirect, resolved_url: finalUrl });
        }

        // Also try the response body URL if it contains a redirect
        const text = await resp.text();
        const bodyUrlMatch = text.match(/https:\/\/www\.google\.com\/maps[^"'\s]*/);
        if (bodyUrlMatch) {
          const fromBody = extractCoords(bodyUrlMatch[0]);
          if (fromBody) {
            return Response.json({ success: true, ...fromBody, resolved_url: bodyUrlMatch[0] });
          }
        }

        return Response.json({ success: false, error: 'Could not extract coordinates from resolved URL', resolved_url: finalUrl });
      } catch (fetchErr) {
        return Response.json({ success: false, error: `Failed to resolve link: ${fetchErr.message}` });
      }
    }

    return Response.json({ success: false, error: 'No coordinates found in URL' });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});