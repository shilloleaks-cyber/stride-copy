/**
 * useEventRole
 *
 * Returns the current user's effective role for a specific event.
 *
 * Returns:
 *   { loading, isOwner, isAdmin, isStaff, isFull, roles, can, assignment, roleSource, visibleTabs, defaultTab }
 *
 * Logic:
 *   - isAdmin = currentUser.role === "admin" (global app admin)
 *   - isOwner = user created/owns the event
 *   - isStaff = accepted EventStaffAssignment exists for current user + event_id
 *   - isFull  = isAdmin || isOwner || roles includes "full_admin_view"
 *   - can(tool) = isFull || roles includes that tool key
 *
 * Only accepted assignments count. Pending, declined, revoked are ignored.
 * Emails are normalized (lowercased, trimmed) before comparison.
 */

import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { isEventOwner } from '@/lib/eventOwner';

const ALL_TABS = ['overview', 'registrations', 'payments', 'categories', 'checkin', 'staffs', 'settings', 'activity'];

// Which tabs each specific role key grants access to (when not isFull)
const ROLE_TAB_MAP = {
  registrations:  ['registrations'],
  payments:       ['payments'],
  checkin:        ['checkin'],
  categories:     ['categories'],
  analytics:      ['overview'],
  staff_management: ['staffs'],
  bib:            ['registrations'],
  coupons:        ['overview'],
};

export function useEventRole(eventId, user) {
  const isGlobalAdmin = user?.role === 'admin';

  // Fetch the event (needed for owner check)
  const { data: eventData } = useQuery({
    queryKey: ['event-for-role', eventId],
    queryFn: () => base44.entities.StrideEvent.filter({ id: eventId }).then(r => r[0] || null),
    enabled: !!eventId && !!user,
    staleTime: 60000,
  });

  const isOwner = !!user && !!eventData && isEventOwner(eventData, user);

  // Fetch staff assignment — only accepted, only for this event+user
  const { data: assignment, isLoading } = useQuery({
    queryKey: ['event-staff-me', eventId, user?.email],
    queryFn: async () => {
      const normalizedEmail = user.email.toLowerCase().trim();
      const records = await base44.entities.EventStaffAssignment.filter({
        event_id: eventId,
        staff_email: normalizedEmail,
        status: 'accepted',
      });
      return records[0] || null;
    },
    enabled: !!eventId && !!user?.email && !isGlobalAdmin && !isOwner,
    staleTime: 30000,
  });

  const isStaff = !isGlobalAdmin && !isOwner && !!assignment;
  const roles = isStaff ? (assignment?.roles || []) : [];
  const isFull = isGlobalAdmin || isOwner || roles.includes('full_admin_view');

  // Debug log
  if (eventId && user?.email) {
    console.debug('[useEventRole]', {
      eventId,
      currentUserEmail: user?.email,
      assignmentFound: !!assignment,
      assignmentStatus: assignment?.status,
      roles,
      isAdmin: isGlobalAdmin,
      isOwner,
      isStaff,
      isFull,
      canCheckin: isFull || roles.includes('checkin'),
      canPayments: isFull || roles.includes('payments'),
    });
  }

  /**
   * can(tool) — returns true if the current user has access to the given tool/section.
   */
  function can(tool) {
    if (!user) return false;
    if (isFull) return true;
    if (!isStaff) return false;

    const toolMap = {
      overview:      roles.includes('analytics') || roles.includes('full_admin_view'),
      registrations: roles.includes('registrations') || roles.includes('bib'),
      payments:      roles.includes('payments'),
      checkin:       roles.includes('checkin'),
      categories:    roles.includes('categories'),
      staffs:        roles.includes('staff_management'),
      settings:      false, // settings only for full admins
      activity:      false, // activity only for full admins
      bib:           roles.includes('bib') || roles.includes('registrations'),
      coupons:       roles.includes('coupons'),
      analytics:     roles.includes('analytics'),
    };

    return toolMap[tool] ?? roles.includes(tool);
  }

  // Build visible tabs list
  const visibleTabs = (() => {
    if (!user) return [];
    if (isFull) return ALL_TABS;
    if (!isStaff) return [];

    const tabs = new Set();
    for (const role of roles) {
      const mapped = ROLE_TAB_MAP[role] || [];
      mapped.forEach(t => tabs.add(t));
    }
    return ALL_TABS.filter(t => tabs.has(t));
  })();

  const defaultTab = visibleTabs[0] || null;

  // Legacy: single-role string for backwards compatibility
  const role = isFull ? 'full' : (isStaff ? (roles[0] || null) : null);

  return {
    // New API
    loading: !isGlobalAdmin && !isOwner && isLoading,
    isOwner,
    isAdmin: isGlobalAdmin,
    isStaff,
    isFull,
    roles,
    can,
    assignment,
    roleSource: isGlobalAdmin ? 'admin' : isOwner ? 'owner' : isStaff ? 'staff' : 'none',
    // Legacy API (keep for existing consumers)
    role,
    visibleTabs,
    defaultTab,
    isLoading: !isGlobalAdmin && !isOwner && isLoading,
  };
}