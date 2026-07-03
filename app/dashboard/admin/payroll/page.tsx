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

  let employeesList: { id: string; name: string }[] = [];

  try {
    dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { companyId: true }
    });

    const companyId = dbUser?.companyId;

    if (companyId) {
      const dbEmployees = await prisma.employee.findMany({
        where: { companyId, status: 'ACTIVE' },
        select: { id: true, firstName: true, lastName: true }
      });
      employeesList = dbEmployees.map(emp => ({
        id: emp.id,
        name: `${emp.firstName} ${emp.lastName}`
      }));
      
      const activeEmployeesCount = dbEmployees.length;
      
      // Get payroll runs
      const rawRuns = await prisma.payrollRun.findMany({
        where: { companyId },
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
        take: 12,
        include: {
          payslips: {
            include: { employee: true }
          }
        }
      });

      isDemo = activeEmployeesCount === 0 && rawRuns.length === 0;

      recentRuns = rawRuns.map(run => {
        const date = new Date(run.year, run.month - 1);
        return {
          id: run.id,
          monthString: date.toLocaleString('default', { month: 'long', year: 'numeric' }),
          processedBy: 'Admin',
          totalAmountStr: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(run.totalAmount)),
          status: run.status,
          payslips: run.payslips.map(ps => ({
            id: ps.id,
            employeeName: `${ps.employee.firstName} ${ps.employee.lastName}`,
            employeeCode: ps.employee.employeeCode,
            amountStr: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(ps.netSalary))
          }))
        };
      });

      stats.activeEmployees = activeEmployeesCount;

      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      const currentRun = rawRuns.find(r => r.month === currentMonth && r.year === currentYear);

      if (currentRun) {
        stats.currentMonthCost = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(currentRun.totalAmount));
        stats.payslipsGenerated = activeEmployeesCount;
      } else {
        stats.currentMonthCost = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(0);
        stats.payslipsGenerated = 0;
      }
    }
  } catch (error) {
    console.warn("Prisma Database connection failed in Payroll:. Next.js Dev overlay suppressed.");
  }

  return <PayrollClient stats={stats} recentRuns={recentRuns} isDemo={isDemo} employees={employeesList} />;
}
