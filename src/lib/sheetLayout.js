/**
 * Global bottom sheet / modal layout constants.
 *
 * The app bottom nav bar is ~70px tall.
 * All scrollable sheets and bottom CTAs must respect this offset
 * so content and buttons are never hidden behind the nav bar.
 *
 * Usage:
 *   import { SHEET_BOTTOM_PADDING, SHEET_CONTENT_PADDING_BOTTOM } from '@/lib/sheetLayout';
 *
 *   // Scrollable content area:
 *   paddingBottom: SHEET_CONTENT_PADDING_BOTTOM
 *
 *   // Sticky/fixed bottom CTA container:
 *   paddingBottom: SHEET_BOTTOM_PADDING
 */

/** Height of the app's bottom navigation bar in px */
export const NAV_BAR_HEIGHT = 70;

/**
 * Bottom padding for the scrollable content inside any sheet/modal.
 * Ensures the last row scrolls above the nav bar with breathing room.
 */
export const SHEET_CONTENT_PADDING_BOTTOM = `calc(${NAV_BAR_HEIGHT}px + env(safe-area-inset-bottom, 0px) + 16px)`;

/**
 * Bottom padding for a sticky/fixed CTA container at the bottom of a sheet.
 * Ensures the CTA button sits above the nav bar + safe area.
 */
export const SHEET_BOTTOM_PADDING = `calc(${NAV_BAR_HEIGHT}px + env(safe-area-inset-bottom, 0px))`;