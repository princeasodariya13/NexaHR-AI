const { createClient } = require('@supabase/supabase-js');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function createAdmin() {
  const email = 'princeasodariya13@gmail.com';
  const password = 'admin@123';
  
  // 1. Create/Update in Supabase Auth
  let { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  let existingUser = users.find(u => u.email === email);
  
  let userId;
  if (!existingUser) {
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });
    if (authError) {
      console.error('Supabase Auth error:', authError);
      return;
    }
    userId = authData.user.id;
    console.log('Created user in Supabase Auth');
  } else {
    userId = existingUser.id;
    await supabase.auth.admin.updateUserById(userId, { password });
    console.log('Updated user password in Supabase Auth');
  }
  
  // 2. Upsert in Prisma
  let company = await prisma.company.findFirst();
  if (!company) {
    company = await prisma.company.create({ data: { name: 'NexaHR' }});
  }
  
  await prisma.user.upsert({
    where: { email },
    update: { role: 'SUPER_ADMIN', companyId: company.id },
    create: { id: userId, email, role: 'SUPER_ADMIN', companyId: company.id }
  });
  
  console.log('Successfully configured admin user in Database!');
}
createAdmin().catch(console.error).finally(() => prisma.$disconnect());
