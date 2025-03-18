import "./styles.css";
import type { ReactNode } from "react";
import { DesignSystemProvider } from "@repo/ui";
import { fonts } from "@repo/ui/lib/fonts";

type RootLayoutProperties = {
  readonly children: ReactNode;
};

const RootLayout = ({ children }: RootLayoutProperties) => {
  return (
    <html lang="en" className={fonts} suppressHydrationWarning>
      <body>
        <DesignSystemProvider>{children}</DesignSystemProvider>
      </body>
    </html>
  );
};

export default RootLayout;
