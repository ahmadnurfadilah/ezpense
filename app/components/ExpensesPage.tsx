'use client';

import { useState } from 'react';
import { Card } from '@progress/kendo-react-layout';
import { Button } from '@progress/kendo-react-buttons';
import { Grid, GridColumn } from '@progress/kendo-react-grid';
import { DropDownList } from '@progress/kendo-react-dropdowns';
import { DateRangePicker } from '@progress/kendo-react-dateinputs';
import { TextBox } from '@progress/kendo-react-inputs';
import { Badge } from '@progress/kendo-react-indicators';
import { Dialog } from '@progress/kendo-react-dialogs';

interface Expense {
  id: string;
  vendor: string;
  amount: number;
  category: string;
  date: Date;
  status: 'confirmed' | 'pending' | 'reviewed';
  notes?: string;
  receiptUrl?: string;
}

// Mock data
const mockExpenses: Expense[] = [
  {
    id: '1',
    vendor: 'Starbucks',
    amount: 12.50,
    category: 'Food & Dining',
    date: new Date('2024-01-15'),
    status: 'confirmed',
    notes: 'Morning coffee',
    receiptUrl: '/api/placeholder/200/150'
  },
  {
    id: '2',
    vendor: 'Uber',
    amount: 25.00,
    category: 'Transportation',
    date: new Date('2024-01-14'),
    status: 'confirmed',
    notes: 'Ride to downtown',
    receiptUrl: '/api/placeholder/200/150'
  },
  {
    id: '3',
    vendor: 'Office Depot',
    amount: 45.99,
    category: 'Office Supplies',
    date: new Date('2024-01-13'),
    status: 'reviewed',
    notes: 'Printer supplies',
    receiptUrl: '/api/placeholder/200/150'
  },
  {
    id: '4',
    vendor: 'Amazon',
    amount: 89.99,
    category: 'Office Supplies',
    date: new Date('2024-01-12'),
    status: 'confirmed',
    notes: 'Software license',
    receiptUrl: '/api/placeholder/200/150'
  },
  {
    id: '5',
    vendor: 'Shell Gas',
    amount: 65.00,
    category: 'Transportation',
    date: new Date('2024-01-11'),
    status: 'confirmed',
    notes: 'Gas fill-up',
    receiptUrl: '/api/placeholder/200/150'
  },
  {
    id: '6',
    vendor: 'Target',
    amount: 34.50,
    category: 'Office Supplies',
    date: new Date('2024-01-10'),
    status: 'pending',
    notes: 'Office supplies',
    receiptUrl: '/api/placeholder/200/150'
  },
  {
    id: '7',
    vendor: 'Netflix',
    amount: 15.99,
    category: 'Entertainment',
    date: new Date('2024-01-09'),
    status: 'confirmed',
    notes: 'Monthly subscription',
    receiptUrl: '/api/placeholder/200/150'
  },
  {
    id: '8',
    vendor: 'Whole Foods',
    amount: 78.45,
    category: 'Food & Dining',
    date: new Date('2024-01-08'),
    status: 'confirmed',
    notes: 'Grocery shopping',
    receiptUrl: '/api/placeholder/200/150'
  }
];

const categories = [
  'All Categories',
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
  'All Status',
  'confirmed',
  'pending',
  'reviewed'
];

export function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>(mockExpenses);
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>(mockExpenses);
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedStatus, setSelectedStatus] = useState('All Status');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  // Filter expenses based on search and filters
  const applyFilters = () => {
    let filtered = expenses;

    if (selectedCategory !== 'All Categories') {
      filtered = filtered.filter(expense => expense.category === selectedCategory);
    }

    if (selectedStatus !== 'All Status') {
      filtered = filtered.filter(expense => expense.status === selectedStatus);
    }

    if (searchTerm) {
      filtered = filtered.filter(expense =>
        expense.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredExpenses(filtered);
  };

  // Apply filters when dependencies change
  useState(() => {
    applyFilters();
  });

  const handleCategoryChange = (e: any) => {
    setSelectedCategory(e.target.value);
    applyFilters();
  };

  const handleStatusChange = (e: any) => {
    setSelectedStatus(e.target.value);
    applyFilters();
  };

  const handleSearchChange = (e: any) => {
    setSearchTerm(e.target.value);
    applyFilters();
  };

  const handleRowClick = (e: any) => {
    const expense = e.dataItem;
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
              data={categories}
              value={selectedCategory}
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
              value={selectedStatus}
              onChange={handleStatusChange}
              className="w-full"
            />
          </div>
          <div className="flex items-end">
            <Button
              fillMode="outline"
              className="w-full"
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
          data={filteredExpenses}
          style={{ height: '600px' }}
          onRowClick={handleRowClick}
          className="cursor-pointer"
        >
          <GridColumn
            field="date"
            title="Date"
            width="120px"
            cell={(props) => (
              <td>
                {new Date(props.dataItem.date).toLocaleDateString()}
              </td>
            )}
          />
          <GridColumn
            field="vendor"
            title="Vendor"
            width="150px"
          />
          <GridColumn
            field="amount"
            title="Amount"
            width="100px"
            cell={(props) => (
              <td className="font-semibold">
                ${props.dataItem.amount.toFixed(2)}
              </td>
            )}
          />
          <GridColumn
            field="category"
            title="Category"
            width="150px"
          />
          <GridColumn
            field="status"
            title="Status"
            width="120px"
            cell={(props) => (
              <td>
                {getStatusBadge(props.dataItem.status)}
              </td>
            )}
          />
          <GridColumn
            field="notes"
            title="Notes"
            cell={(props) => (
              <td className="text-gray-600">
                {props.dataItem.notes || '-'}
              </td>
            )}
          />
        </Grid>
      </Card>

      {/* Expense Detail Dialog */}
      <Dialog
        title="Expense Details"
        onClose={() => setShowDetailDialog(false)}
        visible={showDetailDialog}
        width={600}
      >
        {selectedExpense && (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Receipt Image */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Receipt</h4>
                <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                  <span className="text-4xl">🧾</span>
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
                  <p className="text-gray-900">{selectedExpense.category}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date</label>
                  <p className="text-gray-900">{selectedExpense.date.toLocaleDateString()}</p>
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
    </div>
  );
}
