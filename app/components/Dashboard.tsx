'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card } from '@progress/kendo-react-layout';
import { Button } from '@progress/kendo-react-buttons';
import { Badge } from '@progress/kendo-react-indicators';
import { ProgressBar } from '@progress/kendo-react-progressbars';
import { DropDownList } from '@progress/kendo-react-dropdowns';
import { Notification } from '@progress/kendo-react-notification';
import { getExpenses, getCategories, type Expense, type Category } from '../lib/database';
import { usePendingExpenses } from '../hooks/usePendingExpenses';

export function Dashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState('This Month');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Array<{ id: string; type: 'success' | 'error'; message: string }>>([]);
  const { pendingCount } = usePendingExpenses();

  const addNotification = useCallback((type: 'success' | 'error', message: string) => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [exp, cats] = await Promise.all([
          getExpenses(),
          getCategories().catch(() => [])
        ]);
        setExpenses(exp);
        setCategories(cats);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        addNotification('error', 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [addNotification]);

  const getCategoryName = (categoryId?: string) => {
    if (!categoryId) return 'Uncategorized';
    const category = categories.find(c => c.id === categoryId);
    return category?.name || 'Uncategorized';
  };

  // Aggregate totals
  const totalSpent = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const categoryTotals = expenses.reduce<Record<string, number>>((acc, e) => {
    const name = getCategoryName(e.category_id);
    acc[name] = (acc[name] || 0) + (e.amount || 0);
    return acc;
  }, {});
  const totalBudget = categories.reduce((sum, c) => sum + (c.budget || 0), 0);

  const periodOptions = ['This Week', 'This Month', 'Last Month', 'This Year'];

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Loading dashboard...</p>
        </div>
        <Card className="p-12 text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-gray-600">Fetching your latest expenses and categories…</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl p-6 sm:p-8 bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 text-white shadow-lg">
        <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.25) 0, transparent 40%), radial-gradient(circle at 80% 0%, rgba(255,255,255,0.18) 0, transparent 35%)' }} />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Dashboard</h1>
            <p className="text-white/80 mt-1">Track your expenses and spending patterns</p>
          </div>
          <div className="flex items-center gap-3">
            <DropDownList
              data={periodOptions}
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="w-44 rounded-lg"
            />
            <Button
              themeColor="primary"
              className="px-5 py-2 rounded-lg bg-white text-indigo-700 hover:bg-white/90 shadow-md"
            >
              📤 Upload Receipt
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 rounded-2xl border border-gray-200/70 shadow-sm bg-white/80 backdrop-blur">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Spent</p>
              <p className="text-3xl font-extrabold tracking-tight text-gray-900">${totalSpent.toFixed(2)}</p>
            </div>
            <div className="text-3xl">💰</div>
          </div>
        </Card>

        <Card className="p-6 rounded-2xl border border-gray-200/70 shadow-sm bg-white/80 backdrop-blur">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Budget Remaining</p>
              <p className="text-3xl font-extrabold tracking-tight text-emerald-600">${(totalBudget - totalSpent).toFixed(2)}</p>
            </div>
            <div className="text-3xl">📊</div>
          </div>
        </Card>

        <Card className="p-6 rounded-2xl border border-gray-200/70 shadow-sm bg-white/80 backdrop-blur">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Receipts Processed</p>
              <p className="text-3xl font-extrabold tracking-tight text-indigo-600">{expenses.length}</p>
            </div>
            <div className="text-3xl">🧾</div>
          </div>
        </Card>

        <Card className="p-6 rounded-2xl border border-gray-200/70 shadow-sm bg-white/80 backdrop-blur">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Review</p>
              <p className="text-3xl font-extrabold tracking-tight text-orange-600">{pendingCount}</p>
            </div>
            <div className="text-3xl">⏳</div>
          </div>
        </Card>
      </div>

      {/* Budget Progress */}
      <Card className="p-6 rounded-2xl border border-gray-200/70 shadow-sm bg-white/80 backdrop-blur">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Budget Progress</h3>
        <div className="space-y-4">
          {categories.map((category) => {
            const spent = categoryTotals[category.name] || 0;
            const budget = category.budget || 0;
            const percentage = budget > 0 ? (spent / budget) * 100 : 0;
            return (
              <div key={category.id} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">{category.name}</span>
                  <span className="text-sm text-gray-600">
                    ${spent.toFixed(2)} {budget ? `/ $${budget.toFixed(2)}` : ''}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                  <div className="h-full rounded-full" style={{ width: `${Math.min(percentage, 100)}%`, backgroundColor: category.color || '#6366f1' }} />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Recent Expenses */}
      <Card className="p-6 rounded-2xl border border-gray-200/70 shadow-sm bg-white/80 backdrop-blur">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Expenses</h3>
          <Button fillMode="outline" size="small" className="hover:shadow-sm">
            View All
          </Button>
        </div>
        <div className="space-y-3">
          {expenses.slice(0, 5).map((expense) => (
            <div key={expense.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center shadow-inner">
                  <span className="text-blue-600 font-semibold">
                    {expense.vendor.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{expense.vendor}</p>
                  <p className="text-sm text-gray-600">{getCategoryName(expense.category_id)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900 tabular-nums">${expense.amount.toFixed(2)}</p>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500">{new Date(expense.date).toLocaleDateString()}</span>
                  <Badge
                    themeColor={expense.status === 'confirmed' ? 'success' : expense.status === 'reviewed' ? 'info' : 'warning'}
                    size="small"
                  >
                    {expense.status}
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 rounded-2xl border border-gray-200/70 shadow-sm bg-white/80 backdrop-blur">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Spending by Category</h3>
          <div className="space-y-3">
            {Object.entries(categoryTotals).map(([name, amount]) => {
              const percentage = totalSpent > 0 ? (amount / totalSpent) * 100 : 0;
              const category = categories.find(c => c.name === name);
              const color = category?.color || '#e5e7eb';
              return (
                <div key={name} className="flex items-center space-x-3">
                  <div
                    className="w-4 h-4 rounded-full ring-2 ring-white"
                    style={{ backgroundColor: color }}
                  />
                  <div className="flex-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{name}</span>
                      <span>${amount.toFixed(2)}</span>
                    </div>
                    <div className="h-1 mt-1 w-full overflow-hidden rounded-full bg-gray-100">
                      <div className="h-full rounded-full" style={{ width: `${Math.min(percentage, 100)}%`, backgroundColor: color }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-6 rounded-2xl border border-gray-200/70 shadow-sm bg-white/80 backdrop-blur">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <Button
              themeColor="primary"
              className="w-full justify-start rounded-xl shadow-sm hover:shadow transition-shadow"
            >
              📤 Upload New Receipt
            </Button>
            <Button
              fillMode="outline"
              className="w-full justify-start rounded-xl hover:bg-gray-50"
            >
              ✏️ Review Pending ({pendingCount})
            </Button>
            <Button
              fillMode="outline"
              className="w-full justify-start rounded-xl hover:bg-gray-50"
            >
              📊 View Detailed Reports
            </Button>
            <Button
              fillMode="outline"
              className="w-full justify-start rounded-xl hover:bg-gray-50"
            >
              ⚙️ Manage Categories
            </Button>
          </div>
        </Card>
      </div>

      {/* Notifications */}
      <div className="fixed top-4 right-4 space-y-2 z-50">
        {notifications.map((notification) => (
          <Notification
            key={notification.id}
            closable
            onClose={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}
          >
            {notification.message}
          </Notification>
        ))}
      </div>
    </div>
  );
}
