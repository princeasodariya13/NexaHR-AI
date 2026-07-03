import { PayrollClient, PayrollRunData } from "./PayrollClient";
import prisma from "@/lib/prisma";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function PayrollPage() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/login');
  }

  // Get user's company
  let dbUser = null;
  let recentRuns: PayrollRunData[] = [];
  let stats = { currentMonthCost: "₹0", payslipsGenerated: 0, activeEmployees: 0 };
  let isDemo = true;

  try {
    dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { companyId: true }
    });

    const companyId = dbUser?.companyId;

    if (companyId) {
      // Get active employees count
      const activeEmployeesCount = await prisma.employee.count({
        where: { companyId, status: 'ACTIVE' }
      });
      
      // Get payroll runs
      const rawRuns = await prisma.payrollRun.findMany({
        where: { companyId },
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
        take: 12
      });

      isDemo = activeEmployeesCount === 0 && rawRuns.length === 0;

      recentRuns = rawRuns.map(run => {
        const date = new Date(run.year, run.month - 1);
        return {
          id: run.id,
          monthString: date.toLocaleString('default', { month: 'long', year: 'numeric' }),
          processedBy: 'Admin',
          totalAmountStr: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(run.totalAmount)),
          status: run.status
        };
      });

      stats.activeEmployees = activeEmployeesCount;

      // Calculate current month's cost if it was run, otherwise mock it based on active employees if any
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      const currentRun = rawRuns.find(r => r.month === currentMonth && r.year === currentYear);

      if (currentRun) {
        stats.currentMonthCost = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(currentRun.totalAmount));
        stats.payslipsGenerated = activeEmployeesCount; // Assume 1 payslip per active employee for the run
      } else {
        // If not run yet, show 0 payslips
        stats.currentMonthCost = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(0);
        stats.payslipsGenerated = 0;
      }
    }
  } catch (error) {
    console.warn("Prisma Database connection failed in Payroll:. Next.js Dev overlay suppressed.");
  }

  // Fallback demo data if DB is completely empty (no employees and no runs)
  if (isDemo) {
    // Keep stats at 0 and recent runs empty so user sees the real state of their payroll
  }

  return <PayrollClient stats={stats} recentRuns={recentRuns} isDemo={isDemo} />;
}
