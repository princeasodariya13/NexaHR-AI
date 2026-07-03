import prisma from "@/lib/prisma";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { SettingsClient } from "./SettingsClient";
import { format } from "date-fns";

export default async function EmployeeSettingsPage() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/login');
  }

  let employee = null;

  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        employee: true
      }
    });

    if (dbUser && dbUser.employee) {
      employee = {
        firstName: dbUser.employee.firstName,
        lastName: dbUser.employee.lastName,
        workEmail: dbUser.employee.workEmail,
        employeeCode: dbUser.employee.employeeCode,
        designation: dbUser.employee.designation,
        joiningDate: format(new Date(dbUser.employee.joiningDate), "MMMM dd, yyyy")
      };
    }
  } catch (err) {
    console.error("Prisma Database fetching failed in Employee Settings:", err);
  }

  return (
    <SettingsClient employee={employee} />
  );
}
