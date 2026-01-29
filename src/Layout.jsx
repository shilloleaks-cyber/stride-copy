import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Home, Activity, BarChart2, User, Users, Wallet, Trophy } from 'lucide-react';

export default function Layout({ children }) {
  const location = useLocation();
  
  const navItems = [
    { name: 'หน้าหลัก', icon: Home, page: 'Home' },
    { name: 'เทรน', icon: BarChart2, page: 'Training' },
    { name: 'ฟีด', icon: Users, page: 'Feed' },
    { name: 'กลุ่ม', icon: Users, page: 'Groups' },
    { name: 'โปรไฟล์', icon: User, page: 'Profile' },
  ];

  const isActivePage = (pageName) => {
    return location.pathname.includes(pageName);
  };

  // Hide nav on active run page
  const hideNav = location.pathname.includes('ActiveRun');

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0A0A0A' }}>
      {children}
      
      {!hideNav && (
        <nav className="fixed bottom-0 left-0 right-0 backdrop-blur-lg border-t border-white/5 px-6 py-4 safe-area-bottom" style={{ backgroundColor: 'rgba(10, 10, 10, 0.95)' }}>
          <div className="flex items-center justify-around max-w-md mx-auto">
            {navItems.map((item) => {
              const isActive = isActivePage(item.page);
              return (
                <Link
                  key={item.name}
                  to={createPageUrl(item.page)}
                  className={`flex flex-col items-center gap-1 transition-colors ${
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