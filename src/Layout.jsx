import React, { useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Home, BarChart2, User, Users, CalendarDays } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useLanguage } from '@/lib/LanguageContext';
import './globals.css';

export const isGlobalAdmin = (user) => user?.role === 'admin';

export default function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();

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
  
  const { data: user } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me() });

  const adminOnly = isGlobalAdmin(user);

  const allNavItems = [
    { nameKey: 'nav_home',    icon: Home,        page: 'Home',     adminOnly: true },
    { nameKey: 'nav_train',   icon: BarChart2,   page: 'Training', adminOnly: true },
    { nameKey: 'nav_feed',    icon: Users,        page: 'Feed',     adminOnly: false },
    { nameKey: 'nav_events',  icon: CalendarDays, page: 'Events',   adminOnly: false },
    { nameKey: 'nav_profile', icon: User,         page: 'Profile',  adminOnly: false },
  ];

  const navItems = allNavItems.filter(item => !item.adminOnly || adminOnly);

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

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0A0A0A' }}>
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
                  key={item.nameKey}
                  to={createPageUrl(item.page)}
                  onClick={(e) => handleNavTap(e, item)}
                  className={`flex flex-col items-center gap-1 transition-colors min-w-[44px] min-h-[44px] justify-center ${
                    isActive ? 'neon-text' : 'text-gray-500'
                  }`}
                  style={isActive ? { color: '#BFFF00' } : {}}
                >
                  <item.icon className="w-6 h-6" />
                  <span className="text-xs">{t(item.nameKey)}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}