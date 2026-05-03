import { neon } from "@neondatabase/serverless";

function getDatabaseUrl() {
  const value = process.env.DATABASE_URL?.trim();
  if (!value) {
    throw new Error("DATABASE_URL is not configured.");
  }
  return value;
}

let client: ReturnType<typeof neon> | null = null;

export function sql(
  strings: TemplateStringsArray,
  ...values: unknown[]
): Promise<Record<string, unknown>[]> {
  client ??= neon(getDatabaseUrl());
  return client(strings, ...values) as Promise<Record<string, unknown>[]>;
}
