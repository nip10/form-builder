import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/ui/card";
import { FileText, Users, Layout, FormInput } from "lucide-react";

export default function DashboardStats() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-1">
            Total Forms <FileText className="h-4 w-4 text-muted-foreground ml-1" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">12</div>
          <p className="text-xs text-muted-foreground">+2 from last month</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-1">
            Form Submissions <Users className="h-4 w-4 text-muted-foreground ml-1" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">573</div>
          <p className="text-xs text-muted-foreground">+201 from last month</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-1">
            Active Pages <Layout className="h-4 w-4 text-muted-foreground ml-1" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">34</div>
          <p className="text-xs text-muted-foreground">+8 from last month</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-1">
            Form Elements <FormInput className="h-4 w-4 text-muted-foreground ml-1" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">128</div>
          <p className="text-xs text-muted-foreground">+42 from last month</p>
        </CardContent>
      </Card>
    </div>
  );
}
