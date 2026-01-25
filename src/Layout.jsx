import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Home, Activity, BarChart2, User, Users, Wallet } from 'lucide-react';

export default function Layout({ children }) {
  const location = useLocation();
  
  const navItems = [
    { name: 'หน้าหลัก', icon: Home, page: 'Home' },
    { name: 'ฟีด', icon: Users, page: 'Feed' },
    { name: 'กระเป๋า', icon: Wallet, page: 'Wallet' },
    { name: 'สถิติ', icon: BarChart2, page: 'Stats' },
    { name: 'โปรไฟล์', icon: User, page: 'Profile' },
  ];

  const isActivePage = (pageName) => {
    return location.pathname.includes(pageName);
  };

  // Hide nav on active run page
  const hideNav = location.pathname.includes('ActiveRun');

  return (
    <div className="min-h-screen bg-gray-950">
      {children}
      
      {!hideNav && (
        <nav className="fixed bottom-0 left-0 right-0 bg-gray-950/95 backdrop-blur-lg border-t border-white/5 px-6 py-4 safe-area-bottom">
          <div className="flex items-center justify-around max-w-md mx-auto">
            {navItems.map((item) => {
              const isActive = isActivePage(item.page);
              return (
                <Link
                  key={item.name}
                  to={createPageUrl(item.page)}
                  className={`flex flex-col items-center gap-1 transition-colors ${
                    isActive ? 'text-emerald-400' : 'text-gray-500 hover:text-gray-300'
                  }`}
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