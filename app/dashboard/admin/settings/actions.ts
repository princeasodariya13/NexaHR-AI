'use server'

import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server'

export async function updateCompanySettings(data: { name: string; website: string }) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized")

    const dbUser = await prisma.user.findUnique({ 
      where: { id: user.id },
      select: { companyId: true }
    })

    if (!dbUser || !dbUser.companyId) {
      throw new Error("Company not found for the user.")
    }

    await prisma.company.update({
      where: { id: dbUser.companyId },
      data: {
        name: data.name,
        website: data.website || null
      }
    })

    revalidatePath('/dashboard/admin/settings')
    return { success: true }
  } catch (error: any) {
    return { error: error.message || "Failed to update company settings" }
  }
}

export async function updateAdminProfile(data: { firstName: string; lastName: string }) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized")

    const dbUser = await prisma.user.findUnique({ 
      where: { id: user.id },
      include: { employee: true }
    })

    if (!dbUser) throw new Error("User not found")

    if (dbUser.employee) {
      await prisma.employee.update({
        where: { id: dbUser.employee.id },
        data: {
          firstName: data.firstName,
          lastName: data.lastName
        }
      })
    } else {
      // Create employee record for the admin if it doesn't exist
      await prisma.employee.create({
        data: {
          companyId: dbUser.companyId!,
          userId: dbUser.id,
          firstName: data.firstName,
          lastName: data.lastName,
          workEmail: dbUser.email,
          employeeCode: `ADM-${Math.floor(Math.random() * 9000) + 1000}`,
          joiningDate: new Date(),
          status: 'ACTIVE',
          designation: 'Administrator'
        }
      })
    }

    revalidatePath('/dashboard/admin/settings')
    return { success: true }
  } catch (error: any) {
    return { error: error.message || "Failed to update profile settings" }
  }
}
