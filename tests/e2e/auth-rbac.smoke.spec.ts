import { expect, test, type Page } from "@playwright/test";

type AppRoute = `/${string}`;

type Credentials = {
  username: string;
  password: string;
};

type RoleSmokeCase = {
  label: string;
  credentials: Credentials;
  visibleMenus: string[];
  hiddenMenus: string[];
  routeAccess: Record<AppRoute, boolean>;
};

const ACCESS_DENIED_TEXT = "Akses ditolak";
const INVALID_SEARCH_PARAM_MESSAGE = "Parameter pencarian tidak valid";

const CREDENTIALS = {
  admin: {
    username: process.env.E2E_ADMIN_USERNAME ?? "admin",
    password: process.env.E2E_ADMIN_PASSWORD ?? "Admin@2026",
  },
  kades: {
    username: process.env.E2E_KADES_USERNAME ?? "kades",
    password: process.env.E2E_KADES_PASSWORD ?? "User@2026",
  },
  sekdes: {
    username: process.env.E2E_SEKDES_USERNAME ?? "sekdes",
    password: process.env.E2E_SEKDES_PASSWORD ?? "User@2026",
  },
  operator: {
    username: process.env.E2E_OPERATOR_USERNAME ?? "operator",
    password: process.env.E2E_OPERATOR_PASSWORD ?? "User@2026",
  },
} satisfies Record<string, Credentials>;

const ROLE_CASES: RoleSmokeCase[] = [
  {
    label: "SUPER_ADMIN",
    credentials: CREDENTIALS.admin,
    visibleMenus: ["Laporan", "Pengguna", "Pengaturan", "Audit Log"],
    hiddenMenus: [],
    routeAccess: {
      "/laporan": true,
      "/pengguna": true,
      "/pengaturan": true,
      "/audit-log": true,
    },
  },
  {
    label: "KEPALA_DESA",
    credentials: CREDENTIALS.kades,
    visibleMenus: ["Laporan", "Pengaturan", "Audit Log"],
    hiddenMenus: ["Pengguna"],
    routeAccess: {
      "/laporan": true,
      "/pengguna": false,
      "/pengaturan": true,
      "/audit-log": true,
    },
  },
  {
    label: "SEKRETARIS",
    credentials: CREDENTIALS.sekdes,
    visibleMenus: ["Laporan"],
    hiddenMenus: ["Pengguna", "Pengaturan", "Audit Log"],
    routeAccess: {
      "/laporan": true,
      "/pengguna": false,
      "/pengaturan": false,
      "/audit-log": false,
    },
  },
  {
    label: "OPERATOR",
    credentials: CREDENTIALS.operator,
    visibleMenus: [],
    hiddenMenus: ["Laporan", "Pengguna", "Pengaturan", "Audit Log"],
    routeAccess: {
      "/laporan": false,
      "/pengguna": false,
      "/pengaturan": false,
      "/audit-log": false,
    },
  },
];

function routeRegex(path: AppRoute) {
  const escaped = path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`${escaped}(?:\\?|$)`);
}

async function login(page: Page, credentials: Credentials) {
  await page.goto("/login");
  await expect(page.getByLabel("Username")).toBeVisible();

  await page.getByLabel("Username").fill(credentials.username);
  await page.getByLabel("Password").fill(credentials.password);
  await page.getByRole("button", { name: "Masuk" }).click();

  await expect(page).toHaveURL(/\/($|\?)/);
  await expect(page.locator("aside")).toBeVisible();
}

async function expectSidebarMenu(page: Page, visibleMenus: string[], hiddenMenus: string[]) {
  const sidebar = page.locator("aside");

  for (const menu of visibleMenus) {
    await expect(sidebar.getByRole("link", { name: menu, exact: true })).toBeVisible();
  }

  for (const menu of hiddenMenus) {
    await expect(sidebar.getByRole("link", { name: menu, exact: true })).toHaveCount(0);
  }
}

async function expectRouteAccess(page: Page, route: AppRoute, allowed: boolean) {
  await page.goto(route);
  await expect(page).toHaveURL(routeRegex(route));

  if (allowed) {
    await expect(page.getByText(ACCESS_DENIED_TEXT)).toHaveCount(0);
    return;
  }

  await expect(page.getByText(ACCESS_DENIED_TEXT)).toBeVisible();
}

function attachInvalidSearchParamErrorCollector(page: Page) {
  const errors: string[] = [];

  page.on("console", (message) => {
    if (message.type() !== "error") {
      return;
    }

    if (message.text().includes(INVALID_SEARCH_PARAM_MESSAGE)) {
      errors.push(message.text());
    }
  });

  return errors;
}

test("Guest diarahkan ke login saat membuka route private", async ({ page }) => {
  await page.goto("/penduduk");
  await expect(page).toHaveURL(/\/login(?:\?|$)/);
});

test("Login invalid menampilkan pesan error", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Username").fill("user_tidak_ada");
  await page.getByLabel("Password").fill("salah-total");
  await page.getByRole("button", { name: "Masuk" }).click();

  await expect(page.getByText("Username atau password tidak valid.")).toBeVisible();
  await expect(page).toHaveURL(/\/login(?:\?|$)/);
});

for (const roleCase of ROLE_CASES) {
  test(`Role ${roleCase.label} sesuai menu dan akses route`, async ({ page }) => {
    await login(page, roleCase.credentials);
    await expectSidebarMenu(page, roleCase.visibleMenus, roleCase.hiddenMenus);

    for (const [route, allowed] of Object.entries(roleCase.routeAccess) as Array<[AppRoute, boolean]>) {
      await expectRouteAccess(page, route, allowed);
    }
  });
}

test("Super admin membuka modul utama tanpa error parameter pencarian", async ({ page }) => {
  const errors = attachInvalidSearchParamErrorCollector(page);
  const routes: AppRoute[] = ["/penduduk", "/keluarga", "/surat", "/mutasi", "/pengguna", "/audit-log"];

  await login(page, CREDENTIALS.admin);

  for (const route of routes) {
    await page.goto(route);
    await expect(page).toHaveURL(routeRegex(route));
    await expect(page.getByText(ACCESS_DENIED_TEXT)).toHaveCount(0);
  }

  expect(errors, `Console error yang terdeteksi: ${errors.join(" | ")}`).toEqual([]);
});
