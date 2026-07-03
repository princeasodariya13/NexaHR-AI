"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";

export async function verifyDocument(documentId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { companyId: true, role: true }
    });

    if (!dbUser || dbUser.role === 'EMPLOYEE') {
      throw new Error("Unauthorized to verify documents");
    }

    const doc = await prisma.document.findUnique({
      where: { id: documentId },
      include: { employee: true }
    });

    if (!doc || doc.employee.companyId !== dbUser.companyId) {
      return { error: "Document not found or access denied" };
    }

    await prisma.document.update({
      where: { id: documentId },
      data: { isVerified: true }
    });

    revalidatePath("/dashboard", "layout");
    return { success: true };
  } catch (error: any) {
    console.error("Verify document error:", error);
    return { error: "Failed to verify document" };
  }
}

export async function createPolicy(data: { title: string, description: string, category: string, effectiveDate: Date }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { companyId: true, role: true }
    });

    if (!dbUser || dbUser.role === 'EMPLOYEE') {
      throw new Error("Unauthorized");
    }

    await prisma.policy.create({
      data: {
        companyId: dbUser.companyId,
        title: data.title,
        description: data.description,
        category: data.category,
        effectiveDate: data.effectiveDate,
        isActive: true
      }
    });

    revalidatePath("/dashboard", "layout");
    return { success: true };
  } catch (error: any) {
    console.error("Create policy error:", error);
    return { error: "Failed to create policy" };
  }
}
