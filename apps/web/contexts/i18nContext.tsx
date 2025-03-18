"use client";

import { Dictionary, getDictionary } from "@repo/internationalization";
import { createContext, useContext, useEffect, useState } from "react";

const I18nContext = createContext<Dictionary | undefined>(undefined);

export const I18nContextProvider = ({ children }: { children: React.ReactNode }) => {
  const [dictionary, setDictionary] = useState<Dictionary | undefined>(undefined);

  useEffect(() => {
    if (dictionary) return;
    getDictionary("en").then((dictionary) => setDictionary(dictionary));
  }, []);

  return <I18nContext.Provider value={dictionary}>{children}</I18nContext.Provider>;
};

export const useDictionary = () => {
  const dictionary = useContext(I18nContext);
  if (!dictionary) {
    throw new Error("Dictionary not found");
  }
  return dictionary;
};
