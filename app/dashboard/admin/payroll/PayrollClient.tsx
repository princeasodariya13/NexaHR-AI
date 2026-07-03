"use client";

import { useTransition } from "react";
import { Banknote, FileText, AlertCircle, ArrowRight, Loader2 } from "lucide-react";
import { runPayrollAction } from "./actions";

export type PayrollRunData = {
  id: string;
  monthString: string;
  processedBy: string;
  totalAmountStr: string;
  status: string;
}

type PayrollClientProps = {
  stats: { currentMonthCost: string; payslipsGenerated: number; activeEmployees: number };
  recentRuns: PayrollRunData[];
  isDemo: boolean;
}

export function PayrollClient({ stats, recentRuns, isDemo }: PayrollClientProps) {
  const [isPending, startTransition] = useTransition();

  const handleRunPayroll = () => {
    startTransition(async () => {
      const res = await runPayrollAction();
      if (res.error) alert(res.error);
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#111827] dark:text-[#F3F4F6]">Payroll Management</h1>
          <p className="text-[#6B7280] dark:text-[#9CA3AF] dark:text-[#6B7280] text-sm">Process monthly salaries and manage payslips.</p>
        </div>
        <div className="flex items-center gap-3">
          {isDemo && (
            <span className="hidden md:flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-100 border border-amber-200 px-3 py-2 rounded-xl shadow-sm animate-pulse">
              <AlertCircle className="w-3.5 h-3.5" />
              Demo Data
            </span>
          )}
          <button 
            onClick={handleRunPayroll}
            disabled={isPending}
            className="bg-[#111827] dark:bg-[#F3F4F6] text-white dark:text-[#111827] hover:bg-[#1f2937] dark:hover:bg-[#E5E7EB] shadow-sm rounded-xl px-4 py-2.5 text-sm font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
            Run Payroll
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-[#0F172A] rounded-2xl border border-[#E5E7EB] dark:border-[#1E293B] shadow-sm p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-[#111827] dark:text-[#F3F4F6]">Current Month Cost</h3>
            <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Banknote className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-bold text-[#111827] dark:text-[#F3F4F6] tracking-tight">{stats.currentMonthCost}</p>
            <p className="text-[#6B7280] dark:text-[#9CA3AF] dark:text-[#6B7280] text-sm mt-1">{new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0F172A] rounded-2xl border border-[#E5E7EB] dark:border-[#1E293B] shadow-sm p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-[#111827] dark:text-[#F3F4F6]">Payslips Generated</h3>
            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-bold text-[#111827] dark:text-[#F3F4F6] tracking-tight">{stats.payslipsGenerated}</p>
            <p className="text-[#6B7280] dark:text-[#9CA3AF] dark:text-[#6B7280] text-sm mt-1">Out of {stats.activeEmployees} active employees</p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0F172A] rounded-2xl border border-red-100 shadow-sm p-6 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-50 rounded-bl-full pointer-events-none"></div>
          <div className="flex items-center justify-between mb-4 relative z-10">
            <h3 className="font-semibold text-red-900">Action Needed</h3>
            <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="relative z-10">
            <p className="text-xl font-bold text-red-700 tracking-tight">{isDemo ? '3' : '0'} Failed Transfers</p>
            <p className="text-red-600/80 text-sm mt-1 font-medium">{isDemo ? 'Bank details incorrect' : 'All clear'}</p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-[#0F172A] rounded-2xl border border-[#E5E7EB] dark:border-[#1E293B] shadow-sm overflow-hidden flex flex-col min-h-[300px]">
        <div className="p-6 border-b border-[#E5E7EB] dark:border-[#1E293B]">
          <h3 className="text-lg font-bold text-[#111827] dark:text-[#F3F4F6]">Recent Payroll Runs</h3>
        </div>
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#F8FAFC] dark:bg-[#1E293B] border-b border-[#E5E7EB] dark:border-[#1E293B] text-[#6B7280] dark:text-[#9CA3AF] dark:text-[#6B7280]">
              <tr>
                <th className="px-6 py-4 font-semibold">Month</th>
                <th className="px-6 py-4 font-semibold">Processed By</th>
                <th className="px-6 py-4 font-semibold">Total Amount</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB] dark:divide-[#1E293B]">
              {recentRuns.map((run) => (
                <tr key={run.id} className="hover:bg-[#F8FAFC] dark:hover:bg-[#1E293B]/50 dark:bg-[#1E293B] transition-colors">
                  <td className="px-6 py-4 font-medium text-[#111827] dark:text-[#F3F4F6]">{run.monthString}</td>
                  <td className="px-6 py-4 text-[#6B7280] dark:text-[#9CA3AF] dark:text-[#6B7280]">{run.processedBy}</td>
                  <td className="px-6 py-4 font-medium text-[#111827] dark:text-[#F3F4F6]">{run.totalAmountStr}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      run.status === 'PAID' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 
                      run.status === 'PROCESSING' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                      run.status === 'FAILED' ? 'bg-red-50 text-red-700 border border-red-200' :
                      'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {run.status === 'PAID' ? 'Paid' : run.status === 'PROCESSING' ? 'Processing' : run.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-[#111827] dark:text-[#F3F4F6] font-medium hover:underline">View Report</button>
                  </td>
                </tr>
              ))}
              {recentRuns.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-[#6B7280] dark:text-[#9CA3AF] dark:text-[#6B7280]">
                    No payroll runs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
