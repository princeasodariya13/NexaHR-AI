"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: { employee: true }
  });

  if (!dbUser || !dbUser.employee) {
    throw new Error("Employee record not found");
  }

  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;
  const designation = formData.get("designation") as string;
  const personalEmail = formData.get("personalEmail") as string;
  const phone = formData.get("phone") as string;

  if (!firstName || !lastName) {
    throw new Error("First name and Last name are required");
  }

  try {
    await prisma.employee.update({
      where: { id: dbUser.employee.id },
      data: {
        firstName,
        lastName,
        designation: designation || null,
        personalEmail: personalEmail || null,
        phone: phone || null,
      }
    });

    revalidatePath("/dashboard/employee/profile");
    revalidatePath("/dashboard/employee");
    
    return { success: true };
  } catch (error: any) {
    console.error("Profile update error:", error);
    return { error: "Failed to update profile" };
  }
}
