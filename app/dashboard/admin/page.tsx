import { createClient } from "@/utils/supabase/server";
import { Users, UserCheck, CalendarOff, Banknote, Sparkles } from "lucide-react";
import { StatCard } from "@/components/dashboard/cards/StatCard";
import { AttendanceTrendChart } from "@/components/dashboard/charts/AttendanceTrendChart";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function DashboardOverviewPage() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/login');
  }

  let dbUser = null;
  let totalEmployees = 0;
  let presentToday = 0;
  let pendingLeaves = 0;
  let payrollRuns: { _sum: { totalAmount: number | null } } = { _sum: { totalAmount: null } };

  try {
    // Fetch the user's company from our Postgres schema
    dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { companyId: true, role: true }
    });

    const userRole = dbUser?.role || "EMPLOYEE";

    if (userRole === "EMPLOYEE") {
      redirect("/dashboard/employee");
    }

    const companyId = dbUser?.companyId;

    // Real Database Queries (Only if company exists)
    if (companyId) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const results = await Promise.all([
        prisma.employee.count({ where: { companyId, status: 'ACTIVE' } }),
        prisma.attendance.count({ where: { employee: { companyId }, date: { gte: today }, status: 'PRESENT' } }),
        prisma.leaveRequest.count({ where: { companyId, status: 'PENDING' } }),
        prisma.payrollRun.aggregate({
          _sum: { totalAmount: true },
          where: { companyId, month: new Date().getMonth() + 1, year: new Date().getFullYear() }
        })
      ]);
      totalEmployees = results[0];
      presentToday = results[1];
      pendingLeaves = results[2];
      payrollRuns = results[3] as any;
    }
  } catch (error) {
    console.warn("Prisma Database connection failed. Falling back to demo data mode.. Next.js Dev overlay suppressed.");
  }

  // Format currency
  const payrollCost = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(
    payrollRuns._sum.totalAmount ? Number(payrollRuns._sum.totalAmount) : 0
  );

  const displayTotalEmployees = totalEmployees.toString();
  const displayPresentToday = presentToday.toString();
  const displayPendingLeaves = pendingLeaves.toString();
  const displayPayrollCost = payrollCost;

  const isDemoMode = totalEmployees === 0;

  const stats = [
    { title: "Total Employees", value: displayTotalEmployees, icon: Users, trend: isDemoMode ? "0%" : "12%", trendUp: true },
    { title: "Present Today", value: displayPresentToday, icon: UserCheck, trend: isDemoMode ? "0%" : "2.4%", trendUp: true },
    { title: "Pending Leaves", value: displayPendingLeaves, icon: CalendarOff, trend: isDemoMode ? "0%" : "5%", trendUp: false },
    { title: "Monthly Payroll", value: displayPayrollCost, icon: Banknote, trend: isDemoMode ? "0%" : "4.3%", trendUp: true },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#111827] dark:text-[#F3F4F6]">Dashboard Overview</h1>
          <p className="text-[#6B7280] dark:text-[#9CA3AF] dark:text-[#6B7280] text-sm">Welcome back! Here's what's happening today.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-[#111827] dark:text-[#F3F4F6] bg-white dark:bg-[#0F172A] border border-[#E5E7EB] dark:border-[#1E293B] px-3 py-1.5 rounded-lg shadow-sm">
            {(dbUser?.role || 'SUPER_ADMIN').replace('_', ' ')} View
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart Area Placeholder */}
        <div className="lg:col-span-2 bg-white dark:bg-[#0F172A] rounded-2xl border border-[#E5E7EB] dark:border-[#1E293B] shadow-sm p-6 h-96 flex flex-col justify-between">
          <h3 className="text-lg font-bold text-[#111827] dark:text-[#F3F4F6]">Attendance Trends</h3>
          <div className="flex-1 flex items-center justify-center text-[#9CA3AF] dark:text-[#6B7280] text-sm w-full">
            <AttendanceTrendChart />
          </div>
        </div>

        {/* AI Insight Panel */}
        <div className="bg-[#111827] dark:bg-[#F3F4F6] rounded-2xl border border-[#E5E7EB] dark:border-[#1E293B] shadow-lg p-6 text-white dark:text-[#111827] relative overflow-hidden flex flex-col">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white dark:bg-[#0F172A]/5 rounded-full blur-[40px] pointer-events-none" />
          
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="w-5 h-5 text-white dark:text-[#111827]/80" />
            <h3 className="text-lg font-bold">AI HR Insight</h3>
          </div>
          
          <div className="flex-1 space-y-4 text-sm text-white dark:text-[#111827]/80 leading-relaxed">
            <p>
              I noticed a <strong className="text-white dark:text-[#111827]">15% increase</strong> in sick leaves from the Engineering department this week.
            </p>
            <p>
              Also, 3 candidates in the recruitment pipeline have been pending in the "Interviewed" stage for over 7 days.
            </p>
          </div>
          
          <button className="w-full mt-6 bg-white dark:bg-[#0F172A] text-[#111827] dark:text-[#F3F4F6] py-2.5 rounded-xl text-sm font-semibold hover:bg-[#F3F4F6] dark:bg-[#1E293B] dark:hover:bg-[#1E293B] transition-colors">
            Ask AI Copilot
          </button>
        </div>
      </div>
    </div>
  );
}
