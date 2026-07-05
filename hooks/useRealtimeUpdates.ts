"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Realtime updates via Supabase are disabled because the project migrated to MongoDB.
// In the future, this can be implemented via Socket.io or MongoDB Change Streams.
export function useRealtimeUpdates(companyId?: string) {
  const router = useRouter();

  useEffect(() => {
    if (!companyId) return;
    console.log("Realtime updates are currently disabled on MongoDB architecture.");
  }, [companyId, router]);
}
