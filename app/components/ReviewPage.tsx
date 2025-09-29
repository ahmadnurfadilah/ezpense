'use client';

import { useState } from 'react';
import { Card } from '@progress/kendo-react-layout';
import { Button } from '@progress/kendo-react-buttons';
import { TextBox, NumericTextBox } from '@progress/kendo-react-inputs';
import { DropDownList } from '@progress/kendo-react-dropdowns';
import { DatePicker } from '@progress/kendo-react-dateinputs';
import { Badge } from '@progress/kendo-react-indicators';
import { Notification } from '@progress/kendo-react-notification';
import { Dialog } from '@progress/kendo-react-dialogs';

interface ReceiptData {
  id: string;
  imageUrl: string;
  extractedData: {
    amount: number;
    vendor: string;
    date: Date;
    category: string;
    confidence: number;
    items?: string[];
  };
  userEdits?: {
    amount?: number;
    vendor?: string;
    category?: string;
    notes?: string;
  };
  status: 'pending' | 'reviewed' | 'confirmed';
}

// Mock data
const mockReceipts: ReceiptData[] = [
  {
    id: '1',
    imageUrl: '/api/placeholder/400/300',
    extractedData: {
      amount: 12.50,
      vendor: 'Starbucks',
      date: new Date('2024-01-15'),
      category: 'Food & Dining',
      confidence: 0.95,
      items: ['Grande Latte', 'Blueberry Muffin']
    },
    status: 'pending'
  },
  {
    id: '2',
    imageUrl: '/api/placeholder/400/300',
    extractedData: {
      amount: 25.00,
      vendor: 'Uber',
      date: new Date('2024-01-14'),
      category: 'Transportation',
      confidence: 0.88,
      items: ['Ride to Downtown']
    },
    status: 'pending'
  },
  {
    id: '3',
    imageUrl: '/api/placeholder/400/300',
    extractedData: {
      amount: 45.99,
      vendor: 'Office Depot',
      date: new Date('2024-01-13'),
      category: 'Office Supplies',
      confidence: 0.92,
      items: ['Printer Paper', 'Pens', 'Notebook']
    },
    status: 'pending'
  }
];

const categories = [
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
  const [receipts, setReceipts] = useState<ReceiptData[]>(mockReceipts);
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptData | null>(null);
  const [edits, setEdits] = useState<Partial<ReceiptData['userEdits']>>({});
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [notifications, setNotifications] = useState<Array<{ id: string; type: 'success' | 'error'; message: string }>>([]);

  const addNotification = (type: 'success' | 'error', message: string) => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  const handleReceiptSelect = (receipt: ReceiptData) => {
    setSelectedReceipt(receipt);
    setEdits(receipt.userEdits || {});
  };

  const handleEditChange = (field: keyof ReceiptData['userEdits'], value: any) => {
    setEdits(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (!selectedReceipt) return;

    setReceipts(prev => prev.map(receipt =>
      receipt.id === selectedReceipt.id
        ? {
            ...receipt,
            userEdits: edits,
            status: 'reviewed' as const
          }
        : receipt
    ));

    addNotification('success', 'Receipt updated successfully!');
    setSelectedReceipt(null);
    setEdits({});
  };

  const handleConfirm = () => {
    if (!selectedReceipt) return;

    setReceipts(prev => prev.map(receipt =>
      receipt.id === selectedReceipt.id
        ? {
            ...receipt,
            userEdits: edits,
            status: 'confirmed' as const
          }
        : receipt
    ));

    addNotification('success', 'Receipt confirmed and saved!');
    setSelectedReceipt(null);
    setEdits({});
    setShowConfirmDialog(false);
  };

  const handleSkip = (receiptId: string) => {
    setReceipts(prev => prev.filter(receipt => receipt.id !== receiptId));
    addNotification('success', 'Receipt skipped');
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'success';
    if (confidence >= 0.7) return 'warning';
    return 'error';
  };

  const getConfidenceText = (confidence: number) => {
    if (confidence >= 0.9) return 'High';
    if (confidence >= 0.7) return 'Medium';
    return 'Low';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Review Receipts</h1>
        <p className="text-gray-600 mt-1">
          Review and edit AI-extracted data from your receipts
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Receipt List */}
        <div className="lg:col-span-1">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Pending Review ({receipts.filter(r => r.status === 'pending').length})
            </h3>
            <div className="space-y-3">
              {receipts.map((receipt) => (
                <div
                  key={receipt.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedReceipt?.id === receipt.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleReceiptSelect(receipt)}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                      <span className="text-lg">🧾</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium text-gray-900">
                          {receipt.extractedData.vendor}
                        </h4>
                        <Badge
                          themeColor={getConfidenceColor(receipt.extractedData.confidence)}
                          size="small"
                        >
                          {getConfidenceText(receipt.extractedData.confidence)}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        ${receipt.extractedData.amount.toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {receipt.extractedData.date.toLocaleDateString()}
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
          {selectedReceipt ? (
            <Card className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Receipt Image */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Receipt Image</h3>
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">
                      <span className="text-4xl">🧾</span>
                    </div>
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
                        value={edits.amount ?? selectedReceipt.extractedData.amount}
                        onChange={(e) => handleEditChange('amount', e.target.value)}
                        format="c2"
                        className="w-full"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        AI Confidence: {Math.round(selectedReceipt.extractedData.confidence * 100)}%
                      </p>
                    </div>

                    {/* Vendor */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Vendor
                      </label>
                      <TextBox
                        value={edits.vendor ?? selectedReceipt.extractedData.vendor}
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
                        value={selectedReceipt.extractedData.date}
                        className="w-full"
                        readOnly
                      />
                    </div>

                    {/* Category */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category
                      </label>
                      <DropDownList
                        data={categories}
                        value={edits.category ?? selectedReceipt.extractedData.category}
                        onChange={(e) => handleEditChange('category', e.target.value)}
                        className="w-full"
                      />
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Notes
                      </label>
                      <TextBox
                        value={edits.notes ?? ''}
                        onChange={(e) => handleEditChange('notes', e.target.value)}
                        placeholder="Add any additional notes..."
                        className="w-full"
                      />
                    </div>

                    {/* Items (if available) */}
                    {selectedReceipt.extractedData.items && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Items
                        </label>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <ul className="text-sm text-gray-600">
                            {selectedReceipt.extractedData.items.map((item, index) => (
                              <li key={index}>• {item}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between mt-6 pt-6 border-t">
                <div className="flex space-x-3">
                  <Button
                    fillMode="outline"
                    onClick={() => handleSkip(selectedReceipt.id)}
                  >
                    Skip
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

      {/* Confirmation Dialog */}
      <Dialog
        title="Confirm Receipt"
        onClose={() => setShowConfirmDialog(false)}
        visible={showConfirmDialog}
        width={400}
      >
        <div className="p-4">
          <p className="text-gray-700 mb-4">
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
