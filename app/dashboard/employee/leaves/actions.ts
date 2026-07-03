"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";

export async function applyLeave(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: { employee: true }
  });

  if (!dbUser || !dbUser.employee) {
    throw new Error("Employee record not found");
  }

  const employee = dbUser.employee;
  const leaveTypeId = formData.get("leaveTypeId") as string;
  const startDateStr = formData.get("startDate") as string;
  const endDateStr = formData.get("endDate") as string;
  const reason = formData.get("reason") as string;

  if (!startDateStr || !endDateStr || !reason) {
    throw new Error("Missing required fields");
  }

  const startDate = new Date(startDateStr);
  const endDate = new Date(endDateStr);

  // Calculate total days (inclusive, skipping weekends for a real app, but simple math for now)
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end

  if (diffDays <= 0) {
    throw new Error("End date must be after start date");
  }

  try {
    await prisma.leaveRequest.create({
      data: {
        employeeId: employee.id,
        companyId: employee.companyId,
        leaveTypeId: leaveTypeId || "Casual Leave",
        startDate: startDate,
        endDate: endDate,
        totalDays: diffDays,
        reason: reason,
        status: "PENDING"
      }
    });

    revalidatePath('/dashboard', 'layout');
    
    return { success: true };
  } catch (error: any) {
    console.error("Leave request error:", error);
    return { error: error.message || "Failed to submit leave request" };
  }
}

export async function deleteLeave(leaveId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  try {
    const leave = await prisma.leaveRequest.findUnique({
      where: { id: leaveId }
    });

    if (!leave || leave.status !== 'PENDING') {
      return { error: "Only pending leaves can be cancelled" };
    }

    await prisma.leaveRequest.delete({
      where: { id: leaveId }
    });

    revalidatePath("/dashboard/employee/leaves");
    revalidatePath("/dashboard/employee");
    return { success: true };
  } catch (error: any) {
    console.error("Delete leave error:", error);
    return { error: "Failed to cancel leave request" };
  }
}
