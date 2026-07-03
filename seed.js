const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log("Connecting to database to seed real data...");
    
    // Get the first user/company
    let user = await prisma.user.findFirst();
    if (!user) {
      console.log("No user found. Creating a default company and user...");
      const company = await prisma.company.create({
        data: { name: "NexaHR Company", website: "nexahr.com" }
      });
      user = await prisma.user.create({
        data: {
          id: "fake-uuid-if-not-supabase", // We will try to find a real one first
          email: "admin@nexahr.com",
          companyId: company.id,
          role: "SUPER_ADMIN"
        }
      });
    }

    const companyId = user.companyId;

    // Remove old data to ensure clean slate
    await prisma.attendance.deleteMany();
    await prisma.leaveRequest.deleteMany();
    await prisma.candidate.deleteMany();
    await prisma.job.deleteMany();
    await prisma.document.deleteMany();
    await prisma.employee.deleteMany();

    console.log("Cleared old records. Seeding 2 real employees...");

    // Create 2 Real Employees
    const emp1 = await prisma.employee.create({
      data: {
        companyId,
        userId: user.id, // Linking to the admin user for simplicity
        employeeCode: "EMP-001",
        firstName: "Michael",
        lastName: "Scott",
        workEmail: "michael.scott@nexahr.com",
        designation: "Regional Manager",
        joiningDate: new Date("2023-01-15"),
        status: "ACTIVE"
      }
    });

    // Create a dummy user record for emp2 so we can satisfy userId unique constraint
    const user2 = await prisma.user.create({
      data: {
        email: "dwight.schrute@nexahr.com",
        companyId,
        role: "EMPLOYEE"
      }
    });

    const emp2 = await prisma.employee.create({
      data: {
        companyId,
        userId: user2.id,
        employeeCode: "EMP-002",
        firstName: "Dwight",
        lastName: "Schrute",
        workEmail: "dwight.schrute@nexahr.com",
        designation: "Assistant to the Regional Manager",
        joiningDate: new Date("2023-02-01"),
        status: "ACTIVE"
      }
    });

    console.log("Seeding Attendance...");
    const today = new Date();
    today.setHours(9, 0, 0, 0);
    
    await prisma.attendance.createMany({
      data: [
        { employeeId: emp1.id, date: today, status: "PRESENT", checkInTime: today, ipAddress: "192.168.1.1" },
        { employeeId: emp2.id, date: today, status: "PRESENT", checkInTime: today, ipAddress: "192.168.1.2" }
      ]
    });

    console.log("Seeding Leaves...");
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    
    // We need a leave type first? Schema doesn't require LeaveType relation to exist as a foreign key strictly if it's just a string id in some setups, but let's check schema.
    // wait, leaveTypeId is a String, we can pass a random uuid.
    await prisma.leaveRequest.create({
      data: {
        companyId,
        employeeId: emp1.id,
        leaveTypeId: "type-annual",
        startDate: tomorrow,
        endDate: tomorrow,
        totalDays: 1,
        reason: "Dentist appointment",
        status: "PENDING"
      }
    });

    console.log("Seeding Jobs & Candidates...");
    const job = await prisma.job.create({
      data: {
        companyId,
        title: "Senior Developer",
        department: "Engineering",
        location: "Remote",
        type: "Full-time",
        description: "Looking for a senior dev.",
        requirements: "React, Node.js",
        isActive: true
      }
    });

    await prisma.candidate.create({
      data: {
        jobId: job.id,
        firstName: "Jim",
        lastName: "Halpert",
        email: "jim@example.com",
        status: "INTERVIEW_SCHEDULED",
        aiMatchScore: 85.5
      }
    });

    console.log("Seeding Documents...");
    await prisma.document.create({
      data: {
        employeeId: emp1.id,
        title: "Employment Contract",
        type: "CONTRACT",
        fileUrl: "https://example.com/contract.pdf",
        isVerified: true
      }
    });

    console.log("Seeding Payroll...");
    const payroll = await prisma.payrollRun.create({
      data: {
        companyId,
        month: today.getMonth() + 1,
        year: today.getFullYear(),
        status: "APPROVED",
        totalAmount: 15000
      }
    });

    await prisma.payslip.createMany({
      data: [
        { payrollRunId: payroll.id, employeeId: emp1.id, basicSalary: 8000, allowances: 2000, deductions: 1000, netSalary: 9000 },
        { payrollRunId: payroll.id, employeeId: emp2.id, basicSalary: 5000, allowances: 1500, deductions: 500, netSalary: 6000 }
      ]
    });

    console.log("Successfully seeded 2 real data records across all dashboard modules!");
  } catch (error) {
    console.error("Failed to seed data:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
