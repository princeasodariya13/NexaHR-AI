'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import prisma from '@/lib/prisma'

export async function login(formData: FormData) {
  const supabase = await createClient()

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const email = (formData.get('email') as string).trim()
  const password = formData.get('password') as string
  const loginType = formData.get('loginType') as string

  const data = {
    email,
    password,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    console.error('Login error:', error.message)
    redirect(`/login?type=${loginType}&error=${encodeURIComponent(error.message)}`)
  }

  let redirectUrl = loginType === 'employee' ? '/dashboard/employee' : '/dashboard/admin';
  
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { role: true }
      })
      
      const isAdminRole = dbUser?.role === 'SUPER_ADMIN' || dbUser?.role === 'COMPANY_ADMIN' || dbUser?.role === 'HR_MANAGER';
      const isEmployeeRole = dbUser?.role === 'EMPLOYEE';

      // Strict Validation: Ensure login type matches actual role
      if (loginType === 'admin' && !isAdminRole) {
        await supabase.auth.signOut();
        redirect(`/login?type=${loginType}&error=${encodeURIComponent("Access denied. Please use the Employee login section.")}`);
      }
      
      if (loginType === 'employee' && !isEmployeeRole) {
        await supabase.auth.signOut();
        redirect(`/login?type=${loginType}&error=${encodeURIComponent("Access denied. Please use the Company Admin login section.")}`);
      }
      
      if (isEmployeeRole) {
        redirectUrl = '/dashboard/employee';
      } else if (isAdminRole) {
        redirectUrl = '/dashboard/admin';
      }
    }
  } catch (e) {
    if (e instanceof Error && e.message === "NEXT_REDIRECT") {
      throw e; // Required for Next.js redirect to work inside a try-catch
    }
    console.error("Error fetching role during login redirect", e)
  }

  revalidatePath('/', 'layout')
  redirect(redirectUrl)
}

export async function signup(formData: FormData) {
  const { createClient: createSupabaseClient } = await import('@supabase/supabase-js')
  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const email = (formData.get('email') as string).trim()
  const password = formData.get('password') as string
  const companyName = formData.get('company') as string

  // Use Admin API to create user and bypass email confirmation
  const { data: authData, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (error) {
    console.error('Signup error:', error.message)
    redirect(`/signup?error=${encodeURIComponent(error.message)}`)
  }

  // Create Company and User in Prisma
  if (authData.user) {
    try {
      // Check if user already exists to avoid duplicates
      const existingUser = await prisma.user.findUnique({ where: { id: authData.user.id } })
      
      if (!existingUser) {
        const userId = authData.user.id;
        await prisma.$transaction(async (tx) => {
          const company = await tx.company.create({
            data: {
              name: companyName || "My Company",
            }
          })
          
          await tx.user.create({
            data: {
              id: userId,
              email: email,
              companyId: company.id,
              role: 'SUPER_ADMIN'
            }
          })
        })
      }
    } catch (e) {
      console.error("Prisma error during signup", e)
    }
  }

  // Sign out just in case
  const supabase = await createClient()
  await supabase.auth.signOut()

  revalidatePath('/', 'layout')
  redirect('/login?type=admin&message=' + encodeURIComponent('Account created successfully! Please login with your credentials.'))
}

export async function employeeSignup(formData: FormData) {
  const { createClient: createSupabaseClient } = await import('@supabase/supabase-js')
  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const email = (formData.get('email') as string).trim()
  const password = formData.get('password') as string
  const firstName = formData.get('firstName') as string
  const lastName = formData.get('lastName') as string

  // Use Admin API to create user and bypass email confirmation
  const { data: authData, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (error) {
    console.error('Employee signup error:', error.message)
    redirect(`/signup/employee?error=${encodeURIComponent(error.message)}`)
  }

  if (authData.user) {
    try {
      // Find ANY company to attach this employee to (for demo purposes)
      const defaultCompany = await prisma.company.findFirst()
      
      if (defaultCompany) {
        const userId = authData.user.id;
        
        await prisma.$transaction(async (tx) => {
          // Create User with EMPLOYEE role
          await tx.user.create({
            data: {
              id: userId,
              email: email,
              companyId: defaultCompany.id,
              role: 'EMPLOYEE'
            }
          })
          
          // Create Employee record
          await tx.employee.create({
            data: {
              companyId: defaultCompany.id,
              userId: userId,
              firstName: firstName || "New",
              lastName: lastName || "Employee",
              workEmail: email,
              employeeCode: `EMP-${Math.floor(Math.random() * 9000) + 1000}`,
              joiningDate: new Date(),
              status: 'ACTIVE'
            }
          })
        })
      }
    } catch (e) {
      console.error("Prisma error during employee signup", e)
    }
  }

  // Force the user to manually log in with their new credentials
  const supabase = await createClient()
  await supabase.auth.signOut()
  
  revalidatePath('/', 'layout')
  redirect('/login?type=employee&message=' + encodeURIComponent('Account created successfully! Please login with your new credentials.'))
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
