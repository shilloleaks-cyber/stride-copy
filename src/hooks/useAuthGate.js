import { useState } from 'react';

/**
 * useAuthGate — thin hook that provides a login-gate modal + auth check helper.
 *
 * Usage:
 *   const { AuthGateModal, requireAuth } = useAuthGate(user);
 *
 *   // In a handler:
 *   requireAuth(() => doTheProtectedThing());
 *
 *   // In JSX:
 *   <AuthGateModal />
 */
export function useAuthGate(user) {
  const [showGate, setShowGate] = useState(false);

  /**
   * If user is authenticated, run `action` immediately.
   * If guest, open the login modal instead.
   */
  function requireAuth(action) {
    if (user) {
      action();
    } else {
      setShowGate(true);
    }
  }

  return {
    showGate,
    setShowGate,
    requireAuth,
  };
}