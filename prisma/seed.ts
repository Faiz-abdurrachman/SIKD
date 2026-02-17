import { PrismaClient, UserRole, JenisKelamin, Agama, StatusPerkawinan,
  StatusHubunganKeluarga, GolonganDarah, StatusKependudukan, Pendidikan,
  JenisSurat, StatusSurat, JenisMutasi } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

// ══════════════════════════════════════════════════
// HELPER DATA
// ══════════════════════════════════════════════════

const NAMA_LAKI = [
  "Ahmad Rizky Pratama", "Budi Santoso", "Cahyo Wibowo", "Dimas Prasetyo",
  "Eko Saputra", "Fajar Nugroho", "Gilang Ramadhan", "Hendra Wijaya",
  "Irfan Hakim", "Joko Susilo", "Kurniawan Adi", "Lukman Hakim",
  "Muhammad Fadli", "Naufal Hidayat", "Oscar Permana", "Putra Mahardika",
  "Raka Aditya", "Surya Dharma", "Teguh Prabowo", "Umar Faruq",
  "Vino Bastian", "Wahyu Setiawan", "Yusuf Maulana", "Zainal Abidin",
  "Agus Hermawan", "Bambang Suryadi", "Candra Kusuma", "Dedi Mulyadi",
  "Edi Purwanto", "Faisal Rahman", "Gunawan Setiaji", "Hadi Sucipto",
  "Imam Prasetyo", "Joni Iskandar", "Krisna Bayu", "Lutfi Ardiansyah",
  "Mulyono Hadi", "Nanda Saputra", "Oki Setiawan", "Pandu Wicaksono",
  "Rahmat Hidayat", "Sigit Purnomo", "Taufik Ismail", "Ujang Suherman",
  "Wawan Kurniawan", "Yanto Sudrajat", "Zulkifli Ahmad", "Arif Budiman",
  "Bagas Saputra", "Doni Firmansyah",
];

const NAMA_PEREMPUAN = [
  "Siti Nurhaliza", "Dewi Ratnasari", "Ani Yulianti", "Rina Marlina",
  "Sri Wahyuni", "Fitri Handayani", "Nur Aisyah", "Lina Marliani",
  "Wulan Sari", "Putri Amelia", "Rini Kusuma", "Yuni Astuti",
  "Maya Anggraini", "Tika Permata", "Dina Fitriani", "Eka Rahayu",
  "Nisa Aulia", "Ratna Dewi", "Sari Indah", "Vina Oktaviani",
  "Winda Sari", "Yeni Susilowati", "Anisa Rahma", "Bella Safitri",
  "Citra Dewi", "Diana Putri", "Endah Lestari", "Farah Diba",
  "Gita Savitri", "Hesti Purnamasari", "Intan Permata", "Julia Puspita",
  "Kartika Sari", "Laras Wati", "Mega Silvia", "Nina Septiani",
  "Oktavia Ramadhani", "Puspita Sari", "Rina Agustina", "Suci Rahayu",
  "Tiara Ananda", "Ulfa Hidayati", "Vera Anggraeni", "Widya Astuti",
  "Yulia Permata", "Zahra Amelia", "Amira Putri", "Bunga Citra",
  "Cantika Sari", "Dian Puspitasari",
];

const TEMPAT_LAHIR = [
  "Jakarta", "Bandung", "Surabaya", "Semarang", "Yogyakarta",
  "Bekasi", "Tangerang", "Bogor", "Depok", "Malang",
  "Cirebon", "Tasikmalaya", "Karawang", "Cikarang", "Purwakarta",
  "Subang", "Garut", "Sukabumi", "Majalengka", "Kuningan",
];

const PEKERJAAN = [
  "Petani", "Buruh Harian", "Wiraswasta", "Pedagang", "Ibu Rumah Tangga",
  "Karyawan Swasta", "PNS", "Guru", "Nelayan", "Pelajar/Mahasiswa",
  "Tidak/Belum Bekerja", "Tukang", "Sopir", "Montir", "Penjahit",
  "Pensiunan", "TNI/Polri", "Dokter", "Perawat", "Honorer",
];

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateNIK(kodeWilayah: string, tanggalLahir: Date, gender: JenisKelamin, seq: number): string {
  const dd = gender === "PEREMPUAN"
    ? (tanggalLahir.getDate() + 40).toString().padStart(2, "0")
    : tanggalLahir.getDate().toString().padStart(2, "0");
  const mm = (tanggalLahir.getMonth() + 1).toString().padStart(2, "0");
  const yy = tanggalLahir.getFullYear().toString().slice(-2);
  const urut = seq.toString().padStart(4, "0");
  return `${kodeWilayah}${dd}${mm}${yy}${urut}`;
}

function generateNoKK(kodeWilayah: string, seq: number): string {
  const date = new Date();
  const dd = date.getDate().toString().padStart(2, "0");
  const mm = (date.getMonth() + 1).toString().padStart(2, "0");
  const yy = date.getFullYear().toString().slice(-2);
  const urut = seq.toString().padStart(4, "0");
  return `${kodeWilayah}${dd}${mm}${yy}${urut}`;
}

// ══════════════════════════════════════════════════
// MAIN SEED FUNCTION
// ══════════════════════════════════════════════════

async function main() {
  console.log("🌱 Starting seed...");

  // Clean existing data (in correct order due to FK constraints)
  await prisma.auditLog.deleteMany();
  await prisma.suratPenduduk.deleteMany();
  await prisma.surat.deleteMany();
  await prisma.nomorSuratCounter.deleteMany();
  await prisma.mutasi.deleteMany();
  // Detach kepala keluarga before deleting penduduk
  await prisma.keluarga.updateMany({ data: { kepalaKeluargaId: null } });
  await prisma.penduduk.deleteMany();
  await prisma.keluarga.deleteMany();
  await prisma.rT.deleteMany();
  await prisma.rW.deleteMany();
  await prisma.dusun.deleteMany();
  await prisma.desa.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
  await prisma.setting.deleteMany();

  // ─────────────── USERS ───────────────
  console.log("👤 Creating users...");
  const adminPassword = await hash("Admin@2026", 12);
  const userPassword = await hash("User@2026", 12);

  await prisma.user.create({
    data: {
      username: "admin",
      nama: "Administrator",
      email: "admin@sidesa.local",
      passwordHash: adminPassword,
      role: UserRole.SUPER_ADMIN,
      isActive: true,
    },
  });

  const kades = await prisma.user.create({
    data: {
      username: "kades",
      nama: "H. Suherman, S.Sos",
      email: "kades@sidesa.local",
      passwordHash: userPassword,
      role: UserRole.KEPALA_DESA,
      isActive: true,
    },
  });

  await prisma.user.create({
    data: {
      username: "sekdes",
      nama: "Drs. Agus Hermawan",
      email: "sekdes@sidesa.local",
      passwordHash: userPassword,
      role: UserRole.SEKRETARIS,
      isActive: true,
    },
  });

  const operator = await prisma.user.create({
    data: {
      username: "operator",
      nama: "Rina Marlina",
      email: "operator@sidesa.local",
      passwordHash: userPassword,
      role: UserRole.OPERATOR,
      isActive: true,
    },
  });

  // ─────────────── DESA ───────────────
  console.log("🏘️ Creating desa & wilayah...");
  const desa = await prisma.desa.create({
    data: {
      kode: "3216030001",
      nama: "Sukamaju",
      kecamatan: "Cikarang Utara",
      kabupaten: "Bekasi",
      provinsi: "Jawa Barat",
      kodePos: "17530",
      alamatKantor: "Jl. Raya Sukamaju No. 01, Cikarang Utara, Bekasi",
      telepon: "(021) 89130001",
      email: "desa.sukamaju@bekasikab.go.id",
      namaKepalaDesa: "H. Suherman, S.Sos",
      nipKepalaDesa: "196805121990031002",
    },
  });

  // ─────────────── DUSUN → RW → RT ───────────────
  const dusunNames = ["Sukamulya", "Sukamanah", "Sukajaya"];
  const rtData: Array<{ id: string; rwNomor: string; dusunNama: string }> = [];

  for (const dusunName of dusunNames) {
    const dusun = await prisma.dusun.create({
      data: { nama: dusunName, desaId: desa.id },
    });

    for (let rwNum = 1; rwNum <= 2; rwNum++) {
      const rw = await prisma.rW.create({
        data: { nomor: rwNum.toString().padStart(3, "0"), dusunId: dusun.id },
      });

      for (let rtNum = 1; rtNum <= 3; rtNum++) {
        const rt = await prisma.rT.create({
          data: { nomor: rtNum.toString().padStart(3, "0"), rwId: rw.id },
        });
        rtData.push({ id: rt.id, rwNomor: rw.nomor, dusunNama: dusunName });
      }
    }
  }

  console.log(`   Created: ${dusunNames.length} dusun, ${dusunNames.length * 2} RW, ${rtData.length} RT`);

  // ─────────────── KELUARGA & PENDUDUK ───────────────
  console.log("👨‍👩‍👧‍👦 Creating keluarga & penduduk...");

  const KODE_WILAYAH = "321603"; // 6 digit kode kecamatan
  const allPenduduk: Array<{ id: string; nik: string; nama: string; keluargaId: string }> = [];
  let nikSeq = 1;
  let kkSeq = 1;

  for (let kkIdx = 0; kkIdx < 50; kkIdx++) {
    const rt = rtData[kkIdx % rtData.length];
    const noKK = generateNoKK(KODE_WILAYAH, kkSeq++);

    // Create KK first (without kepala)
    const keluarga = await prisma.keluarga.create({
      data: {
        noKK,
        alamat: `Dusun ${rt.dusunNama}, RT ${rt.rwNomor}/${rt.rwNomor}`,
        rtId: rt.id,
      },
    });

    // Determine family size (2-6 members)
    const familySize = 2 + Math.floor(Math.random() * 5); // 2-6

    for (let memberIdx = 0; memberIdx < familySize; memberIdx++) {
      let gender: JenisKelamin;
      let hubungan: StatusHubunganKeluarga;
      let statusKawin: StatusPerkawinan;
      let nama: string;
      let birthDateRange: [Date, Date];

      if (memberIdx === 0) {
        // Kepala Keluarga (laki-laki dewasa)
        gender = JenisKelamin.LAKI_LAKI;
        hubungan = StatusHubunganKeluarga.KEPALA_KELUARGA;
        statusKawin = StatusPerkawinan.KAWIN;
        nama = NAMA_LAKI[kkIdx % NAMA_LAKI.length];
        birthDateRange = [new Date(1960, 0, 1), new Date(1990, 11, 31)];
      } else if (memberIdx === 1) {
        // Istri
        gender = JenisKelamin.PEREMPUAN;
        hubungan = StatusHubunganKeluarga.ISTRI;
        statusKawin = StatusPerkawinan.KAWIN;
        nama = NAMA_PEREMPUAN[kkIdx % NAMA_PEREMPUAN.length];
        birthDateRange = [new Date(1963, 0, 1), new Date(1993, 11, 31)];
      } else {
        // Anak
        gender = Math.random() > 0.5 ? JenisKelamin.LAKI_LAKI : JenisKelamin.PEREMPUAN;
        hubungan = StatusHubunganKeluarga.ANAK;
        statusKawin = StatusPerkawinan.BELUM_KAWIN;
        const nameList = gender === JenisKelamin.LAKI_LAKI ? NAMA_LAKI : NAMA_PEREMPUAN;
        nama = nameList[(kkIdx * 3 + memberIdx) % nameList.length];
        birthDateRange = [new Date(1995, 0, 1), new Date(2020, 11, 31)];
      }

      const tanggalLahir = randomDate(...birthDateRange);
      const nik = generateNIK(KODE_WILAYAH, tanggalLahir, gender, nikSeq++);

      const penduduk = await prisma.penduduk.create({
        data: {
          nik,
          nama,
          tempatLahir: randomElement(TEMPAT_LAHIR),
          tanggalLahir,
          jenisKelamin: gender,
          agama: randomElement([Agama.ISLAM, Agama.ISLAM, Agama.ISLAM, Agama.KRISTEN, Agama.KATOLIK]),
          statusPerkawinan: statusKawin,
          pendidikanTerakhir: randomElement([
            Pendidikan.SD, Pendidikan.SMP, Pendidikan.SMA,
            Pendidikan.SMA, Pendidikan.S1, Pendidikan.D3,
          ]),
          pekerjaan: randomElement(PEKERJAAN),
          golonganDarah: randomElement([
            GolonganDarah.A, GolonganDarah.B, GolonganDarah.AB,
            GolonganDarah.O, GolonganDarah.TIDAK_TAHU,
          ]),
          statusHubungan: hubungan,
          namaAyah: NAMA_LAKI[(kkIdx + 10) % NAMA_LAKI.length],
          namaIbu: NAMA_PEREMPUAN[(kkIdx + 10) % NAMA_PEREMPUAN.length],
          kewarganegaraan: "WNI",
          statusKependudukan: StatusKependudukan.TETAP,
          keluargaId: keluarga.id,
        },
      });

      allPenduduk.push({
        id: penduduk.id,
        nik: penduduk.nik,
        nama: penduduk.nama,
        keluargaId: keluarga.id,
      });

      // Set as kepala keluarga
      if (memberIdx === 0) {
        await prisma.keluarga.update({
          where: { id: keluarga.id },
          data: { kepalaKeluargaId: penduduk.id },
        });
      }
    }
  }

  console.log(`   Created: 50 keluarga, ${allPenduduk.length} penduduk`);

  // ─────────────── SURAT ───────────────
  console.log("📄 Creating surat...");

  const jenisSuratList: JenisSurat[] = [
    JenisSurat.SK_DOMISILI, JenisSurat.SK_TIDAK_MAMPU,
    JenisSurat.SK_USAHA, JenisSurat.SURAT_PENGANTAR,
    JenisSurat.SK_CATATAN_KEPOLISIAN, JenisSurat.SK_BELUM_MENIKAH,
    JenisSurat.SK_KEHILANGAN, JenisSurat.SK_PENGHASILAN,
    JenisSurat.SK_KELAHIRAN, JenisSurat.SK_DOMISILI,
    JenisSurat.SK_TIDAK_MAMPU, JenisSurat.SK_USAHA,
    JenisSurat.SK_DOMISILI, JenisSurat.SURAT_PENGANTAR,
    JenisSurat.SK_PINDAH, JenisSurat.SK_DOMISILI,
    JenisSurat.SK_TIDAK_MAMPU, JenisSurat.SK_KEMATIAN,
    JenisSurat.SK_IZIN_KERAMAIAN, JenisSurat.SK_TANAH,
  ];

  const statusList: StatusSurat[] = [
    StatusSurat.SELESAI, StatusSurat.SELESAI, StatusSurat.DICETAK,
    StatusSurat.DISETUJUI, StatusSurat.DISETUJUI,
    StatusSurat.MENUNGGU_PERSETUJUAN, StatusSurat.MENUNGGU_PERSETUJUAN,
    StatusSurat.DRAFT, StatusSurat.DRAFT, StatusSurat.DITOLAK,
    StatusSurat.SELESAI, StatusSurat.DICETAK, StatusSurat.DISETUJUI,
    StatusSurat.MENUNGGU_PERSETUJUAN, StatusSurat.DRAFT, StatusSurat.SELESAI,
    StatusSurat.DICETAK, StatusSurat.SELESAI, StatusSurat.DRAFT, StatusSurat.DISETUJUI,
  ];

  const KODE_SURAT: Record<string, string> = {
    SK_DOMISILI: "SKD", SK_TIDAK_MAMPU: "SKTM", SK_USAHA: "SKU",
    SK_KELAHIRAN: "SKL", SK_KEMATIAN: "SKK", SK_PINDAH: "SKP",
    SK_DATANG: "SKDT", SK_BELUM_MENIKAH: "SKBM", SK_BEDA_NAMA: "SKBN",
    SK_KEHILANGAN: "SKH", SK_CATATAN_KEPOLISIAN: "PSKCK",
    SURAT_PENGANTAR: "SP", SK_TANAH: "SKT", SK_PENGHASILAN: "SKPH",
    SK_IZIN_KERAMAIAN: "SIK", LAINNYA: "SL",
  };

  const BULAN_ROMAWI = ["I","II","III","IV","V","VI","VII","VIII","IX","X","XI","XII"];

  for (let i = 0; i < 20; i++) {
    const jenis = jenisSuratList[i];
    const status = statusList[i];
    const penduduk = allPenduduk[i % allPenduduk.length];
    const tanggal = randomDate(new Date(2025, 6, 1), new Date(2026, 1, 15));
    const bulan = tanggal.getMonth();
    const tahun = tanggal.getFullYear();
    const nomor = (i + 1).toString().padStart(3, "0");
    const nomorSurat = `${nomor}/${KODE_SURAT[jenis]}/${desa.kode}/${BULAN_ROMAWI[bulan]}/${tahun}`;

    const approvedStatuses = new Set<StatusSurat>([
      StatusSurat.DISETUJUI,
      StatusSurat.DICETAK,
      StatusSurat.SELESAI,
    ]);
    const isApproved = approvedStatuses.has(status);

    await prisma.surat.create({
      data: {
        nomorSurat,
        jenisSurat: jenis,
        perihal: `Permohonan ${jenis.replace("SK_", "Surat Keterangan ").replace("SURAT_", "Surat ").replace(/_/g, " ")}`,
        tanggalSurat: tanggal,
        isiSurat: { keperluan: "Keperluan administrasi" },
        status,
        createdById: operator.id,
        approvedById: isApproved ? kades.id : null,
        approvedAt: isApproved ? tanggal : null,
        printedAt: status === StatusSurat.DICETAK || status === StatusSurat.SELESAI ? tanggal : null,
        alasanTolak: status === StatusSurat.DITOLAK ? "Data belum lengkap, mohon dilengkapi" : null,
        pendudukList: {
          create: { pendudukId: penduduk.id, peran: "pemohon" },
        },
      },
    });
  }

  console.log("   Created: 20 surat");

  // ─────────────── MUTASI ───────────────
  console.log("🔄 Creating mutasi...");

  const mutasiData = [
    { jenis: JenisMutasi.LAHIR, keterangan: "Kelahiran anak" },
    { jenis: JenisMutasi.LAHIR, keterangan: "Kelahiran anak" },
    { jenis: JenisMutasi.LAHIR, keterangan: "Kelahiran anak" },
    { jenis: JenisMutasi.MATI, keterangan: "Meninggal karena sakit" },
    { jenis: JenisMutasi.MATI, keterangan: "Meninggal karena usia lanjut" },
    { jenis: JenisMutasi.PINDAH_KELUAR, keterangan: "Pindah ke Jakarta" },
    { jenis: JenisMutasi.PINDAH_KELUAR, keterangan: "Pindah ke Bandung" },
    { jenis: JenisMutasi.PINDAH_MASUK, keterangan: "Datang dari Cirebon" },
    { jenis: JenisMutasi.PINDAH_MASUK, keterangan: "Datang dari Surabaya" },
    { jenis: JenisMutasi.LAHIR, keterangan: "Kelahiran anak" },
  ];

  for (let i = 0; i < 10; i++) {
    const penduduk = allPenduduk[(i + 30) % allPenduduk.length];
    const m = mutasiData[i];

    await prisma.mutasi.create({
      data: {
        jenisMutasi: m.jenis,
        pendudukId: penduduk.id,
        tanggalMutasi: randomDate(new Date(2025, 0, 1), new Date(2026, 1, 15)),
        keterangan: m.keterangan,
        alamatTujuan: m.jenis === JenisMutasi.PINDAH_KELUAR ? "Jl. Sudirman No. 10, Jakarta Selatan" : null,
        alamatAsal: m.jenis === JenisMutasi.PINDAH_MASUK ? "Jl. Asia Afrika No. 5, Bandung" : null,
        alasanPindah: m.jenis === JenisMutasi.PINDAH_KELUAR || m.jenis === JenisMutasi.PINDAH_MASUK ? "Pekerjaan" : null,
        penyebabKematian: m.jenis === JenisMutasi.MATI ? "Sakit" : null,
        tempatKematian: m.jenis === JenisMutasi.MATI ? "Rumah" : null,
      },
    });
  }

  console.log("   Created: 10 mutasi");

  // ─────────────── SETTINGS ───────────────
  console.log("⚙️ Creating settings...");

  await prisma.setting.createMany({
    data: [
      { key: "app_name", value: "SIDESA", group: "general" },
      { key: "desa_id", value: desa.id, group: "general" },
      { key: "nomor_surat_format", value: "{nomor}/{kode}/{kode_desa}/{bulan_romawi}/{tahun}", group: "surat" },
      { key: "session_timeout_minutes", value: "30", group: "security" },
      { key: "max_login_attempts", value: "5", group: "security" },
      { key: "backup_retention_days", value: "7", group: "backup" },
    ],
  });

  console.log("   Created: 6 settings");

  // ─────────────── DONE ───────────────
  console.log("\n✅ Seed completed successfully!");
  console.log("────────────────────────────────────");
  console.log("📊 Summary:");
  console.log(`   Users     : 4 (admin/kades/sekdes/operator)`);
  console.log(`   Desa      : 1 (${desa.nama})`);
  console.log(`   Dusun     : ${dusunNames.length}`);
  console.log(`   RW        : ${dusunNames.length * 2}`);
  console.log(`   RT        : ${rtData.length}`);
  console.log(`   Keluarga  : 50`);
  console.log(`   Penduduk  : ${allPenduduk.length}`);
  console.log(`   Surat     : 20`);
  console.log(`   Mutasi    : 10`);
  console.log("────────────────────────────────────");
  console.log("🔐 Login credentials:");
  console.log("   admin    / Admin@2026  (Super Admin)");
  console.log("   kades    / User@2026   (Kepala Desa)");
  console.log("   sekdes   / User@2026   (Sekretaris)");
  console.log("   operator / User@2026   (Operator)");
}

main()
  .then(async () => { await prisma.$disconnect(); })
  .catch(async (e) => {
    console.error("❌ Seed failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
