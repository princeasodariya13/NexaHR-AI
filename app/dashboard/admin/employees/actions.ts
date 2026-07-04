'use server'

import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server'
import { EmployeeStatus } from '@prisma/client'
import { headers } from 'next/headers'

async function getAppUrl() {
  try {
    const headersList = await headers();
    const origin = headersList.get('origin');
    if (origin) return origin;
  } catch(e) {}
  
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'http://localhost:3000';
}

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

import { sendEmployeeInviteEmail } from '@/lib/mail';

export async function createEmployee(data: {
  firstName: string;
  lastName: string;
  email: string;
  jobTitle: string;
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

    if (!targetUserId) {
      let inviteLink = "";
      if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
        const { createClient: createSupabaseClient } = await import('@supabase/supabase-js');
        const supabaseAdmin = createSupabaseClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY
        );
        
        const appUrl = await getAppUrl();
        
        // Generate an invite link (this creates the user in Auth if they don't exist)
        let { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
          type: 'invite',
          email: data.email,
          options: {
            redirectTo: `${appUrl}/update-password`
          }
        });

        if (linkError) {
          // If already registered, generate a password recovery link instead
          if (linkError.message.includes('already registered') || linkError.message.includes('already exists') || linkError.message.includes('email_exists')) {
            const { data: recoveryData, error: recoveryError } = await supabaseAdmin.auth.admin.generateLink({
              type: 'recovery',
              email: data.email,
              options: {
                redirectTo: `${appUrl}/update-password`
              }
            });
            
            if (recoveryError) {
               throw new Error(`Failed to generate recovery link: ${recoveryError.message}`);
            }
            linkData = recoveryData;
          } else {
            throw new Error(`Auth Error: ${linkError.message}`);
          }
        }
        
        if (linkData?.user) {
          targetUserId = linkData.user.id;
        }
        
        if (linkData?.properties?.action_link) {
           inviteLink = linkData.properties.action_link;
           console.log("\n\n=== GENERATED MAGIC LINK ===");
           console.log(inviteLink);
           console.log("==============================\n\n");
           // We store this temporarily on the request context or just pass it down to be sent later
           data.loginUrl = inviteLink; // Re-using loginUrl field to pass the link down
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
    } else {
      // If targetUserId already existed (User record exists but no Employee record),
      // we still need to generate a link to send them
      if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
        const { createClient: createSupabaseClient } = await import('@supabase/supabase-js');
        const supabaseAdmin = createSupabaseClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY
        );
        const appUrl = await getAppUrl();
        
        const { data: recoveryData, error: recoveryError } = await supabaseAdmin.auth.admin.generateLink({
          type: 'recovery',
          email: data.email,
          options: {
            redirectTo: `${appUrl}/update-password`
          }
        });
        
        if (!recoveryError && recoveryData?.properties?.action_link) {
           console.log("\n\n=== GENERATED RECOVERY LINK ===");
           console.log(recoveryData.properties.action_link);
           console.log("=================================\n\n");
           data.loginUrl = recoveryData.properties.action_link;
        }
      }
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
    if (data.loginUrl) {
      emailSent = await sendEmployeeInviteEmail(
        data.email, 
        data.firstName, 
        data.loginUrl
      );
    } else {
      console.warn("No invite link was generated to send to the employee.");
    }

    revalidatePath('/dashboard/admin')
    revalidatePath('/dashboard/admin/employees')
    return { success: true, emailSent }
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
