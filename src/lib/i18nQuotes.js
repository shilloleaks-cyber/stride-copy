/**
 * BoomX Global Quote Registry
 *
 * - Built-in / system quotes → defined here, language-aware
 * - Admin-created content (event.title, item.description, etc.) → NOT here
 * - User-generated content → NOT here
 *
 * Categories:
 *   home          - Daily motivational quote on Home screen
 *   run_complete  - Quote shown on RunSummary after a run
 *   streak        - Streak tier encouragement labels
 *   run_hud       - In-run floating HUD micro-texts
 *
 * Rarity: common | rare | system
 */

export const GLOBAL_QUOTES = [
  // ── Home Daily Quotes ──────────────────────────────────────────────────────
  {
    id: 'run_today_stronger_tomorrow',
    category: 'home',
    rarity: 'common',
    en: 'Run today, stronger tomorrow 💪',
    th: 'วิ่งวันนี้ พรุ่งนี้แข็งแรงขึ้น 💪',
  },
  {
    id: 'small_steps_big_wins',
    category: 'home',
    rarity: 'common',
    en: 'Small steps lead to big victories 🏆',
    th: 'ก้าวเล็กๆ นำไปสู่ชัยชนะใหญ่ 🏆',
  },
  {
    id: 'run_life_gets_better',
    category: 'home',
    rarity: 'common',
    en: 'Run on, life gets better ✨',
    th: 'วิ่งไป ชีวิตก็ดีขึ้น ✨',
  },
  {
    id: 'every_step_is_pride',
    category: 'home',
    rarity: 'common',
    en: 'Every step is something to be proud of 🎯',
    th: 'ทุกก้าวคือความภาคภูมิใจ 🎯',
  },
  {
    id: 'stop_when_done_not_tired',
    category: 'home',
    rarity: 'common',
    en: "Don't stop when you're tired — stop when you're done 🔥",
    th: 'อย่าหยุดเมื่อเหนื่อย หยุดเมื่อสำเร็จ 🔥',
  },
  {
    id: 'run_for_health_life',
    category: 'home',
    rarity: 'common',
    en: 'Run for health, run for a better life 🌟',
    th: 'วิ่งเพื่อสุขภาพ วิ่งเพื่อชีวิตที่ดีขึ้น 🌟',
  },
  {
    id: 'success_starts_first_step',
    category: 'home',
    rarity: 'common',
    en: 'Success starts with the first step 🚀',
    th: 'ความสำเร็จเริ่มจากก้าวแรก 🚀',
  },

  // ── Run Completion Quotes ─────────────────────────────────────────────────
  {
    id: 'no_excuses_just_progress',
    category: 'run_complete',
    rarity: 'common',
    en: 'No excuses. Just progress.',
    th: 'ไม่มีข้อแก้ตัว มีแต่ความก้าวหน้า',
  },
  {
    id: 'consistency_beats_speed',
    category: 'run_complete',
    rarity: 'common',
    en: 'Consistency beats speed.',
    th: 'ความสม่ำเสมอชนะความเร็ว',
  },
  {
    id: 'you_showed_up_today',
    category: 'run_complete',
    rarity: 'common',
    en: "You showed up. That's already a win.",
    th: 'คุณออกมาแล้ว นั่นก็ชนะแล้ว',
  },
  {
    id: 'one_run_at_a_time',
    category: 'run_complete',
    rarity: 'common',
    en: 'One run at a time. You are becoming unstoppable.',
    th: 'ทีละก้าว คุณกำลังกลายเป็นคนที่หยุดไม่ได้',
  },
  {
    id: 'sweat_is_your_superpower',
    category: 'run_complete',
    rarity: 'common',
    en: 'Sweat is your superpower. 💦',
    th: 'เหงื่อคือพลังพิเศษของคุณ 💦',
  },
  {
    id: 'rare_fire_inside',
    category: 'run_complete',
    rarity: 'rare',
    en: 'You found the fire inside today 🔥',
    th: 'วันนี้คุณเจอไฟในตัวเองแล้ว 🔥',
  },
  {
    id: 'rare_chosen_few',
    category: 'run_complete',
    rarity: 'rare',
    en: 'Not everyone does this. You are one of the chosen few. ⚡',
    th: 'ไม่ใช่ทุกคนจะทำแบบนี้ได้ คุณคือหนึ่งในคนพิเศษ ⚡',
  },
  {
    id: 'rare_legend_in_making',
    category: 'run_complete',
    rarity: 'rare',
    en: 'A legend in the making. Keep going. 🏆',
    th: 'ตำนานกำลังถูกสร้าง ไปต่อเลย 🏆',
  },

  // ── Streak Tier Labels ────────────────────────────────────────────────────
  {
    id: 'streak_beast_mode',
    category: 'streak',
    rarity: 'system',
    en: 'Beast mode (14d) 🔥',
    th: 'โหมดสุดขีด (14 วัน) 🔥',
  },
  {
    id: 'streak_hot',
    category: 'streak',
    rarity: 'system',
    en: 'Hot streak (7d) 🔥',
    th: 'สตรีคร้อนแรง (7 วัน) 🔥',
  },
  {
    id: 'streak_warming_up',
    category: 'streak',
    rarity: 'system',
    en: 'Warming up (3d)',
    th: 'กำลังวอร์มอัพ (3 วัน)',
  },
  {
    id: 'streak_start',
    category: 'streak',
    rarity: 'system',
    en: 'Start your streak',
    th: 'เริ่มสตรีคของคุณ',
  },

  // ── Run HUD Micro-texts ───────────────────────────────────────────────────
  {
    id: 'hud_streak',
    category: 'run_hud',
    rarity: 'system',
    en: 'streak',
    th: 'สตรีค',
  },
  {
    id: 'hud_combo',
    category: 'run_hud',
    rarity: 'system',
    en: 'combo',
    th: 'คอมโบ',
  },
];

// ── Lookup utilities ──────────────────────────────────────────────────────────

/**
 * Return localized text for a quote object.
 * Fallback order: selected lang → English → Thai → ""
 */
export function getLocalizedQuote(quote, language) {
  if (!quote) return '';
  if (language === 'th') return quote.th || quote.en || '';
  return quote.en || quote.th || '';
}

/**
 * Return quote object by id, or null.
 */
export function getQuoteById(id) {
  return GLOBAL_QUOTES.find(q => q.id === id) || null;
}

/**
 * Return all quotes for a given category.
 */
export function getQuotesByCategory(category) {
  return GLOBAL_QUOTES.filter(q => q.category === category);
}

/**
 * Return a random quote object from a category.
 * optionally filter by rarity.
 * Always returns the full quote object so callers can store the ID.
 */
export function getRandomQuoteByCategory(category, options = {}) {
  let pool = getQuotesByCategory(category);
  if (options.rarity) {
    pool = pool.filter(q => q.rarity === options.rarity);
  }
  if (!pool.length) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Convenience: find quote by id and return localized text.
 * Falls back gracefully if id is missing.
 */
export function getQuoteTextById(id, language) {
  const quote = getQuoteById(id);
  if (!quote) return '';
  return getLocalizedQuote(quote, language);
}

/**
 * Select the daily quote ID based on day-of-month index.
 * Returns a stable ID for the current calendar day so the quote
 * doesn't change when the user switches language.
 */
export function getDailyQuoteId() {
  const homeQuotes = getQuotesByCategory('home');
  if (!homeQuotes.length) return null;
  const dayIndex = new Date().getDate() % homeQuotes.length;
  return homeQuotes[dayIndex].id;
}

/**
 * Get the persisted daily quote ID from localStorage.
 * Re-selects (by day-index) if the cached date is stale.
 * Returns the stable quote ID.
 */
export function getPersistedDailyQuoteId() {
  const today = new Date().toDateString();
  const cachedDate = localStorage.getItem('daily_quote_date');
  const cachedId = localStorage.getItem('daily_quote_id');

  if (cachedDate === today && cachedId) {
    return cachedId;
  }

  const id = getDailyQuoteId();
  localStorage.setItem('daily_quote_date', today);
  localStorage.setItem('daily_quote_id', id);
  // Clear old plain-text cache if present
  localStorage.removeItem('daily_quote_text');
  return id;
}