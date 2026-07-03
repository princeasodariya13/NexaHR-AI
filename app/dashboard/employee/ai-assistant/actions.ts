"use server";

import prisma from "@/lib/prisma";
import { createClient } from "@/utils/supabase/server";

export async function processChatQuery(message: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return "I'm sorry, you must be logged in to access HR records.";
  }

  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { employee: true }
    });

    if (!dbUser || !dbUser.employee) {
      return "I could not locate your employee profile in the system.";
    }

    const employee = dbUser.employee;
    const lowerMessage = message.toLowerCase();

    // 1. Leave Queries
    if (lowerMessage.includes("leave") || lowerMessage.includes("holiday") || lowerMessage.includes("vacation") || lowerMessage.includes("time off")) {
      const approvedLeaves = await prisma.leaveRequest.aggregate({
        where: { employeeId: employee.id, status: 'APPROVED' },
        _sum: { totalDays: true }
      });
      const pendingLeaves = await prisma.leaveRequest.count({
        where: { employeeId: employee.id, status: 'PENDING' }
      });
      
      const usedDays = Number(approvedLeaves._sum.totalDays?.toString() || 0);
      const remainingDays = 24 - usedDays;
      
      let response = `According to your records, you have ${remainingDays} days of leave remaining this year. You have used ${usedDays} days.`;
      if (pendingLeaves > 0) {
        response += ` You also have ${pendingLeaves} leave request(s) currently pending approval.`;
      }
      return response;
    }

    // 2. Attendance Queries
    if (lowerMessage.includes("attendance") || lowerMessage.includes("check in") || lowerMessage.includes("time") || lowerMessage.includes("hours")) {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      
      const todayAttendance = await prisma.attendance.findFirst({
        where: {
          employeeId: employee.id,
          date: { gte: startOfDay }
        }
      });
      
      if (!todayAttendance) {
        return "You have not checked in today yet. Would you like to go to your dashboard to check in?";
      } else if (todayAttendance.checkOutTime) {
        return `You checked in at ${todayAttendance.checkInTime?.toLocaleTimeString()} and checked out at ${todayAttendance.checkOutTime?.toLocaleTimeString()}. Total hours logged: ${todayAttendance.totalHours?.toString() || '0'}.`;
      } else {
        return `You checked in today at ${todayAttendance.checkInTime?.toLocaleTimeString()}. You are currently active.`;
      }
    }

    // 3. Payroll Queries
    if (lowerMessage.includes("payroll") || lowerMessage.includes("salary") || lowerMessage.includes("payslip") || lowerMessage.includes("pay")) {
      const latestPayslip = await prisma.payslip.findFirst({
        where: { employeeId: employee.id },
        orderBy: { createdAt: 'desc' },
        include: { payrollRun: true }
      });

      if (latestPayslip) {
        const net = Number(latestPayslip.netSalary?.toString() || 0).toLocaleString('en-IN');
        return `Your most recent payslip is for month ${latestPayslip.payrollRun.month}/${latestPayslip.payrollRun.year}. Your net salary was ₹${net}. You can download the full PDF from the Payslips section.`;
      }
      return "I couldn't find any generated payslips for your account yet. If you are a new employee, your first payslip will be generated at the end of the month.";
    }

    // 4. Performance / Goals Queries
    if (lowerMessage.includes("goal") || lowerMessage.includes("performance") || lowerMessage.includes("objective")) {
      const activeGoals = await prisma.goal.count({
        where: { employeeId: employee.id, status: 'IN_PROGRESS' }
      });
      const completedGoals = await prisma.goal.count({
        where: { employeeId: employee.id, status: 'COMPLETED' }
      });
      
      return `You currently have ${activeGoals} active goals in progress, and you have successfully completed ${completedGoals} goals. Keep up the great work!`;
    }

    // 5. Greeting
    if (lowerMessage.includes("hi") || lowerMessage.includes("hello") || lowerMessage.includes("hey")) {
      return `Hello ${employee.firstName}! I am Nexa, your personal HR assistant. I am connected directly to your employee database. You can ask me about your leaves, attendance, payroll, or goals.`;
    }

    // Default Fallback
    return "I'm sorry, I am a specialized HR assistant. I can help you with queries regarding your Leaves, Attendance, Payroll, and Performance Goals. Could you please rephrase your question?";

  } catch (error: any) {
    console.error("AI Assistant Error:", error);
    return `System error: ${error?.message || 'Unknown error occurred.'}`;
  }
}
