'use server'

import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server'
import { LeaveStatus } from '@prisma/client'

export async function updateLeaveStatus(leaveId: string, status: 'APPROVED' | 'REJECTED') {
  if (leaveId.length < 10) return { error: "Cannot modify demo data." }

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
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
