import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { token } = await req.json();
    if (!token) return Response.json({ error: 'Missing token' }, { status: 400 });

    // Look up the token
    const tokens = await base44.asServiceRole.entities.ClaimTokens.filter({ token });
    const claimToken = tokens[0];

    if (!claimToken) return Response.json({ error: 'Invalid token' }, { status: 404 });
    if (claimToken.is_used) return Response.json({ error: 'Token already used' }, { status: 409 });

    // Check if user already owns this card
    const existing = await base44.asServiceRole.entities.UserCards.filter({
      user_id: user.id,
      card_id: claimToken.card_id,
    });
    if (existing.length > 0) {
      return Response.json({ error: 'You already own this card' }, { status: 409 });
    }

    // Fetch card details
    const cards = await base44.asServiceRole.entities.Cards.filter({ id: claimToken.card_id });
    const card = cards[0];
    if (!card) return Response.json({ error: 'Card not found' }, { status: 404 });

    // Mark token as used
    await base44.asServiceRole.entities.ClaimTokens.update(claimToken.id, {
      is_used: true,
      used_by_user_id: user.id,
      used_at: new Date().toISOString(),
    });

    // Grant card to user
    await base44.asServiceRole.entities.UserCards.create({
      user_id: user.id,
      user_email: user.email,
      card_id: claimToken.card_id,
      claimed_at: new Date().toISOString(),
      source: 'qr_scan',
      claim_token: token,
    });

    return Response.json({ success: true, card });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});