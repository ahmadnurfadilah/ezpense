'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Card } from '@progress/kendo-react-layout';
import { Button } from '@progress/kendo-react-buttons';
import { Grid, GridColumn } from '@progress/kendo-react-grid';
import type { GridRowClickEvent } from '@progress/kendo-react-grid';
import { DropDownList } from '@progress/kendo-react-dropdowns';
import type { DropDownListChangeEvent } from '@progress/kendo-react-dropdowns';
import { TextBox } from '@progress/kendo-react-inputs';
import type { TextBoxChangeEvent } from '@progress/kendo-react-inputs';
import { Badge } from '@progress/kendo-react-indicators';
import { Dialog } from '@progress/kendo-react-dialogs';
import { Notification } from '@progress/kendo-react-notification';
import { getExpenses, getCategories, type Expense, type Category } from '../lib/database';

const defaultCategories = [
  'Food & Dining',
  'Transportation',
  'Office Supplies',
  'Utilities',
  'Entertainment',
  'Healthcare',
  'Travel',
  'Other'
];

const statusOptions = [
  { text: 'All Status', value: 'all' },
  { text: 'Confirmed', value: 'confirmed' },
  { text: 'Pending', value: 'pending' },
  { text: 'Reviewed', value: 'reviewed' }
];

export function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Array<{ id: string; type: 'success' | 'error'; message: string }>>([]);

  const addNotification = useCallback((type: 'success' | 'error', message: string) => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  }, []);

  // Load expenses and categories on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [expensesData, categoriesData] = await Promise.all([
          getExpenses(),
          getCategories().catch(() => []) // Fallback to empty array if categories fail
        ]);

        setExpenses(expensesData);
        setCategories(categoriesData);
      } catch (error) {
        console.error('Error loading data:', error);
        addNotification('error', 'Failed to load expenses data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [addNotification]);

  const getCategoryName = useCallback((categoryId?: string) => {
    if (!categoryId) return 'Uncategorized';
    const category = categories.find(c => c.id === categoryId);
    return category?.name || 'Uncategorized';
  }, [categories]);

  // Filter expenses based on search and filters
  const applyFilters = useCallback(() => {
    let filtered = expenses;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(expense => {
        const categoryName = getCategoryName(expense.category_id);
        return categoryName === selectedCategory;
      });
    }

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(expense => expense.status === selectedStatus);
    }

    if (searchTerm) {
      filtered = filtered.filter(expense =>
        expense.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredExpenses(filtered);
  }, [expenses, selectedCategory, selectedStatus, searchTerm, getCategoryName]);

  // Apply filters when dependencies change
  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const handleCategoryChange = (e: DropDownListChangeEvent) => {
    const rawValue = e.value;
    const nextValue = typeof rawValue === 'object' && rawValue !== null ? rawValue.value : rawValue;
    setSelectedCategory(nextValue as string);
  };

  const handleStatusChange = (e: DropDownListChangeEvent) => {
    const rawValue = e.value;
    const nextValue = typeof rawValue === 'object' && rawValue !== null ? rawValue.value : rawValue;
    setSelectedStatus(nextValue as string);
  };

  const handleSearchChange = (e: TextBoxChangeEvent) => {
    setSearchTerm(String(e.value ?? ''));
  };

  const getCategoryOptions = () => {
    const allCategories = [{ text: 'All Categories', value: 'all' }];
    if (categories.length > 0) {
      return [...allCategories, ...categories.map(c => ({ text: c.name, value: c.name }))];
    } else {
      return [...allCategories, ...defaultCategories.map(c => ({ text: c, value: c }))];
    }
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Vendor', 'Amount', 'Category', 'Status', 'Notes'];
    const csvContent = [
      headers.join(','),
      ...filteredExpenses.map(expense => [
        new Date(expense.date).toLocaleDateString(),
        `"${expense.vendor}"`,
        expense.amount.toFixed(2),
        `"${getCategoryName(expense.category_id)}"`,
        expense.status,
        `"${expense.notes || ''}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expenses-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    addNotification('success', 'Expenses exported to CSV successfully!');
  };

  const handleRowClick = (e: GridRowClickEvent) => {
    const expense = e.dataItem as Expense;
    setSelectedExpense(expense);
    setShowDetailDialog(true);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      confirmed: { themeColor: 'success' as const, text: 'Confirmed' },
      pending: { themeColor: 'warning' as const, text: 'Pending' },
      reviewed: { themeColor: 'info' as const, text: 'Reviewed' }
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    return (
      <Badge themeColor={config.themeColor} size="small">
        {config.text}
      </Badge>
    );
  };

  const totalAmount = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);

  const gridData = filteredExpenses.map(expense => ({
    ...expense,
    dateDisplay: new Date(expense.date).toLocaleDateString(),
    amountDisplay: `$${expense.amount.toFixed(2)}`,
    categoryDisplay: getCategoryName(expense.category_id),
    statusDisplay: expense.status,
    notesDisplay: expense.notes || '-'
  }));

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Expenses</h1>
          <p className="text-gray-600 mt-1">Loading expenses...</p>
        </div>
        <Card className="p-12 text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-gray-600">Loading your expenses...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Expenses</h1>
        <p className="text-gray-600 mt-1">
          View and manage all your tracked expenses
        </p>
      </div>

      {/* Summary Card */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Total Expenses</h3>
            <p className="text-3xl font-bold text-blue-600">${totalAmount.toFixed(2)}</p>
            <p className="text-sm text-gray-600">
              {filteredExpenses.length} expenses found
            </p>
          </div>
          <div className="text-6xl">💰</div>
        </div>
      </Card>

      {/* Filters */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <TextBox
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Search vendors or notes..."
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <DropDownList
              data={getCategoryOptions()}
              textField="text"
              dataItemKey="value"
              value={getCategoryOptions().find(o => o.value === selectedCategory) || getCategoryOptions()[0]}
              onChange={handleCategoryChange}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <DropDownList
              data={statusOptions}
              textField="text"
              dataItemKey="value"
              value={statusOptions.find(o => o.value === selectedStatus) || statusOptions[0]}
              onChange={handleStatusChange}
              className="w-full"
            />
          </div>
          <div className="flex items-end">
            <Button
              fillMode="outline"
              className="w-full"
              onClick={exportToCSV}
            >
              Export CSV
            </Button>
          </div>
        </div>
      </Card>

      {/* Expenses Grid */}
      <Card className="p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Expense History
          </h3>
        </div>

        <Grid
          data={gridData}
          style={{ height: '600px' }}
          onRowClick={handleRowClick}
          className="cursor-pointer"
        >
          <GridColumn field="dateDisplay" title="Date" width="120px" />
          <GridColumn
            field="vendor"
            title="Vendor"
            width="150px"
          />
          <GridColumn field="amountDisplay" title="Amount" width="100px" />
          <GridColumn field="categoryDisplay" title="Category" width="150px" />
          <GridColumn field="statusDisplay" title="Status" width="120px" />
          <GridColumn field="notesDisplay" title="Notes" />
        </Grid>
      </Card>

      {/* Expense Detail Dialog */}
      {showDetailDialog && (
        <Dialog
          title="Expense Details"
          onClose={() => setShowDetailDialog(false)}
          width={600}
        >
          {selectedExpense && (
            <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Receipt Image */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Receipt</h4>
                <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                  {selectedExpense.receipt_url ? (
                    <Image
                      src={selectedExpense.receipt_url}
                      alt="Receipt"
                      width={200}
                      height={192}
                      className="w-full h-full object-contain rounded-lg"
                    />
                  ) : (
                    <span className="text-4xl">🧾</span>
                  )}
                </div>
              </div>

              {/* Expense Details */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Vendor</label>
                  <p className="text-lg font-semibold text-gray-900">{selectedExpense.vendor}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Amount</label>
                  <p className="text-2xl font-bold text-blue-600">${selectedExpense.amount.toFixed(2)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Category</label>
                  <p className="text-gray-900">{getCategoryName(selectedExpense.category_id)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date</label>
                  <p className="text-gray-900">{new Date(selectedExpense.date).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <div className="mt-1">
                    {getStatusBadge(selectedExpense.status)}
                  </div>
                </div>
                {selectedExpense.notes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Notes</label>
                    <p className="text-gray-900">{selectedExpense.notes}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6 pt-6 border-t">
              <Button
                fillMode="outline"
                onClick={() => setShowDetailDialog(false)}
              >
                Close
              </Button>
              <Button
                themeColor="primary"
                onClick={() => {
                  // In a real app, this would open the edit form
                  setShowDetailDialog(false);
                }}
              >
                Edit
              </Button>
            </div>
            </div>
          )}
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
