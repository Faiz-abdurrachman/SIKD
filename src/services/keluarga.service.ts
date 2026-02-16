import { prisma } from "@/lib/prisma";

export async function listKeluargaOptions() {
  const keluargaList = await prisma.keluarga.findMany({
    include: {
      kepalaKeluarga: {
        select: {
          nama: true,
        },
      },
      rt: {
        include: {
          rw: {
            include: {
              dusun: true,
            },
          },
        },
      },
    },
    orderBy: {
      noKK: "asc",
    },
  });

  return keluargaList.map((item) => ({
    id: item.id,
    noKK: item.noKK,
    alamat: item.alamat,
    kepalaKeluargaNama: item.kepalaKeluarga?.nama,
    rtNomor: item.rt.nomor,
    rwNomor: item.rt.rw.nomor,
    dusunNama: item.rt.rw.dusun.nama,
  }));
}
