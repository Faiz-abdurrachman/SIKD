import { NavLink, Route, Routes } from "react-router-dom";

import { DashboardPage } from "./pages/dashboard-page";
import { KeluargaPage } from "./pages/keluarga-page";
import { LaporanPage } from "./pages/laporan-page";
import { MutasiPage } from "./pages/mutasi-page";
import { PendudukPage } from "./pages/penduduk-page";
import { SuratPage } from "./pages/surat-page";

const NAV_ITEMS = [
  { path: "/", label: "Dashboard" },
  { path: "/penduduk", label: "Penduduk" },
  { path: "/keluarga", label: "Keluarga" },
  { path: "/surat", label: "Surat" },
  { path: "/mutasi", label: "Mutasi" },
  { path: "/laporan", label: "Laporan" },
];

export default function App() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <h2>SIDESA</h2>
          <p>Local Stack</p>
        </div>
        <nav className="nav-list">
          {NAV_ITEMS.map((item) => (
            <NavLink
              className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
              end={item.path === "/"}
              key={item.path}
              to={item.path}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="main-content">
        <Routes>
          <Route element={<DashboardPage />} path="/" />
          <Route element={<PendudukPage />} path="/penduduk" />
          <Route element={<KeluargaPage />} path="/keluarga" />
          <Route element={<SuratPage />} path="/surat" />
          <Route element={<MutasiPage />} path="/mutasi" />
          <Route element={<LaporanPage />} path="/laporan" />
        </Routes>
      </main>
    </div>
  );
}
