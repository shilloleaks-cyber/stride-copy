// Item management utilities

// Check if item is unlocked
export const isUnlocked = (itemId) => {
  return localStorage.getItem(`unlock:${itemId}`) === "1";
};

// Check if item is equipped
export const isEquipped = (itemId) => {
  return localStorage.getItem(`equipped:${itemId}`) === "1";
};

// Get currently equipped item for a type
export const getEquippedItem = (itemType) => {
  return localStorage.getItem(`equipped_${itemType}`) || null;
};

// Equip an item (unequips others of same type)
export const equipItem = (itemId, itemType) => {
  // Unequip all items of this type first
  const allItems = getAllItemsOfType(itemType);
  allItems.forEach(id => {
    localStorage.removeItem(`equipped:${id}`);
  });
  
  // Equip the new item
  localStorage.setItem(`equipped:${itemId}`, "1");
  localStorage.setItem(`equipped_${itemType}`, itemId);
};

// Unequip an item
export const unequipItem = (itemId, itemType) => {
  localStorage.removeItem(`equipped:${itemId}`);
  localStorage.removeItem(`equipped_${itemType}`);
};

// Get all items of a specific type
const getAllItemsOfType = (itemType) => {
  const items = {
    route: ['neon-route'],
    ghost: ['ghost-skin'],
    badge: ['animated-badge'],
    frame: ['profile-frame'],
    sound: ['victory-sound'],
    shield: ['streak-boost'],
  };
  return items[itemType] || [];
};

// Get route color based on equipped item
export const getRouteColor = () => {
  const equippedRoute = getEquippedItem('route');
  
  if (equippedRoute === 'neon-route' && isEquipped('neon-route')) {
    return {
      main: '#00FF00', // Bright neon green
      glow: '#00FF00',
      opacity: 1,
      glowOpacity: 0.6,
      weight: 6,
      glowWeight: 12,
    };
  }
  
  // Default colors
  return {
    main: '#BFFF00',
    glow: '#8A2BE2',
    opacity: 1,
    glowOpacity: 0.3,
    weight: 5,
    glowWeight: 10,
  };
};

// Get ghost appearance
export const getGhostAppearance = () => {
  const equippedGhost = getEquippedItem('ghost');
  
  if (equippedGhost === 'ghost-skin' && isEquipped('ghost-skin')) {
    return {
      color: '#9333EA', // Purple
      icon: '👻',
      glowColor: 'rgba(147, 51, 234, 0.4)',
    };
  }
  
  // Default ghost
  return {
    color: '#8B5CF6',
    icon: '👤',
    glowColor: 'rgba(139, 92, 246, 0.3)',
  };
};

// Get profile frame style
export const getProfileFrame = () => {
  const equippedFrame = getEquippedItem('frame');
  
  if (equippedFrame === 'profile-frame' && isEquipped('profile-frame')) {
    return {
      border: '3px solid transparent',
      borderImage: 'linear-gradient(135deg, #BFFF00, #8A2BE2) 1',
      boxShadow: '0 0 20px rgba(191, 255, 0, 0.4)',
      animation: 'pulse 2s ease-in-out infinite',
    };
  }
  
  return null;
};

// Get animated badge config
export const getAnimatedBadge = () => {
  const equippedBadge = getEquippedItem('badge');
  
  if (equippedBadge === 'animated-badge' && isEquipped('animated-badge')) {
    return {
      enabled: true,
      icon: '✨',
      animation: 'bounce',
    };
  }
  
  return {
    enabled: false,
  };
};

// Check if victory sound is enabled
export const hasVictorySound = () => {
  return isEquipped('victory-sound');
};

// Check if streak shield is active
export const hasStreakShield = () => {
  return isEquipped('streak-boost');
};