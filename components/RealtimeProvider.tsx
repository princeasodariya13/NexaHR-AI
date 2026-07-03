"use client";

import { useRealtimeUpdates } from "@/hooks/useRealtimeUpdates";

export function RealtimeProvider({ companyId }: { companyId?: string }) {
  useRealtimeUpdates(companyId);
  
  // This component doesn't render any UI, it just runs the hook
  return null;
}
