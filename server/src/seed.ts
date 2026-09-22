import { prisma } from "./db.js";

async function main() {
  console.log("🌱 Starting database seed...");

  // 1. Seed Branches
  const branches = ["CSE", "ECE", "ME", "CE", "AIML"];
  const branchMap: Record<string, number> = {};
  for (const b of branches) {
    const record = await prisma.branch.upsert({
      where: { branch: b },
      update: {},
      create: { branch: b },
    });
    branchMap[b] = record.id;
  }
  console.log(`✓ Branches seeded: ${branches.join(", ")}`);

  // 2. Seed Years (1 to 4)
  const years = [1, 2, 3, 4];
  const yearMap: Record<number, number> = {};
  for (const y of years) {
    const record = await prisma.year.upsert({
      where: { year: y },
      update: {},
      create: { year: y },
    });
    yearMap[y] = record.id;
  }
  console.log(`✓ Years seeded: ${years.join(", ")}`);

  // 3. Seed Sections (A, B, C)
  const sections = ["A", "B", "C"];
  const sectionMap: Record<string, number> = {};
  for (const s of sections) {
    const record = await prisma.section.upsert({
      where: { section: s },
      update: {},
      create: { section: s },
    });
    sectionMap[s] = record.id;
  }
  console.log(`✓ Sections seeded: ${sections.join(", ")}`);

  // 4. Seed Sample Students
  const sampleStudents = [
    {
      roll: "1JT21CS001",
      firstName: "Aarav",
      lastName: "Sharma",
      branch: "CSE",
      year: 3,
      section: "A",
    },
    {
      roll: "1JT21CS042",
      firstName: "Diya",
      lastName: "Patel",
      branch: "CSE",
      year: 3,
      section: "A",
    },
    {
      roll: "1JT21CS095",
      firstName: "Shiva",
      lastName: "Kumar",
      branch: "CSE",
      year: 3,
      section: "B",
    },
    {
      roll: "1JT22EC015",
      firstName: "Rohan",
      lastName: "Verma",
      branch: "ECE",
      year: 2,
      section: "A",
    },
    {
      roll: "1JT23ME008",
      firstName: "Ananya",
      lastName: "Reddy",
      branch: "ME",
      year: 1,
      section: "A",
    },
  ];

  for (const s of sampleStudents) {
    await prisma.student.upsert({
      where: { roll: s.roll },
      update: {
        firstName: s.firstName,
        lastName: s.lastName,
        branchId: branchMap[s.branch],
        yearId: yearMap[s.year],
        sectionId: sectionMap[s.section],
      },
      create: {
        roll: s.roll,
        firstName: s.firstName,
        lastName: s.lastName,
        branchId: branchMap[s.branch],
        yearId: yearMap[s.year],
        sectionId: sectionMap[s.section],
      },
    });
  }
  console.log(`✓ ${sampleStudents.length} sample students seeded`);

  console.log("🚀 Database seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
