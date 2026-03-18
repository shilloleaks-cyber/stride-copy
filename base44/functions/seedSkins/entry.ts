import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const skins = [
      // Route Skins
      { item_type: 'route', name: 'Neon Green', description: 'Classic neon green', preview_color: '#10b981', cost_coins: 0, unlock_level: 0, is_default: true, skin_data: { color: '#10b981', glow: true } },
      { item_type: 'route', name: 'Electric Purple', description: 'Vibrant purple trail', preview_color: '#a855f7', cost_coins: 50, unlock_level: 3, is_default: false, skin_data: { color: '#a855f7', glow: true } },
      { item_type: 'route', name: 'Ice Blue', description: 'Cool blue frost', preview_color: '#3b82f6', cost_coins: 75, unlock_level: 5, is_default: false, skin_data: { color: '#3b82f6', glow: true } },
      { item_type: 'route', name: 'Lava Red', description: 'Blazing red hot', preview_color: '#ef4444', cost_coins: 100, unlock_level: 7, is_default: false, skin_data: { color: '#ef4444', glow: true } },
      { item_type: 'route', name: 'Golden Sun', description: 'Radiant gold', preview_color: '#f59e0b', cost_coins: 150, unlock_level: 10, is_default: false, skin_data: { color: '#f59e0b', glow: true } },
      
      // Coin Skins
      { item_type: 'coin', name: 'Classic Coin', description: 'Original gold coin', preview_color: '#f59e0b', cost_coins: 0, unlock_level: 0, is_default: true, skin_data: { icon: '🪙' } },
      { item_type: 'coin', name: 'Crystal Coin', description: 'Shimmering crystal', preview_color: '#06b6d4', cost_coins: 30, unlock_level: 2, is_default: false, skin_data: { icon: '💎' } },
      { item_type: 'coin', name: 'Fire Coin', description: 'Burning ember', preview_color: '#ef4444', cost_coins: 50, unlock_level: 4, is_default: false, skin_data: { icon: '🔥' } },
      { item_type: 'coin', name: 'Star Coin', description: 'Celestial star', preview_color: '#fbbf24', cost_coins: 75, unlock_level: 6, is_default: false, skin_data: { icon: '⭐' } },
      
      // Badge Skins
      { item_type: 'badge', name: 'Rookie Runner', description: 'New to the track', preview_color: '#9ca3af', cost_coins: 0, unlock_level: 0, is_default: true, skin_data: { emoji: '🏃', color: '#9ca3af' } },
      { item_type: 'badge', name: 'Night Runner', description: 'Moon warrior', preview_color: '#6366f1', cost_coins: 100, unlock_level: 5, is_default: false, skin_data: { emoji: '🌙', color: '#6366f1' } },
      { item_type: 'badge', name: 'Beast Mode', description: 'Unstoppable force', preview_color: '#dc2626', cost_coins: 200, unlock_level: 10, is_default: false, skin_data: { emoji: '⚡', color: '#dc2626' } },
      { item_type: 'badge', name: 'Lightning Bolt', description: 'Speed demon', preview_color: '#fbbf24', cost_coins: 150, unlock_level: 8, is_default: false, skin_data: { emoji: '⚡', color: '#fbbf24' } },
      
      // Theme Skins
      { item_type: 'theme', name: 'Dark Emerald', description: 'Classic dark theme', preview_color: '#10b981', cost_coins: 0, unlock_level: 0, is_default: true, skin_data: { primary: '#10b981', accent: '#059669' } },
      { item_type: 'theme', name: 'Midnight Purple', description: 'Royal purple theme', preview_color: '#a855f7', cost_coins: 200, unlock_level: 12, is_default: false, skin_data: { primary: '#a855f7', accent: '#9333ea' } },
      { item_type: 'theme', name: 'Ocean Blue', description: 'Deep sea theme', preview_color: '#0ea5e9', cost_coins: 250, unlock_level: 15, is_default: false, skin_data: { primary: '#0ea5e9', accent: '#0284c7' } },
    ];

    const created = [];
    for (const skin of skins) {
      const existing = await base44.asServiceRole.entities.ItemSkin.filter({ 
        name: skin.name 
      });
      
      if (existing.length === 0) {
        const newSkin = await base44.asServiceRole.entities.ItemSkin.create(skin);
        created.push(newSkin);
      }
    }

    return Response.json({ 
      success: true, 
      created: created.length,
      message: `Created ${created.length} skins` 
    });

  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});