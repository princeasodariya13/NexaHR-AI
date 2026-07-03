import { EmployeeTable, DUMMY_EMPLOYEES } from "@/components/dashboard/tables/EmployeeTable";
import { AlertCircle } from "lucide-react";
import { AddEmployeeModal } from "./AddEmployeeModal";
import prisma from "@/lib/prisma";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function EmployeesPage() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/login');
  }

  // Get user's company
  let dbUser = null;
  let employees: any[] = [];
  
  try {
    dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { companyId: true }
    });

    const companyId = dbUser?.companyId;

    // Fetch employees
    if (companyId) {
      const rawEmployees = await prisma.employee.findMany({
        where: { companyId },
        include: { department: true },
        orderBy: { createdAt: 'desc' }
      });

      employees = rawEmployees.map(emp => ({
        id: emp.id,
        code: emp.employeeCode,
        name: `${emp.firstName} ${emp.lastName}`,
        email: emp.workEmail || "",
        role: emp.designation || 'Employee',
        department: emp.department?.name || 'General',
        status: emp.status,
      }));
    }
  } catch (error) {
    console.warn("Prisma Database connection failed in Employees:. Next.js Dev overlay suppressed.");
  }

  const displayEmployees = employees;
  const isDemoMode = false;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#111827] dark:text-[#F3F4F6]">Employee Directory</h1>
          <p className="text-[#6B7280] dark:text-[#9CA3AF] dark:text-[#6B7280] text-sm">Manage your workforce, roles, and access.</p>
        </div>
        <div className="flex items-center gap-3">
          <AddEmployeeModal />
        </div>
      </div>

      {/* Search and Filters are now managed inside the EmployeeTable Client Component */}

      <EmployeeTable employees={displayEmployees} />
    </div>
  );
}
