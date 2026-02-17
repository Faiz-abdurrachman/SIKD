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

function incrementCounter(counter: Map<string, number>, key: string) {
  const normalizedKey = key.trim() || "Tidak Diisi";
  counter.set(normalizedKey, (counter.get(normalizedKey) ?? 0) + 1);
}

function counterToSortedArray(counter: Map<string, number>) {
  return Array.from(counter.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

function counterToSortedArrayAsc(counter: Map<string, number>) {
  return Array.from(counter.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

export const laporanService = {
  async getSummary(input: LaporanSummaryInput) {
    const { fromDate, toDate } = toDateRange(input);

    const [penduduk, keluargaDusun, mutasi, surat] = await Promise.all([
      prisma.penduduk.findMany({
        select: {
          agama: true,
          pendidikanTerakhir: true,
          jenisKelamin: true,
          pekerjaan: true,
          tanggalLahir: true,
          keluargaId: true,
        },
      }),
      prisma.keluarga.findMany({
        select: {
          id: true,
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

    const umurBuckets = dashboardHelpers.initUmurBuckets();
    const keluargaToDusun = new Map<string, string>();
    const genderCounter = new Map<string, number>();
    const agamaCounter = new Map<string, number>();
    const pendidikanCounter = new Map<string, number>();
    const pekerjaanCounter = new Map<string, number>();
    const dusunCounter = new Map<string, number>();

    for (const item of keluargaDusun) {
      keluargaToDusun.set(item.id, item.rt.rw.dusun.nama);
    }

    for (const item of penduduk) {
      incrementCounter(genderCounter, formatEnumLabel(item.jenisKelamin));
      incrementCounter(agamaCounter, formatEnumLabel(item.agama));
      incrementCounter(pendidikanCounter, formatEnumLabel(item.pendidikanTerakhir));
      incrementCounter(pekerjaanCounter, item.pekerjaan);
      incrementCounter(dusunCounter, keluargaToDusun.get(item.keluargaId) ?? "Tidak Diisi");

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

    const mutasiJenisCounter = new Map<string, number>();
    const mutasiBulanCounter = new Map<string, number>();

    for (const item of mutasi) {
      incrementCounter(mutasiJenisCounter, formatEnumLabel(item.jenisMutasi));
      incrementCounter(mutasiBulanCounter, format(item.tanggalMutasi, "MMMM yyyy", { locale: localeId }));
    }

    const suratJenisCounter = new Map<string, number>();
    const suratStatusCounter = new Map<string, number>();

    for (const item of surat) {
      incrementCounter(suratJenisCounter, formatEnumLabel(item.jenisSurat));
      incrementCounter(suratStatusCounter, formatEnumLabel(item.status));
    }

    return {
      periode: {
        fromDate: fromDate.toISOString(),
        toDate: toDate.toISOString(),
      },
      penduduk: {
        total: penduduk.length,
        byGender: counterToSortedArray(genderCounter),
        byAgama: counterToSortedArray(agamaCounter),
        byPendidikan: counterToSortedArray(pendidikanCounter),
        byPekerjaan: counterToSortedArray(pekerjaanCounter).slice(0, 10),
        byDusun: counterToSortedArray(dusunCounter),
      },
      mutasi: {
        total: mutasi.length,
        byJenis: counterToSortedArray(mutasiJenisCounter),
        byBulan: counterToSortedArrayAsc(mutasiBulanCounter),
      },
      surat: {
        total: surat.length,
        byJenis: counterToSortedArray(suratJenisCounter),
        byStatus: counterToSortedArray(suratStatusCounter),
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
