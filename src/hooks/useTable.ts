import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Generic CRUD hook for any user-owned Supabase table.
 * Handles loading state, optimistic-ish refresh and error surfacing.
 */
export function useTable<T extends { id: string }>(table: string, orderBy = 'created_at') {
  const { user } = useAuth();
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase.from(table).select('*')
      .eq('user_id', user.id).order(orderBy, { ascending: false });
    if (error) setError(error.message);
    else setRows((data as T[]) ?? []);
    setLoading(false);
  }, [table, orderBy, user]);

  useEffect(() => { refresh(); }, [refresh]);

  const insert = async (values: Partial<T>) => {
    if (!user) return null;
    const { data, error } = await supabase.from(table)
      .insert({ ...values, user_id: user.id }).select().single();
    if (error) { setError(error.message); return null; }
    setRows(r => [data as T, ...r]);
    return data as T;
  };

  const update = async (id: string, values: Partial<T>) => {
    const { data, error } = await supabase.from(table)
      .update(values as Record<string, unknown>).eq('id', id).select().single();
    if (error) { setError(error.message); return null; }
    setRows(r => r.map(row => (row.id === id ? (data as T) : row)));
    return data as T;
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) { setError(error.message); return false; }
    setRows(r => r.filter(row => row.id !== id));
    return true;
  };

  return { rows, loading, error, refresh, insert, update, remove, setError };
}
