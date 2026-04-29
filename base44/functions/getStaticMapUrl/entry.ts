import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const apiKey = Deno.env.get('VITE_GOOGLE_MAPS_API_KEY');
    if (!apiKey) {
      return Response.json({ error: 'Maps API key not configured' }, { status: 500 });
    }

    const body = await req.json();
    const { latitude, longitude, location_name } = body;

    let mapQuery = null;
    if (latitude && longitude) {
      mapQuery = `${latitude},${longitude}`;
    } else if (location_name) {
      mapQuery = location_name;
    }

    if (!mapQuery) {
      return Response.json({ error: 'No location provided' }, { status: 400 });
    }

    const params = new URLSearchParams({
      center: mapQuery,
      zoom: '15',
      size: '600x300',
      scale: '2',
      maptype: 'roadmap',
      markers: `color:red|${mapQuery}`,
      key: apiKey,
    });

    const url = `https://maps.googleapis.com/maps/api/staticmap?${params.toString()}`;

    return Response.json({ url });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});