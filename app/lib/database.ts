import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

// Types
export interface Category {
  id: string;
  name: string;
  color: string;
  budget?: number;
  created_at: string;
  updated_at: string;
}

export interface Expense {
  id: string;
  user_id: string;
  vendor: string;
  amount: number;
  category_id?: string;
  date: string;
  notes?: string;
  receipt_url?: string;
  status: 'pending' | 'reviewed' | 'confirmed';
  confidence_score?: number;
  extracted_data?: Record<string, unknown>;
  user_edits?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  category?: Category;
}

export interface Receipt {
  id: string;
  user_id: string;
  expense_id?: string;
  file_name: string;
  file_size?: number;
  file_type?: string;
  storage_path: string;
  processing_status: 'uploading' | 'processing' | 'completed' | 'error';
  extracted_data?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface UserPreferences {
  id: string;
  user_id: string;
  currency: string;
  date_format: string;
  theme: string;
  auto_categorize: boolean;
  email_notifications: boolean;
  budget_alerts: boolean;
  created_at: string;
  updated_at: string;
}

// Categories
export async function getCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }

  return data || [];
}

export async function createCategory(category: Omit<Category, 'id' | 'created_at' | 'updated_at'>): Promise<Category> {
  const { data, error } = await supabase
    .from('categories')
    .insert(category)
    .select()
    .single();

  if (error) {
    console.error('Error creating category:', error);
    throw error;
  }

  return data;
}

export async function updateCategory(id: string, updates: Partial<Category>): Promise<Category> {
  const { data, error } = await supabase
    .from('categories')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating category:', error);
    throw error;
  }

  return data;
}

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting category:', error);
    throw error;
  }
}

// Expenses
export async function getExpenses(): Promise<Expense[]> {
  const { data, error } = await supabase
    .from('expenses')
    .select(`
      *,
      category:categories(*)
    `)
    .order('date', { ascending: false });

  if (error) {
    console.error('Error fetching expenses:', error);
    throw error;
  }

  return data || [];
}

export async function getExpense(id: string): Promise<Expense> {
  const { data, error } = await supabase
    .from('expenses')
    .select(`
      *,
      category:categories(*)
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching expense:', error);
    throw error;
  }

  return data;
}

export async function createExpense(expense: Omit<Expense, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Expense> {
  const { data, error } = await supabase
    .from('expenses')
    .insert(expense)
    .select(`
      *,
      category:categories(*)
    `)
    .single();

  if (error) {
    console.error('Error creating expense:', error);
    throw error;
  }

  return data;
}

export async function updateExpense(id: string, updates: Partial<Expense>): Promise<Expense> {
  const { data, error } = await supabase
    .from('expenses')
    .update(updates)
    .eq('id', id)
    .select(`
      *,
      category:categories(*)
    `)
    .single();

  if (error) {
    console.error('Error updating expense:', error);
    throw error;
  }

  return data;
}

export async function deleteExpense(id: string): Promise<void> {
  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting expense:', error);
    throw error;
  }
}

// Receipts
export async function getReceipts(): Promise<Receipt[]> {
  const { data, error } = await supabase
    .from('receipts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching receipts:', error);
    throw error;
  }

  return data || [];
}

export async function createReceipt(receipt: Omit<Receipt, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Receipt> {
  const { data, error } = await supabase
    .from('receipts')
    .insert(receipt)
    .select()
    .single();

  if (error) {
    console.error('Error creating receipt:', error);
    throw error;
  }

  return data;
}

export async function updateReceipt(id: string, updates: Partial<Receipt>): Promise<Receipt> {
  const { data, error } = await supabase
    .from('receipts')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating receipt:', error);
    throw error;
  }

  return data;
}

// User Preferences
export async function getUserPreferences(): Promise<UserPreferences | null> {
  const { data, error } = await supabase
    .from('user_preferences')
    .select('*')
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
    console.error('Error fetching user preferences:', error);
    throw error;
  }

  return data;
}

export async function createUserPreferences(preferences: Omit<UserPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<UserPreferences> {
  const { data, error } = await supabase
    .from('user_preferences')
    .insert(preferences)
    .select()
    .single();

  if (error) {
    console.error('Error creating user preferences:', error);
    throw error;
  }

  return data;
}

export async function updateUserPreferences(updates: Partial<UserPreferences>): Promise<UserPreferences> {
  const { data, error } = await supabase
    .from('user_preferences')
    .upsert(updates)
    .select()
    .single();

  if (error) {
    console.error('Error updating user preferences:', error);
    throw error;
  }

  return data;
}

// Storage
export async function uploadReceipt(file: File, userId: string): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}.${fileExt}`;
  const filePath = `${userId}/${fileName}`;

  const { data, error } = await supabase.storage
    .from('receipt-images')
    .upload(filePath, file);

  if (error) {
    console.error('Error uploading file:', error);
    throw error;
  }

  return data.path;
}

export async function getReceiptUrl(filePath: string): Promise<string> {
  const { data } = supabase.storage
    .from('receipt-images')
    .getPublicUrl(filePath);

  return data.publicUrl;
}

export async function deleteReceipt(filePath: string): Promise<void> {
  const { error } = await supabase.storage
    .from('receipt-images')
    .remove([filePath]);

  if (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
}

// Analytics
export async function getExpenseSummary() {
  const { data, error } = await supabase.rpc('get_user_expense_summary');

  if (error) {
    console.error('Error fetching expense summary:', error);
    throw error;
  }

  return data;
}
