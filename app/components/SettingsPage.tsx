'use client';

import { useState } from 'react';
import { Card } from '@progress/kendo-react-layout';
import { Button } from '@progress/kendo-react-buttons';
import { TextBox, NumericTextBox } from '@progress/kendo-react-inputs';
import { DropDownList } from '@progress/kendo-react-dropdowns';
import { Switch } from '@progress/kendo-react-inputs';
import { Notification } from '@progress/kendo-react-notification';
import { Dialog } from '@progress/kendo-react-dialogs';

interface Category {
  id: string;
  name: string;
  color: string;
  budget?: number;
}

interface Budget {
  category: string;
  amount: number;
  period: 'monthly' | 'weekly' | 'yearly';
}

// Mock data
const initialCategories: Category[] = [
  { id: '1', name: 'Food & Dining', color: '#ff6b6b', budget: 600 },
  { id: '2', name: 'Transportation', color: '#4ecdc4', budget: 300 },
  { id: '3', name: 'Office Supplies', color: '#45b7d1', budget: 200 },
  { id: '4', name: 'Utilities', color: '#96ceb4', budget: 400 },
  { id: '5', name: 'Entertainment', color: '#feca57', budget: 150 },
  { id: '6', name: 'Healthcare', color: '#ff9ff3', budget: 100 },
  { id: '7', name: 'Travel', color: '#54a0ff', budget: 500 },
  { id: '8', name: 'Other', color: '#5f27cd', budget: 100 },
];

const colorOptions = [
  '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57',
  '#ff9ff3', '#54a0ff', '#5f27cd', '#00d2d3', '#ff9f43',
  '#10ac84', '#ee5a24', '#0984e3', '#6c5ce7', '#a29bfe'
];

const periodOptions = [
  { text: 'Monthly', value: 'monthly' },
  { text: 'Weekly', value: 'weekly' },
  { text: 'Yearly', value: 'yearly' }
];

export function SettingsPage() {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [newCategory, setNewCategory] = useState({ name: '', color: '#ff6b6b', budget: 0 });
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [notifications, setNotifications] = useState<Array<{ id: string; type: 'success' | 'error'; message: string }>>([]);
  const [settings, setSettings] = useState({
    autoCategorize: true,
    emailNotifications: true,
    budgetAlerts: true,
    currency: 'USD',
    dateFormat: 'MM/DD/YYYY',
    theme: 'light'
  });

  const addNotification = (type: 'success' | 'error', message: string) => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  const handleAddCategory = () => {
    if (!newCategory.name.trim()) {
      addNotification('error', 'Category name is required');
      return;
    }

    const category: Category = {
      id: Date.now().toString(),
      name: newCategory.name,
      color: newCategory.color,
      budget: newCategory.budget || undefined
    };

    setCategories(prev => [...prev, category]);
    setNewCategory({ name: '', color: '#ff6b6b', budget: 0 });
    setShowAddCategory(false);
    addNotification('success', 'Category added successfully');
  };

  const handleDeleteCategory = (categoryId: string) => {
    setCategories(prev => prev.filter(cat => cat.id !== categoryId));
    addNotification('success', 'Category deleted');
  };

  const handleUpdateBudget = (categoryId: string, budget: number) => {
    setCategories(prev => prev.map(cat =>
      cat.id === categoryId ? { ...cat, budget } : cat
    ));
    addNotification('success', 'Budget updated');
  };

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    addNotification('success', 'Setting updated');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">
          Manage your categories, budgets, and preferences
        </p>
      </div>

      {/* Categories */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Expense Categories</h3>
          <Button
            themeColor="primary"
            onClick={() => setShowAddCategory(true)}
          >
            Add Category
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((category) => (
            <div key={category.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  <span className="font-medium text-gray-900">{category.name}</span>
                </div>
                <Button
                  fillMode="outline"
                  size="small"
                  onClick={() => handleDeleteCategory(category.id)}
                >
                  Delete
                </Button>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Budget
                </label>
                <NumericTextBox
                  value={category.budget || 0}
                  onChange={(e) => handleUpdateBudget(category.id, e.target.value || 0)}
                  format="c2"
                  className="w-full"
                  placeholder="No budget set"
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Budget Settings */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Budget Settings</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Budget Alerts</h4>
              <p className="text-sm text-gray-600">Get notified when approaching budget limits</p>
            </div>
            <Switch
              checked={settings.budgetAlerts}
              onChange={(e) => handleSettingChange('budgetAlerts', e.target.value)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Auto-categorize Expenses</h4>
              <p className="text-sm text-gray-600">Automatically categorize expenses based on vendor patterns</p>
            </div>
            <Switch
              checked={settings.autoCategorize}
              onChange={(e) => handleSettingChange('autoCategorize', e.target.value)}
            />
          </div>
        </div>
      </Card>

      {/* Notification Settings */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Notifications</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Email Notifications</h4>
              <p className="text-sm text-gray-600">Receive email updates about your expenses</p>
            </div>
            <Switch
              checked={settings.emailNotifications}
              onChange={(e) => handleSettingChange('emailNotifications', e.target.value)}
            />
          </div>
        </div>
      </Card>

      {/* General Settings */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">General Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Currency
            </label>
            <DropDownList
              data={['USD', 'EUR', 'GBP', 'CAD', 'AUD']}
              value={settings.currency}
              onChange={(e) => handleSettingChange('currency', e.target.value)}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date Format
            </label>
            <DropDownList
              data={['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD']}
              value={settings.dateFormat}
              onChange={(e) => handleSettingChange('dateFormat', e.target.value)}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Theme
            </label>
            <DropDownList
              data={['light', 'dark', 'auto']}
              value={settings.theme}
              onChange={(e) => handleSettingChange('theme', e.target.value)}
              className="w-full"
            />
          </div>
        </div>
      </Card>

      {/* Data Management */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Management</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Export Data</h4>
              <p className="text-sm text-gray-600">Download your expense data as CSV or PDF</p>
            </div>
            <div className="flex space-x-2">
              <Button fillMode="outline" size="small">
                Export CSV
              </Button>
              <Button fillMode="outline" size="small">
                Export PDF
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Backup Data</h4>
              <p className="text-sm text-gray-600">Create a backup of all your expense data</p>
            </div>
            <Button fillMode="outline" size="small">
              Create Backup
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-red-600">Delete All Data</h4>
              <p className="text-sm text-gray-600">Permanently delete all your expense data</p>
            </div>
            <Button
              fillMode="outline"
              size="small"
              className="text-red-600 border-red-600 hover:bg-red-50"
            >
              Delete All
            </Button>
          </div>
        </div>
      </Card>

      {/* Add Category Dialog */}
      <Dialog
        title="Add New Category"
        onClose={() => setShowAddCategory(false)}
        visible={showAddCategory}
        width={400}
      >
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category Name
            </label>
            <TextBox
              value={newCategory.name}
              onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter category name"
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Color
            </label>
            <div className="flex space-x-2">
              {colorOptions.map((color) => (
                <button
                  key={color}
                  className={`w-8 h-8 rounded-full border-2 ${
                    newCategory.color === color ? 'border-gray-400' : 'border-gray-200'
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => setNewCategory(prev => ({ ...prev, color }))}
                />
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Budget (Optional)
            </label>
            <NumericTextBox
              value={newCategory.budget}
              onChange={(e) => setNewCategory(prev => ({ ...prev, budget: e.target.value || 0 }))}
              format="c2"
              className="w-full"
              placeholder="No budget"
            />
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              fillMode="outline"
              onClick={() => setShowAddCategory(false)}
            >
              Cancel
            </Button>
            <Button
              themeColor="primary"
              onClick={handleAddCategory}
            >
              Add Category
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Notifications */}
      <div className="fixed top-4 right-4 space-y-2 z-50">
        {notifications.map((notification) => (
          <Notification
            key={notification.id}
            type={notification.type}
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
