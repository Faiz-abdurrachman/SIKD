import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { JenisKelamin } from "@prisma/client";

import { formatEnumLabel } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { dashboardHelpers } from "@/services/dashboard.service";
import type { LaporanSummaryInput } from "@/validations/laporan.schema";

function toDateRange(input: LaporanSummaryInput) {
  const now = new Date();
  const defaultFrom = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
  const defaultTo = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  const fromDate = input.fromDate ? new Date(input.fromDate) : defaultFrom;
  const toDate = input.toDate ? new Date(input.toDate) : defaultTo;

  return {
    fromDate: Number.isNaN(fromDate.getTime()) ? defaultFrom : fromDate,
    toDate: Number.isNaN(toDate.getTime()) ? defaultTo : toDate,
  };
}

function aggregate(items: string[]) {
  const map = new Map<string, number>();

  for (const item of items) {
    const key = item.trim() || "Tidak Diisi";
    map.set(key, (map.get(key) ?? 0) + 1);
  }

  return Array.from(map.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

function aggregateByMonth(dates: Date[]) {
  const map = new Map<string, number>();

  for (const date of dates) {
    const key = format(date, "MMMM yyyy", { locale: localeId });
    map.set(key, (map.get(key) ?? 0) + 1);
  }

  return Array.from(map.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

export const laporanService = {
  async getSummary(input: LaporanSummaryInput) {
    const { fromDate, toDate } = toDateRange(input);

    const [penduduk, mutasi, surat] = await prisma.$transaction([
      prisma.penduduk.findMany({
        select: {
          agama: true,
          pendidikanTerakhir: true,
          jenisKelamin: true,
          pekerjaan: true,
          tanggalLahir: true,
          keluarga: {
            select: {
              rt: {
                select: {
                  rw: {
                    select: {
                      dusun: {
                        select: {
                          nama: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      }),
      prisma.mutasi.findMany({
        where: {
          tanggalMutasi: {
            gte: fromDate,
            lte: toDate,
          },
        },
        select: {
          tanggalMutasi: true,
          jenisMutasi: true,
        },
      }),
      prisma.surat.findMany({
        where: {
          tanggalSurat: {
            gte: fromDate,
            lte: toDate,
          },
        },
        select: {
          tanggalSurat: true,
          jenisSurat: true,
          status: true,
        },
      }),
    ]);

    const byPekerjaan = aggregate(penduduk.map((item) => item.pekerjaan)).slice(0, 10);
    const byDusun = aggregate(penduduk.map((item) => item.keluarga.rt.rw.dusun.nama));

    const umurBuckets = dashboardHelpers.initUmurBuckets();

    for (const item of penduduk) {
      const age = dashboardHelpers.getAge(item.tanggalLahir);
      const index = dashboardHelpers.findAgeGroupIndex(age);

      if (index < 0) {
        continue;
      }

      umurBuckets[index].total += 1;

      if (item.jenisKelamin === JenisKelamin.LAKI_LAKI) {
        umurBuckets[index].lakiLaki += 1;
      } else {
        umurBuckets[index].perempuan += 1;
      }
    }

    return {
      periode: {
        fromDate: fromDate.toISOString(),
        toDate: toDate.toISOString(),
      },
      penduduk: {
        total: penduduk.length,
        byGender: aggregate(penduduk.map((item) => formatEnumLabel(item.jenisKelamin))),
        byAgama: aggregate(penduduk.map((item) => formatEnumLabel(item.agama))),
        byPendidikan: aggregate(penduduk.map((item) => formatEnumLabel(item.pendidikanTerakhir))),
        byPekerjaan,
        byDusun,
      },
      mutasi: {
        total: mutasi.length,
        byJenis: aggregate(mutasi.map((item) => formatEnumLabel(item.jenisMutasi))),
        byBulan: aggregateByMonth(mutasi.map((item) => item.tanggalMutasi)),
      },
      surat: {
        total: surat.length,
        byJenis: aggregate(surat.map((item) => formatEnumLabel(item.jenisSurat))),
        byStatus: aggregate(surat.map((item) => formatEnumLabel(item.status))),
      },
      piramida: umurBuckets.map((item) => ({
        label: item.label,
        lakiLaki: item.lakiLaki,
        perempuan: item.perempuan,
        lakiLakiNegatif: item.lakiLaki * -1,
      })),
    };
  },
};
