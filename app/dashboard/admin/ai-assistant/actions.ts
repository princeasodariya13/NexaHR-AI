'use server'

import prisma from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server'

export async function sendMessageToAI(message: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized")

    const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
    if (!dbUser) throw new Error("User not found")
    const companyId = dbUser.companyId

    const msgLower = message.toLowerCase()

    // 1. Employee Query
    if (msgLower.includes("employee") || msgLower.includes("staff") || msgLower.includes("headcount")) {
      const activeCount = await prisma.employee.count({ where: { companyId, status: 'ACTIVE' } })
      const totalCount = await prisma.employee.count({ where: { companyId } })
      if (totalCount === 0) {
        return "You currently have 0 employees in the database. You should add some employees first!"
      }
      return `You currently have **${activeCount} active employees** out of ${totalCount} total registered employees.`
    }

    // 2. Payroll Query
    if (msgLower.includes("payroll") || msgLower.includes("salary") || msgLower.includes("cost")) {
      const currentMonth = new Date().getMonth() + 1
      const currentYear = new Date().getFullYear()
      
      const currentRun = await prisma.payrollRun.findFirst({
        where: { companyId, month: currentMonth, year: currentYear }
      })

      if (currentRun) {
        const costStr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(currentRun.totalAmount))
        return `Your total payroll cost for this month is **${costStr}**. Status: **${currentRun.status}**.`
      } else {
        return "You have not processed payroll for the current month yet. You can run it from the Payroll dashboard."
      }
    }

    // 3. Recruitment Query
    if (msgLower.includes("job") || msgLower.includes("candidate") || msgLower.includes("hire") || msgLower.includes("interview") || msgLower.includes("recruit")) {
      const openJobs = await prisma.job.count({ where: { companyId, isActive: true } })
      const totalCandidates = await prisma.candidate.count({ where: { job: { companyId } } })
      const interviewing = await prisma.candidate.count({ where: { job: { companyId }, status: { in: ['INTERVIEW_SCHEDULED', 'INTERVIEWED'] } } })
      
      return `Here is your recruitment snapshot:\n- **${openJobs}** Open Jobs\n- **${totalCandidates}** Total Candidates\n- **${interviewing}** Candidates currently in the interview pipeline.`
    }

    // 4. Attendance Query
    if (msgLower.includes("attendance") || msgLower.includes("present") || msgLower.includes("absent") || msgLower.includes("time")) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const presentCount = await prisma.attendance.count({
        where: { employee: { companyId }, date: { gte: today }, status: 'PRESENT' }
      })
      
      return `Today, you have **${presentCount} employees present**. You can view detailed logs in the Attendance dashboard.`
    }

    // 5. Leave Query
    if (msgLower.includes("leave") || msgLower.includes("vacation") || msgLower.includes("sick")) {
      const pendingLeaves = await prisma.leaveRequest.count({ where: { companyId, status: 'PENDING' } })
      const approvedLeaves = await prisma.leaveRequest.count({ where: { companyId, status: 'APPROVED' } })
      
      return `Leave request summary:\n- **${pendingLeaves}** Pending approvals\n- **${approvedLeaves}** Approved leaves\n\nYou can manage these from the Leaves dashboard.`
    }

    // 6. Document Query
    if (msgLower.includes("document") || msgLower.includes("policy") || msgLower.includes("contract") || msgLower.includes("file")) {
      const totalDocs = await prisma.document.count({ where: { employee: { companyId } } })
      const policies = await prisma.document.count({ where: { employee: { companyId }, type: 'POLICY' } })
      const contracts = await prisma.document.count({ where: { employee: { companyId }, type: 'CONTRACT' } })
      
      return `Document center summary:\n- **${totalDocs}** Total Documents\n- **${policies}** Policies\n- **${contracts}** Contracts\n\nYou can upload and manage documents from the Documents dashboard.`
    }

    // Fallback response for unhandled queries
    return "I can answer real-time database queries about **employees**, **payroll**, **recruitment**, **attendance**, **leaves**, and **documents**. Try asking:\n- *'How many employees do we have?'*\n- *'What is our total payroll cost?'*\n- *'How many open jobs do we have?'*\n- *'Show me leave requests'*\n- *'How many documents do we have?'*"

  } catch (error: any) {
    console.error("AI Assistant Error:", error)
    return "Sorry, I encountered an error connecting to the database."
  }
}
