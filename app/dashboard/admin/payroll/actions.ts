'use server'

import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server'
import { PayrollStatus } from '@prisma/client'

export async function runPayrollAction() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized")

    const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
    if (!dbUser) throw new Error("User not found")

    // In a real system, you would calculate total salaries for all employees
    // For demo purposes, we will mock a calculation based on active employees
    const activeEmployees = await prisma.employee.count({
      where: { companyId: dbUser.companyId, status: 'ACTIVE' }
    })
    
    // If no employees, we can't run payroll (or it's 0)
    if (activeEmployees === 0) {
      return { error: "Cannot run payroll: No active employees found in the database. (Add employees first!)" }
    }

    const currentMonth = new Date().getMonth() + 1
    const currentYear = new Date().getFullYear()

    // Check if payroll was already run for this month
    const existingRun = await prisma.payrollRun.findFirst({
      where: {
        companyId: dbUser.companyId,
        month: currentMonth,
        year: currentYear
      }
    })

    if (existingRun) {
      return { error: "Payroll has already been processed for this month." }
    }

    // Mock average salary calculation in INR
    const totalAmount = activeEmployees * 50000.00 // ₹50,000 avg salary

    await prisma.payrollRun.create({
      data: {
        companyId: dbUser.companyId,
        month: currentMonth,
        year: currentYear,
        totalAmount,
        status: 'PAID'
      }
    })

    revalidatePath('/dashboard/admin/payroll')
    return { success: true }
  } catch (error: any) {
    console.error("Run Payroll Error:", error)
    return { error: error.message || "Failed to run payroll" }
  }
}

export async function addIndividualPayrollAction(employeeId: string, amount: number) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized")

    const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
    if (!dbUser) throw new Error("User not found")

    const currentMonth = new Date().getMonth() + 1
    const currentYear = new Date().getFullYear()

    // Find or create payroll run for this month
    let payrollRun = await prisma.payrollRun.findFirst({
      where: { companyId: dbUser.companyId, month: currentMonth, year: currentYear }
    });

    if (!payrollRun) {
      payrollRun = await prisma.payrollRun.create({
        data: {
          companyId: dbUser.companyId,
          month: currentMonth,
          year: currentYear,
          totalAmount: 0,
          status: 'PROCESSING'
        }
      });
    }

    // Check if payslip already exists for this employee in this run
    const existingPayslip = await prisma.payslip.findUnique({
      where: {
        payrollRunId_employeeId: {
          payrollRunId: payrollRun.id,
          employeeId: employeeId
        }
      }
    });

    if (existingPayslip) {
      return { error: "Payroll has already been processed for this employee this month." }
    }

    // Create payslip
    await prisma.payslip.create({
      data: {
        payrollRunId: payrollRun.id,
        employeeId: employeeId,
        basicSalary: amount,
        allowances: 0,
        deductions: 0,
        netSalary: amount
      }
    });

    // Update total amount in run manually to avoid Decimal increment errors
    const newTotal = Number(payrollRun.totalAmount) + amount;
    await prisma.payrollRun.update({
      where: { id: payrollRun.id },
      data: { totalAmount: newTotal }
    });

    revalidatePath('/dashboard/admin/payroll')
    return { success: true }
  } catch (error: any) {
    console.error("Add Individual Payroll Error:", error)
    return { error: error.message || "Failed to add individual payroll" }
  }
}
