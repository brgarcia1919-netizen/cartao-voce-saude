import { config as loadEnv } from "dotenv";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { Client } from "pg";

loadEnv({ path: ".env.local" });
loadEnv();

const connectionString = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;

if (!connectionString) {
  console.error(
    "Variável ausente: defina SUPABASE_DB_URL (ou DATABASE_URL) com a connection string Postgres do Supabase."
  );
  process.exit(1);
}

async function run() {
  const schemaPath = path.resolve(process.cwd(), "supabase", "schema.sql");
  const seedPath = path.resolve(process.cwd(), "supabase", "seed.sql");

  const [schemaSql, seedSql] = await Promise.all([
    readFile(schemaPath, "utf-8"),
    readFile(seedPath, "utf-8"),
  ]);

  const sslEnabled = process.env.SUPABASE_DB_SSL !== "false";
  const client = new Client({
    connectionString,
    ssl: sslEnabled ? { rejectUnauthorized: false } : undefined,
  });

  await client.connect();

  try {
    await client.query("BEGIN");
    await client.query(schemaSql);
    await client.query(seedSql);
    await client.query("COMMIT");
    console.log("Banco inicializado com sucesso (schema + seed).");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Falha ao inicializar banco:", error);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

void run();
