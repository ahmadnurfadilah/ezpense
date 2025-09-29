'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@progress/kendo-react-buttons';
import { Badge } from '@progress/kendo-react-indicators';
import { useAuth } from '../contexts/AuthContext';
import { usePendingExpenses } from '../hooks/usePendingExpenses';

const navigation = [
  { name: 'Dashboard', href: '/', icon: '📊' },
  { name: 'Upload', href: '/upload', icon: '📤' },
  { name: 'Expenses', href: '/expenses', icon: '💰' },
  { name: 'Review', href: '/review', icon: '✏️' },
  { name: 'Settings', href: '/settings', icon: '⚙️' },
];

export function Navigation() {
  const pathname = usePathname();
  const { user, loading, signInAnonymously, signOut, isAnonymous } = useAuth();
  const { pendingCount } = usePendingExpenses();

  // Auto-sign in anonymously if no user
  useEffect(() => {
    if (!loading && !user) {
      signInAnonymously().catch(console.error);
    }
  }, [loading, user, signInAnonymously]);

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="text-2xl">🧾</div>
            <h1 className="text-xl font-bold text-gray-900">Ezpense</h1>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors relative ${
                    isActive
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.name}</span>
                  {item.name === 'Review' && pendingCount > 0 && (
                    <Badge
                      themeColor="error"
                      size="small"
                      className="ml-1"
                    >
                      {pendingCount}
                    </Badge>
                  )}
                </Link>
              );
            })}
          </div>

          {/* User Status */}
          <div className="flex items-center space-x-3">
            {loading ? (
              <div className="text-sm text-gray-500">Loading...</div>
            ) : user ? (
              <div className="flex items-center space-x-2 relative">
                <Badge
                  themeColor={isAnonymous ? 'warning' : 'success'}
                  size="small"
                >
                  {isAnonymous ? 'Anonymous' : 'Signed In'}
                </Badge>
                <Button
                  fillMode="outline"
                  size="small"
                  onClick={signOut}
                >
                  Sign Out
                </Button>
              </div>
            ) : (
              <Button
                themeColor="primary"
                size="small"
                onClick={signInAnonymously}
              >
                Get Started
              </Button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              fillMode="outline"
              size="small"
              className="text-gray-600"
            >
              ☰
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden border-t">
          <div className="py-2 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors relative ${
                    isActive
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.name}</span>
                  {item.name === 'Review' && pendingCount > 0 && (
                    <Badge
                      themeColor="error"
                      size="small"
                    >
                      {pendingCount}
                    </Badge>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
