import React, { useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Home, BarChart2, User, Users, CalendarDays } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import NotificationCenter from '@/components/notifications/NotificationCenter';
import './globals.css';

export default function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();

  // Detect system color scheme and toggle .dark class
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = (e) => {
      document.documentElement.classList.toggle('dark', e.matches);
    };
    apply(mq);
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  // Swipe-back gesture (right-edge swipe → navigate back)
  const swipeStartX = useRef(null);
  const swipeStartY = useRef(null);
  useEffect(() => {
    const onTouchStart = (e) => {
      const t = e.touches[0];
      if (t.clientX < 30) {
        swipeStartX.current = t.clientX;
        swipeStartY.current = t.clientY;
      } else {
        swipeStartX.current = null;
      }
    };
    const onTouchEnd = (e) => {
      if (swipeStartX.current === null) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - swipeStartX.current;
      const dy = Math.abs(t.clientY - swipeStartY.current);
      if (dx > 60 && dy < 80) {
        navigate(-1);
      }
      swipeStartX.current = null;
    };
    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchend', onTouchEnd);
    };
  }, [navigate]);
  
  const navItems = [
    { name: 'หน้าหลัก', icon: Home, page: 'Home' },
    { name: 'เทรน', icon: BarChart2, page: 'Training' },
    { name: 'ฟีด', icon: Users, page: 'Feed' },
    { name: 'Events', icon: CalendarDays, page: 'Events' },
    { name: 'โปรไฟล์', icon: User, page: 'Profile' },
  ];

  const { data: user } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me() });

  const isActivePage = (pageName) => location.pathname.includes(pageName);

  // Hide nav on active run page
  const hideNav = location.pathname.includes('ActiveRun');

  const handleNavTap = (e, item) => {
    const isActive = isActivePage(item.page);
    if (isActive) {
      // Already on this tab — reset to root by replacing current history entry
      e.preventDefault();
      navigate(createPageUrl(item.page), { replace: true });
      // Haptic feedback
      if (navigator.vibrate) navigator.vibrate(10);
    } else {
      if (navigator.vibrate) navigator.vibrate(10);
    }
  };

  // Hide notification bell on admin/workspace pages (they have their own header context)
  const hideNotifBell = location.pathname.includes('AdminEvents') || location.pathname.includes('EventWorkspace');

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0A0A0A' }}>
      {/* ── Global Notification Bell (top-right, above all content) ── */}
      {user && !hideNotifBell && (
        <div style={{
          position: 'fixed',
          top: 'max(env(safe-area-inset-top, 0px), 12px)',
          right: 14,
          zIndex: 9998,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <NotificationCenter user={user} />
        </div>
      )}
      {children}
      
      {!hideNav && (
        <nav
          className="fixed bottom-0 left-0 right-0 backdrop-blur-lg border-t border-white/5 px-6 pt-4 safe-area-bottom"
          style={{ backgroundColor: 'rgba(10, 10, 10, 0.95)', zIndex: 9999, pointerEvents: 'auto' }}
        >
          <div className="flex items-center justify-around max-w-md mx-auto">
            {navItems.map((item) => {
              const isActive = isActivePage(item.page);
              return (
                <Link
                  key={item.name}
                  to={createPageUrl(item.page)}
                  onClick={(e) => handleNavTap(e, item)}
                  className={`flex flex-col items-center gap-1 transition-colors min-w-[44px] min-h-[44px] justify-center ${
                    isActive ? 'neon-text' : 'text-gray-500'
                  }`}
                  style={isActive ? { color: '#BFFF00' } : {}}
                >
                  <item.icon className="w-6 h-6" />
                  <span className="text-xs">{item.name}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}