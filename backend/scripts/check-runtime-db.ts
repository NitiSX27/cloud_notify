import "dotenv/config";
import { Pool } from "pg";

async function main() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  const runtimeConnectionString = new URL(connectionString);
  runtimeConnectionString.searchParams.delete("sslmode");

  const pool = new Pool({
    connectionString: runtimeConnectionString.toString(),
    ssl: {
      rejectUnauthorized: false,
    },
  });

  const result = await pool.query("SELECT 1 AS ok");
  console.log(result.rows);

  await pool.end();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
