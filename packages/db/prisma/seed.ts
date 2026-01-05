/**
 * Seed Script for SIMAPBE (Bandung Gov-Connect)
 *
 * Seeds:
 * 1. OPDs (Organisasi Perangkat Daerah) - Key agencies in Kota Bandung
 * 2. Sample Users with Roles (SUPER_ADMIN, OPERATOR, AUDITOR, LEADER)
 * 3. Business Processes (Probismet) - Reference codes per Perpres 132/2022
 * 4. Demo Data for each domain
 *
 * Run: bun db:seed
 */

import "dotenv/config";
import { scryptAsync } from "@noble/hashes/scrypt.js";
import { bytesToHex, randomBytes } from "@noble/hashes/utils.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/client";

/**
 * Better Auth scrypt configuration - MUST MATCH EXACTLY
 * @see https://github.com/better-auth/better-auth/blob/main/packages/better-auth/src/crypto/password.ts
 */
const scryptConfig = {
  N: 16_384,
  r: 16,
  p: 1,
  dkLen: 64,
};

/**
 * Hash password using scrypt with Better Auth's exact parameters
 * Format: salt:derivedKey (both as hex strings)
 */
async function hashPassword(password: string): Promise<string> {
  const salt = bytesToHex(randomBytes(16));
  const derivedKey = await scryptAsync(password.normalize("NFKC"), salt, {
    N: scryptConfig.N,
    r: scryptConfig.r,
    p: scryptConfig.p,
    dkLen: scryptConfig.dkLen,
    maxmem: 128 * scryptConfig.N * scryptConfig.r * 2,
  });
  return `${salt}:${bytesToHex(derivedKey)}`;
}

// Load from env or use fallback for local development
const databaseUrl =
  process.env.DATABASE_URL ||
  "postgresql://postgres:root@localhost:5432/simapbe";

const adapter = new PrismaPg({
  connectionString: databaseUrl,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Starting seed...\n");

  // ============================================
  // 1. SEED OPDs (Organisasi Perangkat Daerah)
  // ============================================
  console.log("📁 Seeding OPDs...");

  const opds = await Promise.all([
    prisma.opd.upsert({
      where: { code: "DISKOMINFO" },
      update: {},
      create: {
        code: "DISKOMINFO",
        name: "Dinas Komunikasi dan Informatika Kota Bandung",
        acronym: "DISKOMINFO",
        address: "Jl. Wastukancana No. 2, Bandung",
        phone: "(022) 4232338",
        email: "diskominfo@bandung.go.id",
      },
    }),
    prisma.opd.upsert({
      where: { code: "DINKES" },
      update: {},
      create: {
        code: "DINKES",
        name: "Dinas Kesehatan Kota Bandung",
        acronym: "DINKES",
        address: "Jl. Supratman No. 73, Bandung",
        phone: "(022) 7272014",
        email: "dinkes@bandung.go.id",
      },
    }),
    prisma.opd.upsert({
      where: { code: "DISDIK" },
      update: {},
      create: {
        code: "DISDIK",
        name: "Dinas Pendidikan Kota Bandung",
        acronym: "DISDIK",
        address: "Jl. Jenderal Ahmad Yani No. 239, Bandung",
        phone: "(022) 7271172",
        email: "disdik@bandung.go.id",
      },
    }),
    prisma.opd.upsert({
      where: { code: "DISDUKCAPIL" },
      update: {},
      create: {
        code: "DISDUKCAPIL",
        name: "Dinas Kependudukan dan Pencatatan Sipil Kota Bandung",
        acronym: "DISDUKCAPIL",
        address: "Jl. Ambon No. 1, Bandung",
        phone: "(022) 4207741",
        email: "disdukcapil@bandung.go.id",
      },
    }),
    prisma.opd.upsert({
      where: { code: "BAPPELITBANG" },
      update: {},
      create: {
        code: "BAPPELITBANG",
        name: "Badan Perencanaan Pembangunan, Penelitian dan Pengembangan Kota Bandung",
        acronym: "BAPPELITBANG",
        address: "Jl. Tamansari No. 76, Bandung",
        phone: "(022) 2500993",
        email: "bappelitbang@bandung.go.id",
      },
    }),
    prisma.opd.upsert({
      where: { code: "INSPEKTORAT" },
      update: {},
      create: {
        code: "INSPEKTORAT",
        name: "Inspektorat Kota Bandung",
        acronym: "INSPEKTORAT",
        address: "Jl. Tera No. 20, Bandung",
        phone: "(022) 4235052",
        email: "inspektorat@bandung.go.id",
      },
    }),
    prisma.opd.upsert({
      where: { code: "BPKAD" },
      update: {},
      create: {
        code: "BPKAD",
        name: "Badan Pengelolaan Keuangan dan Aset Daerah Kota Bandung",
        acronym: "BPKAD",
        address: "Jl. Wastukancana No. 2, Bandung",
        phone: "(022) 4232116",
        email: "bpkad@bandung.go.id",
      },
    }),
    prisma.opd.upsert({
      where: { code: "DISHUB" },
      update: {},
      create: {
        code: "DISHUB",
        name: "Dinas Perhubungan Kota Bandung",
        acronym: "DISHUB",
        address: "Jl. Soekarno-Hatta No. 205, Bandung",
        phone: "(022) 7507008",
        email: "dishub@bandung.go.id",
      },
    }),
  ]);

  console.log(`   ✅ Created ${opds.length} OPDs\n`);

  // ============================================
  // 2. SEED USERS WITH DIFFERENT ROLES
  // Reference: RBAC per Perpres 132/2022
  // ============================================
  console.log("👤 Seeding Users with Roles...");

  // Get OPD references for user assignments
  const diskominfoOpdRef = opds.find((o) => o.code === "DISKOMINFO");
  const dinkesOpdRef = opds.find((o) => o.code === "DINKES");
  const disdikOpdRef = opds.find((o) => o.code === "DISDIK");
  const inspektoratOpdRef = opds.find((o) => o.code === "INSPEKTORAT");
  const bappelitbangOpdRef = opds.find((o) => o.code === "BAPPELITBANG");

  // Hash passwords once (all demo users use same password for simplicity)
  const hashedPassword = await hashPassword("password123");

  // Create users with different roles
  const users = await Promise.all([
    // SUPER_ADMIN - Diskominfo Admin (Full system access)
    prisma.user.upsert({
      where: { email: "admin@bandung.go.id" },
      update: {},
      create: {
        id: "usr_superadmin_001",
        name: "Super Admin Diskominfo",
        email: "admin@bandung.go.id",
        emailVerified: true,
        role: "SUPER_ADMIN",
        opdId: diskominfoOpdRef?.id,
      },
    }),
    // OPERATOR - OPD Staff (DISKOMINFO)
    prisma.user.upsert({
      where: { email: "operator.diskominfo@bandung.go.id" },
      update: {},
      create: {
        id: "usr_operator_diskominfo",
        name: "Operator Diskominfo",
        email: "operator.diskominfo@bandung.go.id",
        emailVerified: true,
        role: "OPERATOR",
        opdId: diskominfoOpdRef?.id,
      },
    }),
    // OPERATOR - OPD Staff (DINKES)
    prisma.user.upsert({
      where: { email: "operator.dinkes@bandung.go.id" },
      update: {},
      create: {
        id: "usr_operator_dinkes",
        name: "Operator Dinas Kesehatan",
        email: "operator.dinkes@bandung.go.id",
        emailVerified: true,
        role: "OPERATOR",
        opdId: dinkesOpdRef?.id,
      },
    }),
    // OPERATOR - OPD Staff (DISDIK)
    prisma.user.upsert({
      where: { email: "operator.disdik@bandung.go.id" },
      update: {},
      create: {
        id: "usr_operator_disdik",
        name: "Operator Dinas Pendidikan",
        email: "operator.disdik@bandung.go.id",
        emailVerified: true,
        role: "OPERATOR",
        opdId: disdikOpdRef?.id,
      },
    }),
    // AUDITOR - Inspektorat (Read-only audit access)
    prisma.user.upsert({
      where: { email: "auditor@bandung.go.id" },
      update: {},
      create: {
        id: "usr_auditor_001",
        name: "Auditor Inspektorat",
        email: "auditor@bandung.go.id",
        emailVerified: true,
        role: "AUDITOR",
        opdId: inspektoratOpdRef?.id,
      },
    }),
    // LEADER - Executive (Dashboard view, strategic planning)
    prisma.user.upsert({
      where: { email: "pimpinan@bandung.go.id" },
      update: {},
      create: {
        id: "usr_leader_001",
        name: "Kepala Bappelitbang",
        email: "pimpinan@bandung.go.id",
        emailVerified: true,
        role: "LEADER",
        opdId: bappelitbangOpdRef?.id,
      },
    }),
  ]);

  // Create accounts for each user (Better Auth stores passwords in Account table)
  const accounts = await Promise.all(
    users.map((user) =>
      prisma.account.upsert({
        where: {
          id: `acc_${user.id}`,
        },
        update: {},
        create: {
          id: `acc_${user.id}`,
          userId: user.id,
          accountId: user.id,
          providerId: "credential",
          password: hashedPassword,
        },
      })
    )
  );

  console.log(
    `   ✅ Created ${users.length} Users with ${accounts.length} Accounts\n`
  );
  console.log("   📋 Demo Login Credentials:");
  console.log(
    "   ┌─────────────────────────────────────────────────────────────┐"
  );
  console.log(
    "   │ Role        │ Email                              │ Password │"
  );
  console.log(
    "   ├─────────────────────────────────────────────────────────────┤"
  );
  console.log(
    "   │ SUPER_ADMIN │ admin@bandung.go.id                │ password123 │"
  );
  console.log(
    "   │ OPERATOR    │ operator.diskominfo@bandung.go.id  │ password123 │"
  );
  console.log(
    "   │ OPERATOR    │ operator.dinkes@bandung.go.id      │ password123 │"
  );
  console.log(
    "   │ OPERATOR    │ operator.disdik@bandung.go.id      │ password123 │"
  );
  console.log(
    "   │ AUDITOR     │ auditor@bandung.go.id              │ password123 │"
  );
  console.log(
    "   │ LEADER      │ pimpinan@bandung.go.id             │ password123 │"
  );
  console.log(
    "   └─────────────────────────────────────────────────────────────┘\n"
  );

  // ============================================
  // 3. SEED BUSINESS PROCESSES (Probismet)
  // Reference: Perpres 132/2022 - Standard Codes
  // ============================================
  console.log("🔄 Seeding Business Processes (Probismet)...");

  // Level 1: Sektor Pemerintahan
  const sektorPemerintahan = await prisma.businessProcess.upsert({
    where: { kodeProbismet: "RAB" },
    update: {},
    create: {
      kodeProbismet: "RAB",
      name: "Rumpun Administrasi Pemerintahan",
      description: "Sektor administrasi pemerintahan daerah",
      level: 1,
    },
  });

  const sektorKesejahteraan = await prisma.businessProcess.upsert({
    where: { kodeProbismet: "RKR" },
    update: {},
    create: {
      kodeProbismet: "RKR",
      name: "Rumpun Kesejahteraan Rakyat",
      description: "Sektor kesejahteraan masyarakat",
      level: 1,
    },
  });

  const sektorPembangunan = await prisma.businessProcess.upsert({
    where: { kodeProbismet: "RPE" },
    update: {},
    create: {
      kodeProbismet: "RPE",
      name: "Rumpun Perekonomian",
      description: "Sektor perekonomian dan pembangunan",
      level: 1,
    },
  });

  // Level 2: Urusan Pemerintahan (Under RAB)
  const urusanKependudukan = await prisma.businessProcess.upsert({
    where: { kodeProbismet: "RAB.01" },
    update: {},
    create: {
      kodeProbismet: "RAB.01",
      name: "Urusan Administrasi Kependudukan",
      description: "Pengelolaan data kependudukan dan pencatatan sipil",
      level: 2,
      parentId: sektorPemerintahan.id,
    },
  });

  const urusanKomunikasi = await prisma.businessProcess.upsert({
    where: { kodeProbismet: "RAB.02" },
    update: {},
    create: {
      kodeProbismet: "RAB.02",
      name: "Urusan Komunikasi dan Informatika",
      description: "Pengelolaan teknologi informasi dan komunikasi",
      level: 2,
      parentId: sektorPemerintahan.id,
    },
  });

  // Level 2: Urusan Pemerintahan (Under RKR)
  const urusanKesehatan = await prisma.businessProcess.upsert({
    where: { kodeProbismet: "RKR.01" },
    update: {},
    create: {
      kodeProbismet: "RKR.01",
      name: "Urusan Kesehatan",
      description: "Pengelolaan layanan kesehatan masyarakat",
      level: 2,
      parentId: sektorKesejahteraan.id,
    },
  });

  const urusanPendidikan = await prisma.businessProcess.upsert({
    where: { kodeProbismet: "RKR.02" },
    update: {},
    create: {
      kodeProbismet: "RKR.02",
      name: "Urusan Pendidikan",
      description: "Pengelolaan layanan pendidikan",
      level: 2,
      parentId: sektorKesejahteraan.id,
    },
  });

  // Level 3: Fungsi (Under Urusan)
  const fungsiKTP = await prisma.businessProcess.upsert({
    where: { kodeProbismet: "RAB.01.01" },
    update: {},
    create: {
      kodeProbismet: "RAB.01.01",
      name: "Fungsi Penerbitan KTP Elektronik",
      description: "Proses penerbitan Kartu Tanda Penduduk Elektronik",
      level: 3,
      parentId: urusanKependudukan.id,
    },
  });

  const fungsiAktaKelahiran = await prisma.businessProcess.upsert({
    where: { kodeProbismet: "RAB.01.02" },
    update: {},
    create: {
      kodeProbismet: "RAB.01.02",
      name: "Fungsi Penerbitan Akta Kelahiran",
      description: "Proses penerbitan akta kelahiran",
      level: 3,
      parentId: urusanKependudukan.id,
    },
  });

  const fungsiDataCenter = await prisma.businessProcess.upsert({
    where: { kodeProbismet: "RAB.02.01" },
    update: {},
    create: {
      kodeProbismet: "RAB.02.01",
      name: "Fungsi Pengelolaan Data Center",
      description: "Pengelolaan pusat data pemerintah daerah",
      level: 3,
      parentId: urusanKomunikasi.id,
    },
  });

  const fungsiPuskesmas = await prisma.businessProcess.upsert({
    where: { kodeProbismet: "RKR.01.01" },
    update: {},
    create: {
      kodeProbismet: "RKR.01.01",
      name: "Fungsi Pelayanan Puskesmas",
      description: "Pelayanan kesehatan dasar di Puskesmas",
      level: 3,
      parentId: urusanKesehatan.id,
    },
  });

  const fungsiPPDB = await prisma.businessProcess.upsert({
    where: { kodeProbismet: "RKR.02.01" },
    update: {},
    create: {
      kodeProbismet: "RKR.02.01",
      name: "Fungsi Penerimaan Peserta Didik Baru",
      description: "Proses PPDB untuk sekolah negeri",
      level: 3,
      parentId: urusanPendidikan.id,
    },
  });

  console.log("   ✅ Created Business Process hierarchy (3 levels)\n");

  // ============================================
  // 3. SEED DATA STANDARDS (Satu Data)
  // ============================================
  console.log("📊 Seeding Data Standards...");

  const disdukcapilOpd = opds.find((o) => o.code === "DISDUKCAPIL");
  const dinkesOpd = opds.find((o) => o.code === "DINKES");
  const disdikOpd = opds.find((o) => o.code === "DISDIK");

  const dataStandards = await Promise.all([
    prisma.dataStandard.upsert({
      where: { dataCode: "DS-KPD-001" },
      update: {},
      create: {
        dataCode: "DS-KPD-001",
        dataName: "Data Kependudukan",
        description: "Data master penduduk Kota Bandung",
        format: "JSON",
        validityPeriod: "Annual",
        updateFrequency: "Daily",
        classification: "RESTRICTED",
        producerOpdId: disdukcapilOpd?.id,
        isValidated: true,
        validatedAt: new Date(),
      },
    }),
    prisma.dataStandard.upsert({
      where: { dataCode: "DS-KES-001" },
      update: {},
      create: {
        dataCode: "DS-KES-001",
        dataName: "Data Puskesmas",
        description: "Data fasilitas dan layanan Puskesmas",
        format: "JSON",
        validityPeriod: "Monthly",
        updateFrequency: "Weekly",
        classification: "PUBLIC",
        producerOpdId: dinkesOpd?.id,
        isValidated: true,
        validatedAt: new Date(),
      },
    }),
    prisma.dataStandard.upsert({
      where: { dataCode: "DS-PDK-001" },
      update: {},
      create: {
        dataCode: "DS-PDK-001",
        dataName: "Data Sekolah",
        description: "Data sekolah negeri dan swasta",
        format: "JSON",
        validityPeriod: "Annual",
        updateFrequency: "Quarterly",
        classification: "PUBLIC",
        producerOpdId: disdikOpd?.id,
        isValidated: true,
        validatedAt: new Date(),
      },
    }),
  ]);

  console.log(`   ✅ Created ${dataStandards.length} Data Standards\n`);

  // ============================================
  // 4. SEED APPLICATIONS
  // ============================================
  console.log("💻 Seeding Applications...");

  const diskominfoOpd = opds.find((o) => o.code === "DISKOMINFO");

  const applications = await Promise.all([
    prisma.application.upsert({
      where: { code: "APP-SIAK" },
      update: {},
      create: {
        code: "APP-SIAK",
        name: "SIAK - Sistem Informasi Administrasi Kependudukan",
        type: "UMUM",
        platform: "WEB",
        status: "ACTIVE",
        description: "Sistem pengelolaan data kependudukan terintegrasi",
        programmingLang: "Java",
        framework: "Spring Boot",
        databaseType: "PostgreSQL",
        opdId: disdukcapilOpd?.id || diskominfoOpd?.id || opds[0].id,
        productionDate: new Date("2020-01-01"),
      },
    }),
    prisma.application.upsert({
      where: { code: "APP-SIMPUS" },
      update: {},
      create: {
        code: "APP-SIMPUS",
        name: "SIMPUS - Sistem Informasi Manajemen Puskesmas",
        type: "KHUSUS",
        platform: "WEB",
        status: "ACTIVE",
        description: "Sistem pengelolaan layanan Puskesmas",
        programmingLang: "PHP",
        framework: "Laravel",
        databaseType: "MySQL",
        opdId: dinkesOpd?.id || diskominfoOpd?.id || opds[0].id,
        productionDate: new Date("2019-06-01"),
      },
    }),
    prisma.application.upsert({
      where: { code: "APP-PPDB" },
      update: {},
      create: {
        code: "APP-PPDB",
        name: "PPDB Online - Penerimaan Peserta Didik Baru",
        type: "KHUSUS",
        platform: "WEB",
        status: "ACTIVE",
        description: "Sistem pendaftaran siswa baru online",
        programmingLang: "TypeScript",
        framework: "Next.js",
        databaseType: "PostgreSQL",
        opdId: disdikOpd?.id || diskominfoOpd?.id || opds[0].id,
        productionDate: new Date("2021-03-01"),
      },
    }),
    prisma.application.upsert({
      where: { code: "APP-BANDUNG-SATU-DATA" },
      update: {},
      create: {
        code: "APP-BANDUNG-SATU-DATA",
        name: "Portal Bandung Satu Data",
        type: "UMUM",
        platform: "WEB",
        status: "ACTIVE",
        description: "Portal data terbuka Kota Bandung",
        programmingLang: "TypeScript",
        framework: "Next.js",
        databaseType: "PostgreSQL",
        repositoryUrl: "https://github.com/pemkot-bandung/satu-data",
        opdId: diskominfoOpd?.id || opds[0].id,
        productionDate: new Date("2022-01-01"),
      },
    }),
  ]);

  console.log(`   ✅ Created ${applications.length} Applications\n`);

  // ============================================
  // 5. SEED INFRASTRUCTURE
  // ============================================
  console.log("🖥️  Seeding Infrastructure...");

  const infrastructure = await Promise.all([
    prisma.infrastructure.upsert({
      where: { code: "INF-PDN-001" },
      update: {},
      create: {
        code: "INF-PDN-001",
        name: "PDN Server Cluster A",
        type: "VIRTUAL_MACHINE",
        location: "PDN",
        description: "Primary production cluster at Pusat Data Nasional",
        cpuCores: 32,
        ramGB: 128,
        storageGB: 2000,
        opdId: diskominfoOpd?.id || opds[0].id,
      },
    }),
    prisma.infrastructure.upsert({
      where: { code: "INF-LOCAL-001" },
      update: {},
      create: {
        code: "INF-LOCAL-001",
        name: "Local DC Server 01",
        type: "SERVER_PHYSICAL",
        location: "LOCAL",
        description: "Local data center at Diskominfo",
        ipAddress: "10.10.1.100",
        cpuCores: 16,
        ramGB: 64,
        storageGB: 1000,
        opdId: diskominfoOpd?.id || opds[0].id,
      },
    }),
    prisma.infrastructure.upsert({
      where: { code: "INF-CLOUD-001" },
      update: {},
      create: {
        code: "INF-CLOUD-001",
        name: "Cloud SaaS - Google Workspace",
        type: "CLOUD_SaaS",
        location: "PDN",
        description: "Google Workspace for government email and collaboration",
        opdId: diskominfoOpd?.id || opds[0].id,
      },
    }),
  ]);

  console.log(`   ✅ Created ${infrastructure.length} Infrastructure assets\n`);

  // ============================================
  // 6. SEED SERVICES (Layanan SPBE)
  // ============================================
  console.log("🌐 Seeding Services...");

  const siakApp = applications.find((a) => a.code === "APP-SIAK");
  const simpusApp = applications.find((a) => a.code === "APP-SIMPUS");
  const ppdbApp = applications.find((a) => a.code === "APP-PPDB");

  const services = await Promise.all([
    prisma.service.upsert({
      where: { code: "SVC-KTP" },
      update: {},
      create: {
        code: "SVC-KTP",
        name: "Layanan Penerbitan KTP Elektronik",
        description: "Layanan pembuatan dan penerbitan KTP-el untuk warga",
        type: "G2C",
        url: "https://ktp.bandung.go.id",
        probisId: fungsiKTP.id,
        appId: siakApp?.id,
        isActive: true,
      },
    }),
    prisma.service.upsert({
      where: { code: "SVC-AKTA-LAHIR" },
      update: {},
      create: {
        code: "SVC-AKTA-LAHIR",
        name: "Layanan Penerbitan Akta Kelahiran",
        description: "Layanan pembuatan akta kelahiran",
        type: "G2C",
        url: "https://akta.bandung.go.id",
        probisId: fungsiAktaKelahiran.id,
        appId: siakApp?.id,
        isActive: true,
      },
    }),
    prisma.service.upsert({
      where: { code: "SVC-PUSKESMAS" },
      update: {},
      create: {
        code: "SVC-PUSKESMAS",
        name: "Layanan Pendaftaran Puskesmas Online",
        description: "Pendaftaran online untuk layanan kesehatan di Puskesmas",
        type: "G2C",
        url: "https://puskesmas.bandung.go.id",
        probisId: fungsiPuskesmas.id,
        appId: simpusApp?.id,
        isActive: true,
      },
    }),
    prisma.service.upsert({
      where: { code: "SVC-PPDB" },
      update: {},
      create: {
        code: "SVC-PPDB",
        name: "Layanan PPDB Online",
        description: "Penerimaan Peserta Didik Baru secara online",
        type: "G2C",
        url: "https://ppdb.bandung.go.id",
        probisId: fungsiPPDB.id,
        appId: ppdbApp?.id,
        isActive: true,
      },
    }),
  ]);

  console.log(`   ✅ Created ${services.length} Services\n`);

  // ============================================
  // 7. SEED APPLICATION-DATA RELATIONS
  // ============================================
  console.log("🔗 Seeding Application-Data Relations...");

  const dataKependudukan = dataStandards.find(
    (d) => d.dataCode === "DS-KPD-001"
  );
  const dataPuskesmas = dataStandards.find((d) => d.dataCode === "DS-KES-001");
  const dataSekolah = dataStandards.find((d) => d.dataCode === "DS-PDK-001");

  if (siakApp && dataKependudukan) {
    await prisma.applicationData.upsert({
      where: {
        appId_dataId: { appId: siakApp.id, dataId: dataKependudukan.id },
      },
      update: {},
      create: {
        appId: siakApp.id,
        dataId: dataKependudukan.id,
        relationType: "PRODUCER",
      },
    });
  }

  if (simpusApp && dataPuskesmas) {
    await prisma.applicationData.upsert({
      where: {
        appId_dataId: { appId: simpusApp.id, dataId: dataPuskesmas.id },
      },
      update: {},
      create: {
        appId: simpusApp.id,
        dataId: dataPuskesmas.id,
        relationType: "PRODUCER",
      },
    });
  }

  if (ppdbApp && dataSekolah) {
    await prisma.applicationData.upsert({
      where: { appId_dataId: { appId: ppdbApp.id, dataId: dataSekolah.id } },
      update: {},
      create: {
        appId: ppdbApp.id,
        dataId: dataSekolah.id,
        relationType: "CONSUMER",
      },
    });
  }

  console.log("   ✅ Created Application-Data relations\n");

  // ============================================
  // 8. SEED APPLICATION-INFRASTRUCTURE RELATIONS
  // ============================================
  console.log("🔗 Seeding Application-Infrastructure Relations...");

  const pdnServer = infrastructure.find((i) => i.code === "INF-PDN-001");

  if (siakApp && pdnServer) {
    await prisma.applicationInfrastructure.upsert({
      where: { appId_infraId: { appId: siakApp.id, infraId: pdnServer.id } },
      update: {},
      create: {
        appId: siakApp.id,
        infraId: pdnServer.id,
        purpose: "Production",
      },
    });
  }

  if (simpusApp && pdnServer) {
    await prisma.applicationInfrastructure.upsert({
      where: { appId_infraId: { appId: simpusApp.id, infraId: pdnServer.id } },
      update: {},
      create: {
        appId: simpusApp.id,
        infraId: pdnServer.id,
        purpose: "Production",
      },
    });
  }

  console.log("   ✅ Created Application-Infrastructure relations\n");

  // ============================================
  // 9. SEED SPBE PLANS (Peta Rencana)
  // ============================================
  console.log("📅 Seeding SPBE Plans...");

  const plans = await Promise.all([
    prisma.spbePlan.upsert({
      where: { planCode: "PLAN-2025-001" },
      update: {},
      create: {
        planCode: "PLAN-2025-001",
        year: 2025,
        quarter: 1,
        initiativeName: "Migrasi Aplikasi ke PDN",
        description: "Migrasi seluruh aplikasi kritikal ke Pusat Data Nasional",
        domain: "INFRASTRUKTUR",
        budget: 500_000_000,
        budgetCode: "RKA-DISKOMINFO-2025-01",
        fundingSource: "APBD",
        status: "ONGOING",
        priority: 1,
        isGap: true,
        gapDescription: "Belum semua aplikasi hosted di PDN",
        progressPercent: 30,
        startDate: new Date("2025-01-01"),
        targetEndDate: new Date("2025-12-31"),
      },
    }),
    prisma.spbePlan.upsert({
      where: { planCode: "PLAN-2025-002" },
      update: {},
      create: {
        planCode: "PLAN-2025-002",
        year: 2025,
        quarter: 2,
        initiativeName: "Integrasi Data Kependudukan",
        description:
          "Integrasi data kependudukan dengan sistem nasional (SIAK)",
        domain: "DATA",
        budget: 200_000_000,
        budgetCode: "RKA-DISDUKCAPIL-2025-02",
        fundingSource: "APBD",
        status: "PLANNED",
        priority: 2,
        isGap: true,
        gapDescription: "Data kependudukan belum terintegrasi penuh",
        progressPercent: 0,
        startDate: new Date("2025-04-01"),
        targetEndDate: new Date("2025-09-30"),
      },
    }),
    prisma.spbePlan.upsert({
      where: { planCode: "PLAN-2026-001" },
      update: {},
      create: {
        planCode: "PLAN-2026-001",
        year: 2026,
        initiativeName: "Pengembangan Portal Layanan Terpadu",
        description: "Single portal untuk seluruh layanan publik Kota Bandung",
        domain: "LAYANAN",
        budget: 750_000_000,
        budgetCode: "RKA-DISKOMINFO-2026-01",
        fundingSource: "APBD",
        status: "PLANNED",
        priority: 1,
        isGap: true,
        gapDescription: "Layanan masih tersebar di berbagai portal",
        progressPercent: 0,
        startDate: new Date("2026-01-01"),
        targetEndDate: new Date("2026-12-31"),
      },
    }),
  ]);

  console.log(`   ✅ Created ${plans.length} SPBE Plans\n`);

  // ============================================
  // 10. SEED RISK REGISTERS
  // ============================================
  console.log("⚠️  Seeding Risk Registers...");

  const risks = await Promise.all([
    prisma.riskRegister.upsert({
      where: { riskCode: "RISK-001" },
      update: {},
      create: {
        riskCode: "RISK-001",
        riskDescription: "Kegagalan sistem akibat serangan siber",
        riskCategory: "Security",
        impactLevel: "HIGH",
        likelihoodLevel: "MEDIUM",
        riskScore: 12,
        mitigationPlan: "Implementasi WAF dan regular penetration testing",
        mitigationStatus: "In Progress",
        responsiblePerson: "Tim Keamanan Siber",
        opdId: diskominfoOpd?.id || opds[0].id,
      },
    }),
    prisma.riskRegister.upsert({
      where: { riskCode: "RISK-002" },
      update: {},
      create: {
        riskCode: "RISK-002",
        riskDescription: "Kehilangan data akibat bencana alam",
        riskCategory: "Operational",
        impactLevel: "CRITICAL",
        likelihoodLevel: "LOW",
        riskScore: 8,
        mitigationPlan: "Backup harian ke PDN dan DRC",
        mitigationStatus: "Completed",
        responsiblePerson: "Tim Infrastruktur",
        opdId: diskominfoOpd?.id || opds[0].id,
      },
    }),
  ]);

  console.log(`   ✅ Created ${risks.length} Risk Registers\n`);

  console.log("✅ Seed completed successfully!\n");
  console.log("Summary:");
  console.log(`   - ${opds.length} OPDs`);
  console.log(`   - ${users.length} Users (${accounts.length} Accounts)`);
  console.log("   - 11 Business Processes (3-level hierarchy)");
  console.log(`   - ${dataStandards.length} Data Standards`);
  console.log(`   - ${applications.length} Applications`);
  console.log(`   - ${infrastructure.length} Infrastructure assets`);
  console.log(`   - ${services.length} Services`);
  console.log(`   - ${plans.length} SPBE Plans`);
  console.log(`   - ${risks.length} Risk Registers`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
