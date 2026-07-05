'use server'

import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prisma'
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { LeaveStatus } from '@prisma/client'

export async function updateLeaveStatus(leaveId: string, status: 'APPROVED' | 'REJECTED') {
  if (leaveId.length < 10) return { error: "Cannot modify demo data." }

  try {
    const session = await getServerSession(authOptions);
    const user = session?.user;
    if (!user) throw new Error("Unauthorized")

    const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
    if (!dbUser) throw new Error("User not found")

    await prisma.leaveRequest.update({
      where: { 
        id: leaveId,
        companyId: dbUser.companyId
      },
      data: { status }
    })

    revalidatePath('/dashboard', 'layout')
    return { success: true }
  } catch (error: any) {
    console.error("Update Leave Error:", error)
    return { error: error.message || "Failed to update leave request" }
  }
}
