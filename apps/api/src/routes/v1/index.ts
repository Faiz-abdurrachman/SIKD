import { Router } from "express";

import { auditLogsRouter } from "./audit-logs.route";
import { dashboardRouter } from "./dashboard.route";
import { keluargaRouter } from "./keluarga.route";
import { laporanRouter } from "./laporan.route";
import { mutasiRouter } from "./mutasi.route";
import { pendudukRouter } from "./penduduk.route";
import { settingsRouter } from "./settings.route";
import { suratRouter } from "./surat.route";
import { usersRouter } from "./users.route";
import { wilayahRouter } from "./wilayah.route";

export const v1Router = Router();

v1Router.use("/dashboard", dashboardRouter);
v1Router.use("/penduduk", pendudukRouter);
v1Router.use("/keluarga", keluargaRouter);
v1Router.use("/laporan", laporanRouter);
v1Router.use("/mutasi", mutasiRouter);
v1Router.use("/surat", suratRouter);
v1Router.use("/wilayah", wilayahRouter);
v1Router.use("/users", usersRouter);
v1Router.use("/settings", settingsRouter);
v1Router.use("/audit-logs", auditLogsRouter);
