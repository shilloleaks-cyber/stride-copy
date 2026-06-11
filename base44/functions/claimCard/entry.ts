import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Generate a random unused serial number for a given card
async function assignSerial(base44, card) {
  if (!card.enable_serial_random) return null;

  const maxSupply = card.max_supply || 0;
  if (maxSupply <= 0) return null; // serial needs a max_supply

  // Get all used serials for this card
  const usedUserCards = await base44.asServiceRole.entities.UserCards.filter({ card_id: card.id });
  const usedSerials = new Set(usedUserCards.map(uc => uc.serial_number).filter(Boolean));

  if (usedSerials.size >= maxSupply) {
    return { soldOut: true };
  }

  // Build pool of available serials (1..maxSupply)
  const available = [];
  for (let i = 1; i <= maxSupply; i++) {
    if (!usedSerials.has(i)) available.push(i);
  }

  if (available.length === 0) return { soldOut: true };

  // Pick random from available
  const serial_number = available[Math.floor(Math.random() * available.length)];

  const digits = card.serial_digits || 4;
  const padded = String(serial_number).padStart(digits, '0');
  const maxPadded = String(maxSupply).padStart(digits, '0');

  const prefix = card.serial_prefix ? `${card.serial_prefix}-` : '';
  const serial_code = `${prefix}${padded}`;
  const supply_position = `#${padded} / ${maxPadded}`;

  return { serial_number, serial_code, supply_position };
}

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

    // Check expiry
    if (claimToken.expires_at && new Date(claimToken.expires_at) < new Date()) {
      return Response.json({ error: 'Token has expired' }, { status: 410 });
    }

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

    // Check card status — only published cards can be claimed
    if (card.status && card.status !== 'published') {
      return Response.json({ error: 'This card is not available for claim.' }, { status: 403 });
    }

    // Check max supply
    if (card.max_supply > 0) {
      const claimedCount = await base44.asServiceRole.entities.UserCards.filter({ card_id: card.id });
      if (claimedCount.length >= card.max_supply) {
        return Response.json({ error: 'Sold Out — this card has reached its maximum supply.' }, { status: 409 });
      }
    }

    // Assign serial if enabled
    let serialData = null;
    if (card.enable_serial_random) {
      serialData = await assignSerial(base44, card);
      if (serialData?.soldOut) {
        return Response.json({ error: 'Sold Out — no serial numbers remaining.' }, { status: 409 });
      }
    }

    // Mark token as used AFTER all checks pass
    await base44.asServiceRole.entities.ClaimTokens.update(claimToken.id, {
      is_used: true,
      used_by_user_id: user.id,
      used_at: new Date().toISOString(),
    });

    // Grant card to user
    const userCardData = {
      user_id: user.id,
      user_email: user.email,
      card_id: claimToken.card_id,
      claimed_at: new Date().toISOString(),
      source: 'qr_scan',
      claim_token: token,
    };

    if (serialData) {
      userCardData.serial_number = serialData.serial_number;
      userCardData.serial_code = serialData.serial_code;
      userCardData.supply_position = serialData.supply_position;
    }

    const newUserCard = await base44.asServiceRole.entities.UserCards.create(userCardData);

    // Increment current_supply on card
    await base44.asServiceRole.entities.Cards.update(card.id, {
      current_supply: (card.current_supply || 0) + 1,
    });

    return Response.json({ success: true, card, userCard: newUserCard });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});