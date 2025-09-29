'use client';

import { useState } from 'react';
import { Card } from '@progress/kendo-react-layout';
import { Button } from '@progress/kendo-react-buttons';
import { Badge } from '@progress/kendo-react-indicators';
import { ProgressBar } from '@progress/kendo-react-progressbars';
import { DropDownList } from '@progress/kendo-react-dropdowns';

// Mock data for demonstration
const mockExpenses = [
  { category: 'Food & Dining', amount: 450, budget: 600, color: '#ff6b6b' },
  { category: 'Transportation', amount: 200, budget: 300, color: '#4ecdc4' },
  { category: 'Office Supplies', amount: 150, budget: 200, color: '#45b7d1' },
  { category: 'Utilities', amount: 300, budget: 400, color: '#96ceb4' },
  { category: 'Entertainment', amount: 100, budget: 150, color: '#feca57' },
];

const recentExpenses = [
  { id: 1, vendor: 'Starbucks', amount: 12.50, category: 'Food & Dining', date: '2024-01-15', status: 'confirmed' },
  { id: 2, vendor: 'Uber', amount: 25.00, category: 'Transportation', date: '2024-01-14', status: 'confirmed' },
  { id: 3, vendor: 'Office Depot', amount: 45.99, category: 'Office Supplies', date: '2024-01-13', status: 'pending' },
  { id: 4, vendor: 'Amazon', amount: 89.99, category: 'Office Supplies', date: '2024-01-12', status: 'confirmed' },
  { id: 5, vendor: 'Shell Gas', amount: 65.00, category: 'Transportation', date: '2024-01-11', status: 'confirmed' },
];

export function Dashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState('This Month');

  const totalSpent = mockExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const totalBudget = mockExpenses.reduce((sum, expense) => sum + expense.budget, 0);
  const pendingCount = recentExpenses.filter(expense => expense.status === 'pending').length;

  const periodOptions = ['This Week', 'This Month', 'Last Month', 'This Year'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Track your expenses and spending patterns</p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <DropDownList
            data={periodOptions}
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="w-40"
          />
          <Button
            themeColor="primary"
            className="px-6"
          >
            📤 Upload Receipt
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Spent</p>
              <p className="text-2xl font-bold text-gray-900">${totalSpent.toFixed(2)}</p>
            </div>
            <div className="text-3xl">💰</div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Budget Remaining</p>
              <p className="text-2xl font-bold text-green-600">${(totalBudget - totalSpent).toFixed(2)}</p>
            </div>
            <div className="text-3xl">📊</div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Receipts Processed</p>
              <p className="text-2xl font-bold text-blue-600">{recentExpenses.length}</p>
            </div>
            <div className="text-3xl">🧾</div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Review</p>
              <p className="text-2xl font-bold text-orange-600">{pendingCount}</p>
            </div>
            <div className="text-3xl">⏳</div>
          </div>
        </Card>
      </div>

      {/* Budget Progress */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Budget Progress</h3>
        <div className="space-y-4">
          {mockExpenses.map((expense) => {
            const percentage = (expense.amount / expense.budget) * 100;
            return (
              <div key={expense.category} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">{expense.category}</span>
                  <span className="text-sm text-gray-600">
                    ${expense.amount.toFixed(2)} / ${expense.budget.toFixed(2)}
                  </span>
                </div>
                <ProgressBar
                  value={percentage}
                  max={100}
                  className="h-2"
                />
              </div>
            );
          })}
        </div>
      </Card>

      {/* Recent Expenses */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Expenses</h3>
          <Button fillMode="outline" size="small">
            View All
          </Button>
        </div>
        <div className="space-y-3">
          {recentExpenses.slice(0, 5).map((expense) => (
            <div key={expense.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold">
                    {expense.vendor.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{expense.vendor}</p>
                  <p className="text-sm text-gray-600">{expense.category}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900">${expense.amount.toFixed(2)}</p>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500">{expense.date}</span>
                  <Badge
                    themeColor={expense.status === 'confirmed' ? 'success' : 'warning'}
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
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Spending by Category</h3>
          <div className="space-y-3">
            {mockExpenses.map((expense) => {
              const percentage = (expense.amount / totalSpent) * 100;
              return (
                <div key={expense.category} className="flex items-center space-x-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: expense.color }}
                  />
                  <div className="flex-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{expense.category}</span>
                      <span>${expense.amount.toFixed(2)}</span>
                    </div>
                    <ProgressBar
                      value={percentage}
                      max={100}
                      className="h-1 mt-1"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <Button
              themeColor="primary"
              className="w-full justify-start"
            >
              📤 Upload New Receipt
            </Button>
            <Button
              fillMode="outline"
              className="w-full justify-start"
            >
              ✏️ Review Pending ({pendingCount})
            </Button>
            <Button
              fillMode="outline"
              className="w-full justify-start"
            >
              📊 View Detailed Reports
            </Button>
            <Button
              fillMode="outline"
              className="w-full justify-start"
            >
              ⚙️ Manage Categories
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
