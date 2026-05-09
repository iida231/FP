import { defineConfig } from "prisma/config";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbUrl = `file:${path.join(__dirname, "prisma", "dev.db").replace(/\\/g, "/")}`;

// prisma.config.ts skips .env loading, so set DATABASE_URL explicitly for CLI validation
process.env.DATABASE_URL = dbUrl;

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  engine: "classic",
  datasource: {
    url: dbUrl,
  },
});
