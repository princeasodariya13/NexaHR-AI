import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import prisma from '@/lib/prisma'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next')
  const type = searchParams.get('type') || 'admin'

  if (code) {
    const supabase = await createClient()
    const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && session?.user) {
      const user = session.user
      
      // Check if user exists in DB
      let dbUser = null
      try {
        dbUser = await prisma.user.findUnique({ where: { id: user.id } })
      } catch (e) {
        console.error("Prisma error finding user in callback", e)
      }

      // If user doesn't exist, create them
      if (!dbUser) {
        try {
          if (type === 'admin') {
            await prisma.$transaction(async (tx) => {
              const company = await tx.company.create({
                data: {
                  name: user.user_metadata?.full_name ? `${user.user_metadata.full_name}'s Company` : "My Company",
                }
              })
              await tx.user.create({
                data: {
                  id: user.id,
                  email: user.email!,
                  companyId: company.id,
                  role: 'SUPER_ADMIN'
                }
              })
            })
          } else {
            // Employee signup
            const defaultCompany = await prisma.company.findFirst()
            if (defaultCompany) {
              await prisma.$transaction(async (tx) => {
                await tx.user.create({
                  data: {
                    id: user.id,
                    email: user.email!,
                    companyId: defaultCompany.id,
                    role: 'EMPLOYEE'
                  }
                })
                
                await tx.employee.create({
                  data: {
                    companyId: defaultCompany.id,
                    userId: user.id,
                    firstName: user.user_metadata?.full_name?.split(' ')[0] || "New",
                    lastName: user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || "Employee",
                    workEmail: user.email!,
                    employeeCode: `EMP-${Math.floor(Math.random() * 9000) + 1000}`,
                    joiningDate: new Date(),
                    status: 'ACTIVE'
                  }
                })
              })
            }
          }
        } catch (e) {
          console.error("Prisma error creating user in callback", e)
        }
      }

      // Determine redirect URL based on role
      try {
        dbUser = await prisma.user.findUnique({ where: { id: user.id } })
      } catch (e) {}

      let redirectUrl = '/dashboard/admin'
      if (dbUser?.role === 'EMPLOYEE') {
        redirectUrl = '/dashboard/employee'
      }
      
      return NextResponse.redirect(`${origin}${next || redirectUrl}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=Could not verify your authentication`)
}
