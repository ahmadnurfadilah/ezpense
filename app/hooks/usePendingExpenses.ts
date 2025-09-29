'use client';

import { useState, useEffect } from 'react';
import { getExpenses } from '../lib/database';

export function usePendingExpenses() {
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPendingCount = async () => {
      try {
        const expenses = await getExpenses();
        const pending = expenses.filter(expense => expense.status === 'pending');
        setPendingCount(pending.length);
      } catch (error) {
        console.error('Error fetching pending expenses:', error);
        setPendingCount(0);
      } finally {
        setLoading(false);
      }
    };

    fetchPendingCount();

    // Refresh every 30 seconds
    const interval = setInterval(fetchPendingCount, 30000);
    return () => clearInterval(interval);
  }, []);

  return { pendingCount, loading };
}
