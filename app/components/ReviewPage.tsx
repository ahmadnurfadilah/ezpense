'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Card } from '@progress/kendo-react-layout';
import { Button } from '@progress/kendo-react-buttons';
import { TextBox, NumericTextBox } from '@progress/kendo-react-inputs';
import { DropDownList } from '@progress/kendo-react-dropdowns';
import { DatePicker } from '@progress/kendo-react-dateinputs';
import { Badge } from '@progress/kendo-react-indicators';
import { Notification } from '@progress/kendo-react-notification';
import { getExpenses, updateExpense, deleteExpense, getCategories, type Expense, type Category } from '../lib/database';


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

export function ReviewPage() {
  const router = useRouter();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [edits, setEdits] = useState<Partial<Expense>>({});
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [notifications, setNotifications] = useState<Array<{ id: string; type: 'success' | 'error'; message: string }>>([]);
  const [loading, setLoading] = useState(true);

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

  const handleExpenseSelect = (expense: Expense) => {
    setSelectedExpense(expense);
    setEdits({
      vendor: expense.vendor,
      amount: expense.amount,
      notes: expense.notes,
      category_id: expense.category_id
    });
  };

  const handleEditChange = (field: keyof Expense, value: string | number | Date | null | undefined | readonly string[]) => {
    setEdits(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!selectedExpense) return;

    try {
      await updateExpense(selectedExpense.id, {
        ...edits,
        status: 'reviewed'
      });

      // Refresh expenses list
      const updatedExpenses = await getExpenses();
      setExpenses(updatedExpenses);

      addNotification('success', 'Expense updated successfully!');
      setSelectedExpense(null);
      setEdits({});
    } catch (error) {
      console.error('Error updating expense:', error);
      addNotification('error', 'Failed to update expense');
    }
  };

  const handleConfirm = async () => {
    if (!selectedExpense) return;

    try {
      await updateExpense(selectedExpense.id, {
        ...edits,
        status: 'confirmed'
      });

      // Refresh expenses list
      const updatedExpenses = await getExpenses();
      setExpenses(updatedExpenses);

      addNotification('success', 'Expense confirmed and saved!');
      setSelectedExpense(null);
      setEdits({});
      setShowConfirmDialog(false);
    } catch (error) {
      console.error('Error confirming expense:', error);
      addNotification('error', 'Failed to confirm expense');
    }
  };

  const handleSkip = async (expenseId: string) => {
    try {
      await deleteExpense(expenseId);

      // Refresh expenses list
      const updatedExpenses = await getExpenses();
      setExpenses(updatedExpenses);

      addNotification('success', 'Expense removed');
    } catch (error) {
      console.error('Error removing expense:', error);
      addNotification('error', 'Failed to remove expense');
    }
  };

  const getConfidenceColor = (confidence?: number) => {
    if (!confidence) return 'warning';
    if (confidence >= 0.9) return 'success';
    if (confidence >= 0.7) return 'warning';
    return 'error';
  };

  const getConfidenceText = (confidence?: number) => {
    if (!confidence) return 'Unknown';
    if (confidence >= 0.9) return 'High';
    if (confidence >= 0.7) return 'Medium';
    return 'Low';
  };

  const getCategoryName = (categoryId?: string) => {
    if (!categoryId) return 'Uncategorized';
    const category = categories.find(c => c.id === categoryId);
    return category?.name || 'Uncategorized';
  };

  const getCategoryOptions = () => {
    if (categories.length > 0) {
      return categories;
    } else {
      return defaultCategories.map(c => ({ id: c, name: c }));
    }
  };

  // Filter expenses to show only pending ones for review
  const pendingExpenses = expenses.filter(expense => expense.status === 'pending');

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Review Receipts</h1>
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
        <h1 className="text-3xl font-bold text-gray-900">Review Receipts</h1>
        <p className="text-gray-600 mt-1">
          Review and edit AI-extracted data from your receipts
        </p>
      </div>

      {pendingExpenses.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="text-6xl mb-4">✅</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No receipts to review
          </h3>
          <p className="text-gray-600 mb-4">
            All your receipts have been reviewed. Upload new receipts to get started.
          </p>
          <Button
            themeColor="primary"
            onClick={() => router.push('/upload')}
          >
            Upload Receipts
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Receipt List */}
          <div className="lg:col-span-1">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Pending Review ({pendingExpenses.length})
              </h3>
              <div className="space-y-3">
                {pendingExpenses.map((expense) => (
                  <div
                    key={expense.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedExpense?.id === expense.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleExpenseSelect(expense)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                        {expense.receipt_url ? (
                          <Image
                            src={expense.receipt_url}
                            alt="Receipt"
                            width={48}
                            height={48}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <span className="text-lg">🧾</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 relative">
                          <h4 className="font-medium text-gray-900">
                            {expense.vendor}
                          </h4>
                          <Badge
                            themeColor={getConfidenceColor(expense.confidence_score)}
                            size="small"
                          >
                            {getConfidenceText(expense.confidence_score)}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                          ${expense.amount.toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(expense.date).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-500">
                          {getCategoryName(expense.category_id)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Review Panel */}
          <div className="lg:col-span-2">
            {selectedExpense ? (
              <Card className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Receipt Image */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Receipt Image</h3>
                    <div className="border rounded-lg p-4 bg-gray-50">
                      {selectedExpense.receipt_url ? (
                        <Image
                          src={selectedExpense.receipt_url}
                          alt="Receipt"
                          width={400}
                          height={256}
                          className="w-full h-64 object-contain rounded-lg bg-white"
                        />
                      ) : (
                        <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">
                          <span className="text-4xl">🧾</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Extracted Data */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Extracted Data</h3>
                    <div className="space-y-4">
                      {/* Amount */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Amount
                        </label>
                        <NumericTextBox
                          value={edits.amount ?? selectedExpense.amount}
                          onChange={(e) => handleEditChange('amount', e.target.value)}
                          format="c2"
                          className="w-full"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          AI Confidence: {selectedExpense.confidence_score ? Math.round(selectedExpense.confidence_score * 100) : 'Unknown'}%
                        </p>
                      </div>

                      {/* Vendor */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Vendor
                        </label>
                        <TextBox
                          value={edits.vendor ?? selectedExpense.vendor}
                          onChange={(e) => handleEditChange('vendor', e.target.value)}
                          className="w-full"
                        />
                      </div>

                      {/* Date */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Date
                        </label>
                        <DatePicker
                          value={new Date((edits.date as unknown as string | Date) ?? selectedExpense.date)}
                          onChange={(e) => handleEditChange('date', e.value ? (e.value as Date).toISOString() : undefined)}
                          className="w-full"
                        />
                      </div>

                      {/* Category */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Category
                        </label>
                        <DropDownList
                          data={getCategoryOptions()}
                          textField="name"
                          dataItemKey="id"
                          value={getCategoryOptions().find(c => c.id === (edits.category_id ?? selectedExpense.category_id)) ?? null}
                          onChange={(e) => {
                            const selected = e.value as { id: string } | null;
                            handleEditChange('category_id', selected ? selected.id : undefined);
                          }}
                          className="w-full"
                        />
                      </div>

                      {/* Notes */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Notes
                        </label>
                        <TextBox
                          value={edits.notes ?? selectedExpense.notes ?? ''}
                          onChange={(e) => handleEditChange('notes', e.target.value)}
                          placeholder="Add any additional notes..."
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between mt-6 pt-6 border-t">
                  <div className="flex space-x-3">
                    <Button
                      fillMode="outline"
                      onClick={() => handleSkip(selectedExpense.id)}
                    >
                      Remove
                    </Button>
                    <Button
                      fillMode="outline"
                      onClick={handleSave}
                    >
                      Save Changes
                    </Button>
                  </div>
                  <Button
                    themeColor="primary"
                    onClick={() => setShowConfirmDialog(true)}
                  >
                    Confirm & Save
                  </Button>
                </div>
              </Card>
            ) : (
              <Card className="p-12 text-center">
                <div className="text-6xl mb-4">📋</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Select a receipt to review
                </h3>
                <p className="text-gray-600">
                  Choose a receipt from the list to review and edit the extracted data
                </p>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm Receipt</h3>
            <p className="text-gray-700 mb-6">
              Are you sure you want to confirm this receipt? It will be saved to your expenses.
            </p>
            <div className="flex justify-end space-x-3">
              <Button
                fillMode="outline"
                onClick={() => setShowConfirmDialog(false)}
              >
                Cancel
              </Button>
              <Button
                themeColor="primary"
                onClick={handleConfirm}
              >
                Confirm
              </Button>
            </div>
          </div>
        </div>
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
