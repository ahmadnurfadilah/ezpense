'use client';

import { useEffect, useState } from 'react';
import { Card } from '@progress/kendo-react-layout';
import { Button } from '@progress/kendo-react-buttons';
import { TextBox, NumericTextBox } from '@progress/kendo-react-inputs';
import { DropDownList } from '@progress/kendo-react-dropdowns';
import { Switch } from '@progress/kendo-react-inputs';
import { Notification } from '@progress/kendo-react-notification';
import { Dialog } from '@progress/kendo-react-dialogs';
import {
  getCategories,
  createCategory as apiCreateCategory,
  deleteCategory as apiDeleteCategory,
  updateCategory as apiUpdateCategory,
  getUserPreferences,
  updateUserPreferences,
  type Category as DbCategory,
  type UserPreferences as DbUserPreferences,
} from '@/app/lib/database';

interface Category {
  id: string;
  name: string;
  color: string;
  budget?: number;
}

interface Settings {
  autoCategorize: boolean;
  emailNotifications: boolean;
  budgetAlerts: boolean;
  currency: 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD';
  dateFormat: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
  theme: 'light' | 'dark' | 'auto';
}

// Loaded from API
const initialCategories: Category[] = [];

const colorOptions = [
  '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57',
  '#ff9ff3', '#54a0ff', '#5f27cd', '#00d2d3', '#ff9f43',
  '#10ac84', '#ee5a24', '#0984e3', '#6c5ce7', '#a29bfe'
];

// removed unused periodOptions

export function SettingsPage() {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [newCategory, setNewCategory] = useState({ name: '', color: '#ff6b6b', budget: 0 });
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [notifications, setNotifications] = useState<Array<{ id: string; type: 'success' | 'error'; message: string }>>([]);
  const [settings, setSettings] = useState<Settings>({
    autoCategorize: true,
    emailNotifications: true,
    budgetAlerts: true,
    currency: 'USD',
    dateFormat: 'MM/DD/YYYY',
    theme: 'light'
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const addNotification = (type: 'success' | 'error', message: string) => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        const [cats, prefs] = await Promise.all([
          getCategories(),
          getUserPreferences(),
        ]);

        const mappedCats: Category[] = (cats || []).map((c: DbCategory) => ({
          id: c.id,
          name: c.name,
          color: c.color,
          budget: typeof c.budget === 'number' ? c.budget : c.budget ? Number(c.budget) : undefined,
        }));
        setCategories(mappedCats);

        if (prefs) {
          const mappedSettings: Settings = {
            autoCategorize: prefs.auto_categorize,
            emailNotifications: prefs.email_notifications,
            budgetAlerts: prefs.budget_alerts,
            currency: (prefs.currency as Settings['currency']) ?? 'USD',
            dateFormat: (prefs.date_format as Settings['dateFormat']) ?? 'MM/DD/YYYY',
            theme: (prefs.theme as Settings['theme']) ?? 'light',
          };
          setSettings(mappedSettings);
        }
      } catch (err) {
        console.error(err);
        addNotification('error', 'Failed to load settings');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const handleAddCategory = async () => {
    if (!newCategory.name.trim()) {
      addNotification('error', 'Category name is required');
      return;
    }
    try {
      const created = await apiCreateCategory({
        name: newCategory.name,
        color: newCategory.color,
        budget: newCategory.budget || undefined,
        created_at: undefined as unknown as string, // ignored by API typing at runtime
        updated_at: undefined as unknown as string,
        id: undefined as unknown as string,
      } as unknown as Omit<DbCategory, 'id' | 'created_at' | 'updated_at'>);

      setCategories(prev => [...prev, {
        id: created.id,
        name: created.name,
        color: created.color,
        budget: typeof created.budget === 'number' ? created.budget : created.budget ? Number(created.budget) : undefined,
      }]);
      setNewCategory({ name: '', color: '#ff6b6b', budget: 0 });
      setShowAddCategory(false);
      addNotification('success', 'Category added successfully');
    } catch (err) {
      console.error(err);
      addNotification('error', 'Failed to add category');
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    try {
      await apiDeleteCategory(categoryId);
      setCategories(prev => prev.filter(cat => cat.id !== categoryId));
      addNotification('success', 'Category deleted');
    } catch (err) {
      console.error(err);
      addNotification('error', 'Failed to delete category');
    }
  };

  const handleUpdateBudget = async (categoryId: string, budget: number) => {
    try {
      setCategories(prev => prev.map(cat =>
        cat.id === categoryId ? { ...cat, budget } : cat
      ));
      await apiUpdateCategory(categoryId, { budget });
      addNotification('success', 'Budget updated');
    } catch (err) {
      console.error(err);
      addNotification('error', 'Failed to update budget');
    }
  };

  const handleSettingChange = async <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    try {
      setIsSavingSettings(true);
      const updates: Partial<DbUserPreferences> = {};
      if (key === 'autoCategorize') updates.auto_categorize = value as boolean;
      if (key === 'emailNotifications') updates.email_notifications = value as boolean;
      if (key === 'budgetAlerts') updates.budget_alerts = value as boolean;
      if (key === 'currency') updates.currency = value as string;
      if (key === 'dateFormat') updates.date_format = value as string;
      if (key === 'theme') updates.theme = value as string;
      await updateUserPreferences(updates);
      addNotification('success', 'Setting updated');
    } catch (err) {
      console.error(err);
      addNotification('error', 'Failed to update setting');
    } finally {
      setIsSavingSettings(false);
    }
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

        {isLoading ? (
          <div className="text-gray-600">Loading categories...</div>
        ) : (
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
                  onChange={(e) => handleUpdateBudget(category.id, (e.value ?? 0) as number)}
                  format="c2"
                  className="w-full"
                  placeholder="No budget set"
                />
              </div>
            </div>
          ))}
        </div>
        )}
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
              onChange={(e) => handleSettingChange('budgetAlerts', e.value as boolean)}
              disabled={isSavingSettings}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Auto-categorize Expenses</h4>
              <p className="text-sm text-gray-600">Automatically categorize expenses based on vendor patterns</p>
            </div>
            <Switch
              checked={settings.autoCategorize}
              onChange={(e) => handleSettingChange('autoCategorize', e.value as boolean)}
              disabled={isSavingSettings}
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
              onChange={(e) => handleSettingChange('emailNotifications', e.value as boolean)}
              disabled={isSavingSettings}
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
              onChange={(e) => handleSettingChange('currency', e.value as Settings['currency'])}
              className="w-full"
              disabled={isSavingSettings}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date Format
            </label>
            <DropDownList
              data={['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD']}
              value={settings.dateFormat}
              onChange={(e) => handleSettingChange('dateFormat', e.value as Settings['dateFormat'])}
              className="w-full"
              disabled={isSavingSettings}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Theme
            </label>
            <DropDownList
              data={['light', 'dark', 'auto']}
              value={settings.theme}
              onChange={(e) => handleSettingChange('theme', e.value as Settings['theme'])}
              className="w-full"
              disabled={isSavingSettings}
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
      {showAddCategory && (
      <Dialog
        title="Add New Category"
        onClose={() => setShowAddCategory(false)}
        width={400}
      >
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category Name
            </label>
            <TextBox
              value={newCategory.name}
              onChange={(e) => setNewCategory(prev => ({ ...prev, name: String(e.value ?? '') }))}
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
              onChange={(e) => setNewCategory(prev => ({ ...prev, budget: (e.value ?? 0) as number }))}
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
      )}

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
