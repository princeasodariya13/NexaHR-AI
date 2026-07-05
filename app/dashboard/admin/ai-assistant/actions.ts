'use server'

import prisma from '@/lib/prisma'
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function sendMessageToAI(message: string) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user;
    if (!user) throw new Error("Unauthorized")

    const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
    if (!dbUser) throw new Error("User not found")
    const companyId = dbUser.companyId

    // Fetch live context from the database
    const activeEmployees = await prisma.employee.count({ where: { companyId, status: 'ACTIVE' } });
    const totalEmployees = await prisma.employee.count({ where: { companyId } });
    
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const currentRun = await prisma.payrollRun.findFirst({
      where: { companyId, month: currentMonth, year: currentYear }
    });
    const payrollCostStr = currentRun ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(currentRun.totalAmount)) : "Not generated yet";
    const payrollStatus = currentRun ? currentRun.status : "N/A";

    const openJobs = await prisma.job.count({ where: { companyId, isActive: true } });
    const totalCandidates = await prisma.candidate.count({ where: { job: { companyId } } });
    const interviewing = await prisma.candidate.count({ where: { job: { companyId }, status: { in: ['INTERVIEW_SCHEDULED', 'INTERVIEWED'] } } });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const presentCount = await prisma.attendance.count({
      where: { employee: { companyId }, date: { gte: today }, status: 'PRESENT' }
    });

    const pendingLeaves = await prisma.leaveRequest.count({ where: { companyId, status: 'PENDING' } });
    const approvedLeaves = await prisma.leaveRequest.count({ where: { companyId, status: 'APPROVED' } });

    const totalDocs = await prisma.document.count({ where: { employee: { companyId } } });
    const policies = await prisma.document.count({ where: { employee: { companyId }, type: 'POLICY' } });
    const contracts = await prisma.document.count({ where: { employee: { companyId }, type: 'CONTRACT' } });

    // Initialize Gemini API
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is missing from environment variables.");
    }
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Build Context-Aware Prompt
    const prompt = `
      You are an intelligent AI HR Assistant for NexaHR, speaking to a Company Admin.
      You must answer their questions accurately using the real-time company data provided below. Do not make up numbers.
      If the user asks something outside the scope of this data or HR in general, politely decline to answer.

      Real-Time Company Data Context:
      - Employees: ${activeEmployees} active employees out of ${totalEmployees} total registered.
      - Payroll (This Month): Total Cost is ${payrollCostStr}. Status is ${payrollStatus}.
      - Recruitment: ${openJobs} Open Jobs, ${totalCandidates} Total Candidates, ${interviewing} currently interviewing.
      - Attendance (Today): ${presentCount} employees present today.
      - Leaves: ${pendingLeaves} pending approvals, ${approvedLeaves} approved leaves.
      - Documents: ${totalDocs} total documents (${policies} policies, ${contracts} contracts).

      User Question: "${message}"
      
      Respond directly, conversationally, and concisely. Use markdown for emphasis if needed.
    `;

    const result = await model.generateContent(prompt);
    return result.response.text();

  } catch (error: any) {
    console.error("AI Assistant Error:", error);
    
    // Fallback if Gemini fails or is not configured
    return "I'm having trouble connecting to my AI brain right now. Please check if your GEMINI_API_KEY is valid and correctly set in your environment variables.";
  }
}
