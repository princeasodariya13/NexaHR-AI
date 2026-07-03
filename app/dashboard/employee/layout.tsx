import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";

export default async function EmployeeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true }
  });

  // Redirect admins trying to access employee pages,
  // unless they are princeasodariya13@gmail.com which can access both.
  if (dbUser?.role !== "EMPLOYEE" && user.email !== "princeasodariya13@gmail.com") {
    redirect("/dashboard/admin");
  }

  return <>{children}</>;
}
