"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui/components/ui/tabs";
import DashboardHeader from "./dashboard-header";
import DashboardStats from "./dashboard-stats";
import RecentForms from "./recent-forms";
import FormsTab from "./tabs/forms-tab";
import GroupsTab from "./tabs/groups-tab";
import PagesTab from "./tabs/pages-tab";
import ElementsTab from "./tabs/elements-tab";
import { Button } from "@repo/ui/components/ui/button";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("forms");
  const router = useRouter();

  const handleCreateNew = () => {
    switch (activeTab) {
      case "forms":
        router.push("/form/builder");
        break;
      case "groups":
        // Open group creation modal or navigate to group creation page
        break;
      case "pages":
        // Open page creation modal or navigate to page creation page
        break;
      case "elements":
        // Open element creation modal or navigate to element creation page
        break;
    }
  };

  return (
    <div className="container mx-auto py-6 px-4 space-y-8">
      <DashboardHeader />
      <DashboardStats />

      <main className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Manage Content</h2>
            <Button onClick={handleCreateNew} className="flex items-center gap-1 capitalize">
              <Plus className="h-4 w-4" />
              New {activeTab.slice(0, -1)}
            </Button>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-4 mb-6">
              <TabsTrigger value="forms">Forms</TabsTrigger>
              <TabsTrigger value="groups">Groups</TabsTrigger>
              <TabsTrigger value="pages">Pages</TabsTrigger>
              <TabsTrigger value="elements">Elements</TabsTrigger>
            </TabsList>

            <TabsContent value="forms" className="space-y-4">
              <FormsTab />
            </TabsContent>

            <TabsContent value="groups" className="space-y-4">
              <GroupsTab />
            </TabsContent>

            <TabsContent value="pages" className="space-y-4">
              <PagesTab />
            </TabsContent>

            <TabsContent value="elements" className="space-y-4">
              <ElementsTab />
            </TabsContent>
          </Tabs>
        </div>

        <div>
          <RecentForms />
        </div>
      </main>
    </div>
  );
}
