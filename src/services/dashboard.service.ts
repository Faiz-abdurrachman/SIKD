import { JenisKelamin } from "@prisma/client";

import { formatEnumLabel } from "@/lib/format";
import { prisma } from "@/lib/prisma";

const AGE_GROUPS: Array<{ label: string; min: number; max: number | null }> = [
  { label: "0-5", min: 0, max: 5 },
  { label: "6-12", min: 6, max: 12 },
  { label: "13-17", min: 13, max: 17 },
  { label: "18-25", min: 18, max: 25 },
  { label: "26-35", min: 26, max: 35 },
  { label: "36-45", min: 36, max: 45 },
  { label: "46-55", min: 46, max: 55 },
  { label: "56-65", min: 56, max: 65 },
  { label: "65+", min: 66, max: null },
];

function startOfCurrentMonth() {
  const now = new Date();

  return new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
}

function startOfNextMonth() {
  const now = new Date();

  return new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);
}

function getAge(dateOfBirth: Date) {
  const now = new Date();
  let age = now.getFullYear() - dateOfBirth.getFullYear();

  const monthDiff = now.getMonth() - dateOfBirth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dateOfBirth.getDate())) {
    age -= 1;
  }

  return Math.max(age, 0);
}

function countByLabel(items: string[]) {
  const map = new Map<string, number>();

  for (const item of items) {
    const label = item.trim();
    map.set(label, (map.get(label) ?? 0) + 1);
  }

  return Array.from(map.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

function initUmurBuckets() {
  return AGE_GROUPS.map((group) => ({
    label: group.label,
    total: 0,
    lakiLaki: 0,
    perempuan: 0,
  }));
}

function findAgeGroupIndex(age: number) {
  return AGE_GROUPS.findIndex((group) => {
    if (group.max === null) {
      return age >= group.min;
    }

    return age >= group.min && age <= group.max;
  });
}

export const dashboardService = {
  async getStats() {
    const [totalPenduduk, totalKeluarga, suratBulanIni, mutasiBulanIni] = await prisma.$transaction([
      prisma.penduduk.count(),
      prisma.keluarga.count(),
      prisma.surat.count({
        where: {
          tanggalSurat: {
            gte: startOfCurrentMonth(),
            lt: startOfNextMonth(),
          },
        },
      }),
      prisma.mutasi.count({
        where: {
          tanggalMutasi: {
            gte: startOfCurrentMonth(),
            lt: startOfNextMonth(),
          },
        },
      }),
    ]);

    return {
      totalPenduduk,
      totalKeluarga,
      suratBulanIni,
      mutasiBulanIni,
    };
  },

  async getDemografi() {
    const penduduk = await prisma.penduduk.findMany({
      select: {
        agama: true,
        pendidikanTerakhir: true,
        jenisKelamin: true,
        tanggalLahir: true,
      },
    });

    const umurBuckets = initUmurBuckets();

    for (const item of penduduk) {
      const age = getAge(item.tanggalLahir);
      const groupIndex = findAgeGroupIndex(age);

      if (groupIndex < 0) {
        continue;
      }

      umurBuckets[groupIndex].total += 1;

      if (item.jenisKelamin === JenisKelamin.LAKI_LAKI) {
        umurBuckets[groupIndex].lakiLaki += 1;
      } else {
        umurBuckets[groupIndex].perempuan += 1;
      }
    }

    return {
      agama: countByLabel(penduduk.map((item) => formatEnumLabel(item.agama))),
      pendidikan: countByLabel(penduduk.map((item) => formatEnumLabel(item.pendidikanTerakhir))),
      gender: countByLabel(penduduk.map((item) => formatEnumLabel(item.jenisKelamin))),
      umur: umurBuckets,
    };
  },

  async getRecentMutasi(limit = 5) {
    return prisma.mutasi.findMany({
      orderBy: {
        tanggalMutasi: "desc",
      },
      include: {
        penduduk: {
          select: {
            id: true,
            nik: true,
            nama: true,
          },
        },
      },
      take: limit,
    });
  },

  async getRecentSurat(limit = 5) {
    return prisma.surat.findMany({
      orderBy: {
        tanggalSurat: "desc",
      },
      include: {
        createdBy: {
          select: {
            nama: true,
          },
        },
      },
      take: limit,
    });
  },
};

export const dashboardHelpers = {
  AGE_GROUPS,
  getAge,
  findAgeGroupIndex,
  initUmurBuckets,
};
