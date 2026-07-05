"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { uploadToGoogleDrive } from "@/lib/googleDrive";

export async function verifyDocument(documentId: string) {
  const session = await getServerSession(authOptions);
    const user = session?.user;

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
  const session = await getServerSession(authOptions);
    const user = session?.user;

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

export async function uploadAdminDocument(formData: FormData) {
  const session = await getServerSession(authOptions);
  const user = session?.user;
  if (!user) throw new Error("Unauthorized");

  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { companyId: true, role: true, employee: true }
    });

    if (!dbUser || dbUser.role === 'EMPLOYEE') {
      throw new Error("Unauthorized to upload company documents");
    }

    const title = formData.get("title") as string;
    const type = formData.get("type") as any;
    const file = formData.get("file") as File;

    if (!title || !type || !file) {
      throw new Error("Missing required fields");
    }

    let fileUrl = "";

    try {
      const driveRes = await uploadToGoogleDrive(dbUser.companyId, file, title);
      fileUrl = driveRes.webViewLink || driveRes.webContentLink || "";
    } catch (e: any) {
      console.warn("Google Drive upload failed. Your admin needs to login with Google to grant Drive access. Falling back to placeholder.", e);
      fileUrl = "https://placeholder.url/doc";
    }

    await prisma.document.create({
      data: {
        employeeId: dbUser.employee?.id || "",
        title: title,
        type: type,
        fileUrl: fileUrl,
        isVerified: true,
      }
    });

    revalidatePath("/dashboard", "layout");
    return { success: true };
  } catch (error: any) {
    console.error("Upload error:", error);
    return { error: error.message || "Failed to upload document" };
  }
}
