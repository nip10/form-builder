import { keys } from "../keys";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

const { PHRASE_TOKEN, PHRASE_PROJECT_ID } = keys();

const response = await fetch(`https://api.phrase.com/v2/projects/${PHRASE_PROJECT_ID}/locales`, {
  headers: {
    Authorization: `Bearer ${PHRASE_TOKEN}`,
  },
});

const data = (await response.json()) as {
  id: string;
  name: string;
  code: string;
  default: boolean;
  main: boolean;
  rtl: boolean;
  plural_forms: string[];
  created_at: string;
  updated_at: string;
  source_locale: string | null;
  fallback_locale: string | null;
}[];

const locales = data.map((locale) => locale.name);

for (const locale of locales) {
  const response = await fetch(
    `https://api.phrase.com/v2/projects/${PHRASE_PROJECT_ID}/locales/${locale}/download?file_format=simple_json`,
    {
      headers: {
        Authorization: `Bearer ${PHRASE_TOKEN}`,
      },
    },
  );

  const data = await response.json();

  fs.writeFileSync(`./dictionaries/${locale}.json`, JSON.stringify(data, null, 2));
}
