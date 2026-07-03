"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

/**
 * Global Realtime Hook for NexaHR
 * 
 * Subscribes to PostgreSQL database changes via Supabase Realtime and triggers
 * an elegant Next.js App Router refresh (`router.refresh()`). This invalidates 
 * the Server Component cache and immediately reflects any changes made by 
 * Employees or Admins without needing to set up Redux or TanStack Query!
 */
export function useRealtimeUpdates(companyId?: string) {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    if (!companyId) return;

    // Debounce the refresh to prevent UI freezing during high-concurrency events
    // (e.g. 500 employees checking in at 9:00 AM)
    let refreshTimeout: NodeJS.Timeout;
    const triggerRefresh = () => {
      clearTimeout(refreshTimeout);
      refreshTimeout = setTimeout(() => {
        router.refresh();
      }, 1500); // Wait 1.5s after the last event before refreshing
    };

    // Listen to changes on ALL relevant tables for this specific company
    const channel = supabase
      .channel(`company_${companyId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'Attendance' },
        () => triggerRefresh()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'LeaveRequest' },
        () => triggerRefresh()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'Employee' },
        () => triggerRefresh()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'Document' },
        () => triggerRefresh()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, router, companyId]);
}
