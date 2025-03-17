import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const keys = () =>
  createEnv({
    server: {
      PHRASE_TOKEN: z.string().min(1),
      PHRASE_PROJECT_ID: z.string().min(1),
    },
    runtimeEnv: {
      PHRASE_TOKEN: process.env.PHRASE_TOKEN,
      PHRASE_PROJECT_ID: process.env.PHRASE_PROJECT_ID,
    },
  });
