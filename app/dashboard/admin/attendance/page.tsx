import { AttendanceClient } from "./AttendanceClient";
import prisma from "@/lib/prisma";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { format } from "date-fns";

export default async function AttendancePage() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/login');
  }

  // Get user's company
  let dbUser = null;
  let initialLogs: any[] = [];
  let isCheckedIn = false;

  try {
    dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { employee: true }
    });

    const companyId = dbUser?.companyId;

    if (companyId) {
      // Fetch today's attendance logs for the company
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const logs = await prisma.attendance.findMany({
        where: {
          employee: { companyId },
          date: { gte: today }
        },
        include: {
          employee: true
        },
        orderBy: { checkInTime: 'desc' }
      });

      initialLogs = logs.map(log => ({
        id: log.id,
        employeeName: `${log.employee.firstName} ${log.employee.lastName}`,
        initials: `${log.employee.firstName[0]}${log.employee.lastName[0]}`,
        role: log.employee.designation || 'Employee',
        checkIn: log.checkInTime ? format(log.checkInTime, "hh:mm a") : "-",
        checkOut: log.checkOutTime ? format(log.checkOutTime, "hh:mm a") : null,
        status: log.status
      }));

      // Check if current user is checked in
      if (dbUser && dbUser.employee) {
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);
        const userAttendanceToday = await prisma.attendance.findFirst({
          where: {
            employeeId: dbUser.employee.id,
            date: { gte: today, lte: endOfDay }
          }
        });
        isCheckedIn = !!userAttendanceToday?.checkInTime && !userAttendanceToday?.checkOutTime;
      }
    }
  } catch (error) {
    console.warn("Prisma Database connection failed in Attendance:. Next.js Dev overlay suppressed.");
  }

  // Fallback demo data if DB is empty
  if (initialLogs.length === 0) {
    // Rely strictly on real database data and show empty state
  }

  return <AttendanceClient initialLogs={initialLogs} isInitiallyCheckedIn={isCheckedIn} />;
}
