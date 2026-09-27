import { prisma } from "./db.js";

async function main() {
  console.log("🌱 Starting universal multi-tenant database seed...");

  // 1. Seed Organizations
  const orgs = [
    {
      slug: "campus",
      name: "Jyothy Institute of Technology",
      category: "campus",
      punchLabel: "Roll Call",
      description: "University academic attendance and lecture verification",
      departments: ["Computer Science & Engineering", "Electronics & Communication", "Mechanical Engineering", "AIML"],
    },
    {
      slug: "tech-corp",
      name: "CloudScale Technologies Corp",
      category: "corporate",
      punchLabel: "Clock In / Out",
      description: "Enterprise shift tracking, developer clock-in, and overtime analytics",
      departments: ["Platform Engineering", "Security Architecture", "Product Design", "DevOps & SRE"],
    },
    {
      slug: "city-hospital",
      name: "Metro Health & Trauma Center",
      category: "healthcare",
      punchLabel: "Duty Sign-In",
      description: "Physician ward rounds, nursing shifts, and ICU duty verification",
      departments: ["Emergency Medicine", "Cardiology", "Neurology", "Intensive Care Unit"],
    },
    {
      slug: "apex-events",
      name: "Global Web3 & AI Summit 2026",
      category: "events",
      punchLabel: "VIP Badge Entry",
      description: "Conference attendee badging, speaker verification, and stage access control",
      departments: ["Keynote Hall", "Hackathon Zone", "VIP Lounge", "Workshop Track"],
    },
  ];

  const orgMap: Record<string, string> = {};
  const deptMap: Record<string, number> = {};

  for (const o of orgs) {
    const org = await prisma.organization.upsert({
      where: { slug: o.slug },
      update: {
        name: o.name,
        category: o.category,
        punchLabel: o.punchLabel,
        description: o.description,
      },
      create: {
        slug: o.slug,
        name: o.name,
        category: o.category,
        punchLabel: o.punchLabel,
        description: o.description,
      },
    });
    orgMap[o.slug] = org.id;

    for (const dName of o.departments) {
      const dept = await prisma.department.upsert({
        where: { id: (await prisma.department.findFirst({ where: { orgId: org.id, name: dName } }))?.id || 0 },
        update: { name: dName },
        create: {
          orgId: org.id,
          name: dName,
          code: dName.slice(0, 4).toUpperCase(),
        },
      });
      deptMap[`${o.slug}:${dName}`] = dept.id;
    }
  }
  console.log(`✓ 4 Multi-Tenant Organizations seeded: ${orgs.map((o) => o.name).join(", ")}`);

  // 2. Seed Academic Branches, Years, Sections (for backward compatibility)
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

  // 3. Seed Generalized Universal Members / Students across multiple tenants
  const sampleMembers = [
    // University Students
    {
      roll: "1JT21CS001",
      firstName: "Aarav",
      lastName: "Sharma",
      email: "aarav.sharma@campus.edu",
      role: "student",
      orgSlug: "campus",
      branch: "CSE",
      year: 3,
      section: "A",
    },
    {
      roll: "1JT21CS042",
      firstName: "Diya",
      lastName: "Patel",
      email: "diya.patel@campus.edu",
      role: "student",
      orgSlug: "campus",
      branch: "CSE",
      year: 3,
      section: "A",
    },
    {
      roll: "1JT21CS095",
      firstName: "Shiva",
      lastName: "Kumar",
      email: "shiva.kumar@campus.edu",
      role: "student",
      orgSlug: "campus",
      branch: "CSE",
      year: 3,
      section: "B",
    },
    {
      roll: "1JT22EC015",
      firstName: "Rohan",
      lastName: "Verma",
      email: "rohan.verma@campus.edu",
      role: "student",
      orgSlug: "campus",
      branch: "ECE",
      year: 2,
      section: "A",
    },
    {
      roll: "1JT23ME008",
      firstName: "Ananya",
      lastName: "Reddy",
      email: "ananya.reddy@campus.edu",
      role: "student",
      orgSlug: "campus",
      branch: "ME",
      year: 1,
      section: "A",
    },
    // Corporate Employees (Tech Park)
    {
      roll: "EMP-4091",
      firstName: "Vikram",
      lastName: "Nair",
      email: "vikram.nair@cloudscale.io",
      role: "employee",
      orgSlug: "tech-corp",
      branch: "CSE",
      year: 4,
      section: "A",
    },
    {
      roll: "EMP-8820",
      firstName: "Pooja",
      lastName: "Menon",
      email: "pooja.menon@cloudscale.io",
      role: "employee",
      orgSlug: "tech-corp",
      branch: "CSE",
      year: 4,
      section: "B",
    },
    // Hospital Healthcare Staff
    {
      roll: "DOC-102",
      firstName: "Dr. Rajesh",
      lastName: "Iyer",
      email: "r.iyer@metrohealth.org",
      role: "doctor",
      orgSlug: "city-hospital",
      branch: "AIML",
      year: 4,
      section: "A",
    },
  ];

  for (const s of sampleMembers) {
    const orgId = orgMap[s.orgSlug];
    await prisma.student.upsert({
      where: { roll: s.roll },
      update: {
        firstName: s.firstName,
        lastName: s.lastName,
        email: s.email,
        role: s.role,
        orgId,
        branchId: branchMap[s.branch],
        yearId: yearMap[s.year],
        sectionId: sectionMap[s.section],
      },
      create: {
        roll: s.roll,
        firstName: s.firstName,
        lastName: s.lastName,
        email: s.email,
        role: s.role,
        orgId,
        branchId: branchMap[s.branch],
        yearId: yearMap[s.year],
        sectionId: sectionMap[s.section],
      },
    });
  }
  console.log(`✓ ${sampleMembers.length} universal multi-tenant members seeded across Campus, Corporate, and Healthcare.`);

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
