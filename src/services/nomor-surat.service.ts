import type { JenisSurat, Prisma } from "@prisma/client";

import { BULAN_ROMAWI, KODE_SURAT } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

type TxClient = Prisma.TransactionClient;

export async function generateNomorSurat(jenisSurat: JenisSurat, tx?: TxClient): Promise<string> {
  const now = new Date();
  const tahun = now.getFullYear();
  const bulanIndex = now.getMonth();

  const client = tx ?? prisma;

  const counter = await client.nomorSuratCounter.upsert({
    where: {
      jenisSurat_tahun: {
        jenisSurat,
        tahun,
      },
    },
    update: {
      lastNumber: {
        increment: 1,
      },
    },
    create: {
      jenisSurat,
      tahun,
      lastNumber: 1,
    },
  });

  const desa = await client.desa.findFirst({
    select: {
      kode: true,
    },
  });

  const nomorUrut = String(counter.lastNumber).padStart(3, "0");
  const kodeSurat = KODE_SURAT[jenisSurat] ?? "SL";
  const kodeDesa = desa?.kode ?? "0000000000";
  const bulanRomawi = BULAN_ROMAWI[bulanIndex] ?? "I";

  return `${nomorUrut}/${kodeSurat}/${kodeDesa}/${bulanRomawi}/${tahun}`;
}
