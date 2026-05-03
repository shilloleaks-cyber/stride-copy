/**
 * useEventRole
 *
 * Returns the current user's effective role for a specific event.
 *
 * Roles (in order of privilege):
 *   'full'          — Full Admin: see + do everything
 *   'registrations' — Registrations tab only
 *   'payments'      — Payments tab only
 *   'checkin'       — Check-in tab only
 *   null            — no access (not a staff member for this event)
 *
 * Global admins (user.role === 'admin') always get 'full' regardless of EventStaff records.
 *
 * Usage:
 *   const { role, can } = useEventRole(eventId, user);
 *   can('registrations')  → true if role is 'full' or 'registrations'
 *   can('payments')       → true if role is 'full' or 'payments'
 */

import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

// Tabs / sections each role can access (in addition to 'full' which gets everything)
const ROLE_ACCESS = {
  registrations: ['registrations'],
  payments:      ['payments'],
  checkin:       ['checkin'],
};

// All tabs a full admin can access
const ALL_TABS = ['overview', 'registrations', 'payments', 'categories', 'checkin', 'staffs', 'settings', 'activity'];

export function useEventRole(eventId, user) {
  // Global app admins: always full access, no DB query needed
  const isGlobalAdmin = user?.role === 'admin';

  const { data: staffRecord, isLoading } = useQuery({
    queryKey: ['event-staff-me', eventId, user?.email],
    queryFn: async () => {
      // Check EventStaffAssignment (accepted only) for this user
      const records = await base44.entities.EventStaffAssignment.filter({
        event_id: eventId,
        staff_email: user.email.toLowerCase().trim(),
        status: 'accepted',
      });
      if (records.length > 0) {
        // Map multi-role assignment → single role string for backwards compatibility
        // Use 'full' if full_admin_view is in roles, otherwise pick most privileged
        const roles = records[0].roles || [];
        if (roles.includes('full_admin_view')) return { role: 'full' };
        for (const r of ['payments', 'registrations', 'checkin']) {
          if (roles.includes(r)) return { role: r };
        }
        return { role: roles[0] || 'checkin' };
      }
      return null;
    },
    enabled: !!eventId && !!user?.email && !isGlobalAdmin,
    staleTime: 30000,
  });

  const role = isGlobalAdmin ? 'full' : (staffRecord?.role || null);

  /**
   * can(section) — returns true if the current role grants access to that section.
   * section examples: 'registrations', 'payments', 'checkin', 'categories', 'staffs', 'settings', 'overview'
   */
  function can(section) {
    if (!role) return false;
    if (role === 'full') return true;
    return (ROLE_ACCESS[role] || []).includes(section);
  }

  /**
   * visibleTabs — array of tab keys this role can see
   */
  const visibleTabs = role === 'full'
    ? ALL_TABS
    : (ROLE_ACCESS[role] || []);

  /**
   * defaultTab — first visible tab to land on
   */
  const defaultTab = visibleTabs[0] || null;

  return { role, can, visibleTabs, defaultTab, isLoading: !isGlobalAdmin && isLoading };
}