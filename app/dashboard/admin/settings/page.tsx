import prisma from "@/lib/prisma";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { SettingsClient } from "./SettingsClient";

export default async function AdminSettingsPage() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/login');
  }

  let company = null;
  let employee = null;

  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        company: true,
        employee: true
      }
    });

    if (dbUser) {
      company = dbUser.company ? {
        name: dbUser.company.name,
        website: dbUser.company.website
      } : null;
      
      employee = dbUser.employee ? {
        firstName: dbUser.employee.firstName,
        lastName: dbUser.employee.lastName
      } : null;
    }
  } catch (err) {
    console.error("Prisma Database fetching failed in Admin Settings:", err);
  }

  return (
    <SettingsClient company={company} employee={employee} />
  );
}
