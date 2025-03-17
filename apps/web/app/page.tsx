import type { Metadata } from "next";
import DashboardPage from "./dashboard/components/dashboard-page";

export const metadata: Metadata = {
  title: "Form Builder Dashboard",
  description: "Manage and create forms, groups, pages, and elements",
};

export default function Home() {
  return <DashboardPage />;
}
