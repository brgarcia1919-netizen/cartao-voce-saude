import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";
import { chromium } from "playwright";

const HOST = "127.0.0.1";
const PORT = Number(process.env.SMOKE_PORT || 3010);
const BASE_URL = process.env.SMOKE_BASE_URL || `http://${HOST}:${PORT}`;
const SERVER_TIMEOUT_MS = 120_000;
const NAV_TIMEOUT_MS = 25_000;

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Variável obrigatória ausente: ${name}. Exemplo de uso:\n` +
        `SMOKE_EMAIL=seu@email.com SMOKE_PASSWORD=suaSenha npm run smoke`
    );
  }
  return value;
}

async function waitForServer(url: string, timeoutMs: number) {
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(url, { redirect: "manual" });
      if (response.status < 500) {
        return;
      }
    } catch {
      // servidor ainda não subiu
    }

    await sleep(1_000);
  }

  throw new Error(`Timeout aguardando servidor em ${url}.`);
}

async function waitForExit(processRef: ReturnType<typeof spawn>, timeoutMs: number) {
  const exited = new Promise<void>((resolve) => {
    processRef.once("exit", () => resolve());
  });

  await Promise.race([exited, sleep(timeoutMs)]);
}

function startDevServer() {
  const dev = spawn(
    "npm",
    ["run", "dev", "--", "--hostname", HOST, "--port", String(PORT)],
    {
      cwd: process.cwd(),
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
      shell: process.platform === "win32",
    }
  );

  dev.stdout.on("data", (chunk) => {
    process.stdout.write(`[dev] ${String(chunk)}`);
  });
  dev.stderr.on("data", (chunk) => {
    process.stderr.write(`[dev] ${String(chunk)}`);
  });

  return dev;
}

async function runSmoke() {
  const email = requiredEnv("SMOKE_EMAIL");
  const password = requiredEnv("SMOKE_PASSWORD");

  console.log(`Iniciando smoke test em ${BASE_URL}`);
  const dev = startDevServer();
  let browser: Awaited<ReturnType<typeof chromium.launch>> | null = null;

  try {
    await waitForServer(BASE_URL, SERVER_TIMEOUT_MS);
    console.log("Servidor disponível, iniciando navegador...");

    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    await page.getByLabel("E-mail").fill(email);
    await page.getByLabel("Senha").fill(password);

    await Promise.all([
      page.waitForURL(/\/dashboard$/, { timeout: NAV_TIMEOUT_MS }),
      page.getByRole("button", { name: "Entrar" }).click(),
    ]);

    await page.getByRole("heading", { name: "Dashboard" }).waitFor({ timeout: NAV_TIMEOUT_MS });

    await page.goto(`${BASE_URL}/beneficiarios`, { waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { name: "Beneficiários" }).waitFor({ timeout: NAV_TIMEOUT_MS });

    await page.goto(`${BASE_URL}/renovacoes`, { waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { name: "Renovações" }).waitFor({ timeout: NAV_TIMEOUT_MS });

    await page.goto(`${BASE_URL}/financeiro`, { waitUntil: "domcontentloaded" });
    const financeHeading = page.getByRole("heading", { name: "Financeiro" });
    const financeDenied = page.getByText(/nao tem permissao|não tem permissão/i);
    if ((await financeHeading.count()) > 0) {
      await financeHeading.waitFor({ timeout: NAV_TIMEOUT_MS });
      console.log("Financeiro validado (perfil com acesso).");
    } else if ((await financeDenied.count()) > 0) {
      await financeDenied.waitFor({ timeout: NAV_TIMEOUT_MS });
      console.log("Financeiro validado (perfil sem acesso, comportamento esperado).");
    } else {
      throw new Error("Não foi possível validar a tela de Financeiro.");
    }

    console.log("Smoke test concluído com sucesso.");
  } finally {
    if (browser) {
      await browser.close();
    }
    dev.kill("SIGTERM");
    await waitForExit(dev, 5_000);
    if (!dev.killed) {
      dev.kill("SIGKILL");
    }
  }
}

runSmoke().catch((error) => {
  console.error("Falha no smoke test:", error);
  process.exitCode = 1;
});
