import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import pg from "pg";

const databaseUrl = process.env.DATABASE_URL?.trim();
if (!databaseUrl) {
  throw new Error("DATABASE_URL is required.");
}

const migrationsDir = path.join(process.cwd(), "neon", "migrations");
const migrationFiles = (await readdir(migrationsDir))
  .filter((file) => file.endsWith(".sql"))
  .sort();

const client = new pg.Client({ connectionString: databaseUrl });
await client.connect();

try {
  await client.query(`
    create table if not exists public.schema_migrations (
      version text primary key,
      applied_at timestamptz not null default timezone('utc', now())
    )
  `);

  const baseline = await client.query(
    "select to_regclass('public.users') as users_table",
  );
  if (baseline.rows[0]?.users_table) {
    await client.query(
      `
        insert into public.schema_migrations (version)
        values ('20260502000000_initial_neon_schema.sql')
        on conflict (version) do nothing
      `,
    );
  }

  for (const file of migrationFiles) {
    const existing = await client.query(
      "select 1 from public.schema_migrations where version = $1",
      [file],
    );
    if (existing.rowCount) {
      console.log(`Skipped ${file}`);
      continue;
    }

    await client.query("begin");
    try {
      const migration = await readFile(path.join(migrationsDir, file), "utf8");
      await client.query(migration);
      await client.query(
        "insert into public.schema_migrations (version) values ($1)",
        [file],
      );
      await client.query("commit");
      console.log(`Applied ${file}`);
    } catch (error) {
      await client.query("rollback");
      throw error;
    }
  }
} finally {
  await client.end();
}
