'use server'

import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server'
import { EmployeeStatus } from '@prisma/client'

export async function updateEmployeeRole(employeeId: string, newRole: string) {
  if (employeeId.length < 10) return { error: "Cannot modify demo data." }

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized")

    // Security check: verify this employee belongs to the user's company
    const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
    if (!dbUser) throw new Error("User not found in database")

    const employeeToUpdate = await prisma.employee.findUnique({ where: { id: employeeId } });
    if (!employeeToUpdate || employeeToUpdate.companyId !== dbUser.companyId) {
      throw new Error("Employee not found or access denied.");
    }

    await prisma.employee.update({
      where: { id: employeeId },
      data: { designation: newRole }
    })

    revalidatePath('/dashboard/admin/employees')
    return { success: true }
  } catch (error: any) {
    console.error("Update Role Error:", error)
    const errorMsg = error.message || "";
    if (errorMsg === "Unauthorized") return { error: "Your login session has expired. Please refresh the page to log in again." }
    return { error: errorMsg || "Failed to update role" }
  }
}

export async function updateEmployeeStatus(employeeId: string, status: string) {
  if (employeeId.length < 10) return { error: "Cannot modify demo data." }

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized")

    const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
    if (!dbUser) throw new Error("User not found in database")

    const employeeToUpdate = await prisma.employee.findUnique({ where: { id: employeeId } });
    if (!employeeToUpdate || employeeToUpdate.companyId !== dbUser.companyId) {
      throw new Error("Employee not found or access denied.");
    }

    await prisma.employee.update({
      where: { id: employeeId },
      data: { status: status as EmployeeStatus }
    })

    revalidatePath('/dashboard/admin/employees')
    return { success: true }
  } catch (error: any) {
    console.error("Update Status Error:", error)
    const errorMsg = error.message || "";
    if (errorMsg === "Unauthorized") return { error: "Your login session has expired. Please refresh the page to log in again." }
    return { error: errorMsg || "Failed to update status" }
  }
}

import { sendEmployeeWelcomeEmail } from '@/lib/mail';

export async function createEmployee(data: {
  firstName: string;
  lastName: string;
  email: string;
  jobTitle: string;
  passwordOption?: "auto" | "manual";
  password?: string;
  loginUrl?: string;
}) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized")

    let dbUser = await prisma.user.findUnique({ where: { id: user.id } })
    
    // Auto-provision if the user signed up before the Prisma schema was fully integrated
    if (!dbUser) {
      const company = await prisma.company.create({
        data: {
          name: "NexaHR Company",
          website: user.email?.split('@')[1] || "company.com"
        }
      })
      
      dbUser = await prisma.user.create({
        data: {
          id: user.id,
          email: user.email!,
          companyId: company.id,
          role: "SUPER_ADMIN"
        }
      })
    }

    // Generate a unique employee code robustly
    const lastEmployee = await prisma.employee.findFirst({
      where: { companyId: dbUser.companyId, employeeCode: { startsWith: 'EMP-' } },
      orderBy: { employeeCode: 'desc' }
    });
    
    let nextNumber = 1;
    if (lastEmployee) {
      const lastNumber = parseInt(lastEmployee.employeeCode.replace('EMP-', ''), 10);
      if (!isNaN(lastNumber)) {
        nextNumber = lastNumber + 1;
      } else {
        // Fallback if parsing fails
        const count = await prisma.employee.count({ where: { companyId: dbUser.companyId } });
        nextNumber = count + 100; // Jump ahead to avoid collisions
      }
    }
    const employeeCode = `EMP-${nextNumber.toString().padStart(3, '0')}`

    // Check if employee already exists
    let employeeUser = await prisma.user.findUnique({ 
      where: { email: data.email },
      include: { employee: true }
    })
    
    if (employeeUser && employeeUser.employee) {
      return { error: "An employee with this email address already exists in the system." }
    }

    let targetUserId = employeeUser?.id;

    // Password Generation
    const passwordOption = data.passwordOption || "auto";
    const generatedPassword = passwordOption === "auto" 
      ? Math.random().toString(36).slice(-8) + "1@aA" 
      : data.password!;

    if (!targetUserId) {
      // Create user in Supabase Auth using Admin API
      if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
        const { createClient: createSupabaseClient } = await import('@supabase/supabase-js');
        const supabaseAdmin = createSupabaseClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY
        );
        
        const { data: adminData, error: adminError } = await supabaseAdmin.auth.admin.createUser({
          email: data.email,
          password: generatedPassword,
          email_confirm: true,
        });

        if (adminError) {
          if (adminError.message.includes('already registered') || adminError.message.includes('already exists')) {
            throw new Error("This email is already registered in the authentication system. Please use a different email or try again later if it was recently deleted.");
          }
          throw new Error(`Auth Error: ${adminError.message}`);
        }
        
        if (adminData?.user) {
          targetUserId = adminData.user.id;
        }
      }

      // Fallback if targetUserId is still null
      const newUser = await prisma.user.upsert({
        where: { email: data.email },
        update: {
          companyId: dbUser.companyId,
          role: "EMPLOYEE"
        },
        create: {
          id: targetUserId || undefined,
          email: data.email,
          companyId: dbUser.companyId,
          role: "EMPLOYEE"
        }
      })
      targetUserId = newUser.id;
    }

    // 2. Create the Employee record
    await prisma.employee.create({
      data: {
        companyId: dbUser.companyId,
        userId: targetUserId,
        firstName: data.firstName,
        lastName: data.lastName,
        workEmail: data.email,
        designation: data.jobTitle,
        employeeCode: employeeCode,
        joiningDate: new Date(),
        status: 'ACTIVE'
      }
    })

    let emailSent = false;
    if (passwordOption === 'auto') {
      emailSent = await sendEmployeeWelcomeEmail(
        data.email, 
        data.firstName, 
        generatedPassword, 
        data.loginUrl || (process.env.NEXT_PUBLIC_APP_URL ? process.env.NEXT_PUBLIC_APP_URL + '/login' : 'https://nexahr.vercel.app/login')
      );
    }

    revalidatePath('/dashboard/admin')
    revalidatePath('/dashboard/admin/employees')
    return { success: true, generatedPassword, emailSent }
  } catch (error: any) {
    console.error("Create Employee Error:", error)
    const errorMsg = error.message || "";
    if (errorMsg === "Unauthorized") {
      return { error: "Your login session has expired. Please refresh the page to log in again." }
    }
    if (errorMsg.includes("Can't reach database server") || errorMsg.includes("timed out") || errorMsg.includes("connection")) {
      return { error: "DEMO_MODE_OFFLINE" }
    }
    return { error: errorMsg || "Failed to create employee" }
  }
}

export async function deleteEmployee(employeeId: string) {
  if (employeeId.length < 10) return { error: "Cannot modify demo data." }

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized")

    const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
    if (!dbUser) throw new Error("User not found in database")

    const employeeToDelete = await prisma.employee.findUnique({
      where: { id: employeeId }
    })
    
    if (!employeeToDelete || employeeToDelete.companyId !== dbUser.companyId) {
       return { error: "Employee not found or you don't have permission to delete them." }
    }

    // Attempt to delete from Supabase Auth if we have the admin key and the userId exists
    if (employeeToDelete.userId && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const { createClient: createSupabaseClient } = await import('@supabase/supabase-js');
      const supabaseAdmin = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );
      
      const { error: adminError } = await supabaseAdmin.auth.admin.deleteUser(employeeToDelete.userId);
      if (adminError) {
        console.warn("Failed to delete user from Supabase Auth:", adminError);
      }
    }

    // Manually delete related records to avoid foreign key constraint errors
    // Payslip has onDelete: Restrict, so it MUST be deleted manually
    await prisma.payslip.deleteMany({ where: { employeeId: employeeId } })
    
    // While others have onDelete: Cascade, it's safer to explicitly delete them
    // to avoid any unexpected database-level constraints
    await prisma.attendance.deleteMany({ where: { employeeId: employeeId } })
    await prisma.leaveRequest.deleteMany({ where: { employeeId: employeeId } })
    await prisma.document.deleteMany({ where: { employeeId: employeeId } })
    await prisma.goal.deleteMany({ where: { employeeId: employeeId } })

    // Delete the Employee
    await prisma.employee.delete({
      where: { 
        id: employeeId
      }
    })

    if (employeeToDelete.userId) {
       try {
         await prisma.user.delete({ where: { id: employeeToDelete.userId } });
       } catch(e) {
          console.warn("Could not delete user record, it might be referenced elsewhere.");
       }
    }

    revalidatePath('/dashboard/admin')
    revalidatePath('/dashboard/admin/employees')
    return { success: true }
  } catch (error: any) {
    console.error("Delete Employee Error:", error)
    const errorMsg = error.message || "";
    if (errorMsg === "Unauthorized") return { error: "Your login session has expired. Please refresh the page to log in again." }
    return { error: errorMsg || "Failed to delete employee" }
  }
}
