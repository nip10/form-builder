import "./styles.css";
import type { ReactNode } from "react";
import { DesignSystemProvider } from "@repo/ui";
import { fonts } from "@repo/ui/lib/fonts";
import { I18nContextProvider } from "@/contexts/i18nContext";

type RootLayoutProperties = {
  readonly children: ReactNode;
};

const RootLayout = ({ children }: RootLayoutProperties) => {
  return (
    <html lang="en" className={fonts} suppressHydrationWarning>
      <body>
        <I18nContextProvider>
          <DesignSystemProvider>{children}</DesignSystemProvider>
        </I18nContextProvider>
      </body>
    </html>
  );
};

export default RootLayout;
