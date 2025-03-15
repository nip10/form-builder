import { type Config } from "drizzle-kit";

export default {
  schema: "./src/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  out: "./migrations",
  tablesFilter: ["forms_*"],
  verbose: true,
} satisfies Config;
