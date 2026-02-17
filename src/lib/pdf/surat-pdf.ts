import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { jsPDF } from "jspdf";

import { SURAT_DYNAMIC_FIELDS } from "@/lib/surat-fields";
import { formatEnumLabel } from "@/lib/format";
import type { SuratJenis } from "@/types/surat.types";

type PdfPenduduk = {
  nik: string;
  nama: string;
  tempatLahir: string;
  tanggalLahir: Date;
  jenisKelamin: string;
  pekerjaan: string;
  agama: string;
  statusPerkawinan: string;
  keluarga: {
    noKK: string;
    alamat: string;
    rt: {
      nomor: string;
      rw: {
        nomor: string;
        dusun: {
          nama: string;
        };
      };
    };
  };
};

type PdfSurat = {
  nomorSurat: string;
  jenisSurat: SuratJenis;
  perihal: string;
  tanggalSurat: Date;
  isiSurat: unknown;
  pendudukList: Array<{
    peran: string;
    penduduk: PdfPenduduk;
  }>;
};

type PdfDesa = {
  kode: string;
  nama: string;
  kecamatan: string;
  kabupaten: string;
  provinsi: string;
  alamatKantor: string | null;
  telepon: string | null;
  email: string | null;
  namaKepalaDesa: string | null;
};

type GenerateSuratPdfInput = {
  surat: PdfSurat;
  desa: PdfDesa;
};

function formatDateLong(date: Date) {
  return format(date, "dd MMMM yyyy", { locale: localeId });
}

function formatDateShort(date: Date) {
  return format(date, "dd/MM/yyyy", { locale: localeId });
}

function drawWrappedText(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight = 5,
) {
  const lines = doc.splitTextToSize(text, maxWidth);

  for (const line of lines) {
    doc.text(line, x, y);
    y += lineHeight;
  }

  return y;
}

function ensurePageSpace(doc: jsPDF, y: number, needSpace = 20) {
  if (y + needSpace <= 287) {
    return y;
  }

  doc.addPage();
  return 20;
}

function getFieldLabel(jenisSurat: SuratJenis, key: string) {
  const field = (SURAT_DYNAMIC_FIELDS[jenisSurat] ?? []).find((item) => item.key === key);

  if (field) {
    return field.label;
  }

  return formatEnumLabel(key);
}

function stringifyFieldValue(value: unknown) {
  if (value === null || value === undefined) {
    return "-";
  }

  if (typeof value === "string") {
    return value.trim() || "-";
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return JSON.stringify(value);
}

function buildPemohonAddress(penduduk: PdfPenduduk) {
  return `${penduduk.keluarga.alamat}, RT ${penduduk.keluarga.rt.nomor}/RW ${penduduk.keluarga.rt.rw.nomor}, Dusun ${penduduk.keluarga.rt.rw.dusun.nama}`;
}

export function generateSuratPdfBuffer({ surat, desa }: GenerateSuratPdfInput) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pemohon = surat.pendudukList[0]?.penduduk ?? null;

  doc.setFont("times", "bold");
  doc.setFontSize(12);
  doc.text("PEMERINTAH KABUPATEN " + desa.kabupaten.toUpperCase(), 105, 15, { align: "center" });
  doc.text(`KECAMATAN ${desa.kecamatan.toUpperCase()}`, 105, 21, { align: "center" });
  doc.setFontSize(16);
  doc.text(`DESA ${desa.nama.toUpperCase()}`, 105, 28, { align: "center" });

  doc.setFont("times", "normal");
  doc.setFontSize(10);
  doc.text(
    `${desa.alamatKantor ?? "-"} ${desa.telepon ? `| Telp: ${desa.telepon}` : ""} ${desa.email ? `| Email: ${desa.email}` : ""}`,
    105,
    33,
    { align: "center" },
  );

  doc.setLineWidth(0.7);
  doc.line(15, 36, 195, 36);
  doc.setLineWidth(0.2);
  doc.line(15, 37, 195, 37);

  doc.setFont("times", "bold");
  doc.setFontSize(14);
  doc.text(formatEnumLabel(surat.jenisSurat).toUpperCase(), 105, 48, { align: "center" });

  doc.setFont("times", "normal");
  doc.setFontSize(11);
  doc.text(`Nomor: ${surat.nomorSurat}`, 105, 55, { align: "center" });

  let y = 66;
  doc.setFontSize(11);

  y = drawWrappedText(
    doc,
    `Yang bertanda tangan di bawah ini Pemerintah Desa ${desa.nama}, Kecamatan ${desa.kecamatan}, Kabupaten ${desa.kabupaten}, menerangkan bahwa:`,
    20,
    y,
    170,
  );

  y += 2;

  if (pemohon) {
    const pemohonRows = [
      ["Nama", pemohon.nama],
      ["NIK", pemohon.nik],
      ["Tempat/Tanggal Lahir", `${pemohon.tempatLahir}, ${formatDateLong(pemohon.tanggalLahir)}`],
      ["Jenis Kelamin", formatEnumLabel(pemohon.jenisKelamin)],
      ["Agama", formatEnumLabel(pemohon.agama)],
      ["Status Perkawinan", formatEnumLabel(pemohon.statusPerkawinan)],
      ["Pekerjaan", pemohon.pekerjaan],
      ["No. KK", pemohon.keluarga.noKK],
      ["Alamat", buildPemohonAddress(pemohon)],
    ] as const;

    for (const [label, value] of pemohonRows) {
      y = ensurePageSpace(doc, y, 8);
      doc.setFont("times", "normal");
      doc.text(label, 28, y);
      doc.text(":", 75, y);
      y = drawWrappedText(doc, value, 78, y, 110, 5);
    }
  }

  y += 3;
  y = ensurePageSpace(doc, y, 12);
  doc.setFont("times", "bold");
  doc.text("Keterangan Tambahan:", 20, y);
  y += 6;

  const isiSuratObject =
    surat.isiSurat && typeof surat.isiSurat === "object" && !Array.isArray(surat.isiSurat)
      ? (surat.isiSurat as Record<string, unknown>)
      : {};
  const isiSuratEntries = Object.entries(isiSuratObject);

  if (!isiSuratEntries.length) {
    doc.setFont("times", "normal");
    doc.text("-", 28, y);
    y += 5;
  }

  for (const [key, rawValue] of isiSuratEntries) {
    y = ensurePageSpace(doc, y, 8);
    doc.setFont("times", "normal");

    const label = getFieldLabel(surat.jenisSurat, key);
    doc.text(label, 28, y);
    doc.text(":", 75, y);

    y = drawWrappedText(doc, stringifyFieldValue(rawValue), 78, y, 110, 5);
  }

  y += 3;
  y = ensurePageSpace(doc, y, 20);

  doc.setFont("times", "normal");
  y = drawWrappedText(
    doc,
    `Surat keterangan ini dibuat berdasarkan data administrasi Desa ${desa.nama} dan digunakan untuk keperluan ${surat.perihal.toLowerCase()}.`,
    20,
    y,
    170,
  );

  y += 6;

  doc.text(`${desa.nama}, ${formatDateLong(surat.tanggalSurat)}`, 135, y);
  y += 6;
  doc.text("Kepala Desa", 150, y);
  y += 22;
  doc.setFont("times", "bold");
  doc.text(desa.namaKepalaDesa ?? "(................................)", 150, y);

  doc.setFont("times", "normal");
  doc.setFontSize(9);
  doc.text(`Dicetak dari SIDESA pada ${formatDateShort(new Date())}`, 20, 292);

  return new Uint8Array(doc.output("arraybuffer"));
}
