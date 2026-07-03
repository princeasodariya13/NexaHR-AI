'use server'

import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server'

export async function updateEmployeeProfile(data: { 
  firstName: string; 
  lastName: string;
}) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized")

    const dbUser = await prisma.user.findUnique({ 
      where: { id: user.id },
      include: { employee: true }
    })

    if (!dbUser || !dbUser.employee) {
      throw new Error("No linked employee record found.")
    }

    await prisma.employee.update({
      where: { id: dbUser.employee.id },
      data: {
        firstName: data.firstName,
        lastName: data.lastName
      }
    })

    revalidatePath('/dashboard/employee/settings')
    return { success: true }
  } catch (error: any) {
    return { error: error.message || "Failed to update profile details" }
  }
}
