import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/ui/card";
import { Badge } from "@repo/ui/components/ui/badge";
import { Button } from "@repo/ui/components/ui/button";
import { Edit, Eye, BarChart } from "lucide-react";
import Link from "next/link";

export default function RecentForms() {
  const recentForms = [
    {
      id: "1",
      title: "Customer Feedback Survey",
      status: "published",
      submissions: 245,
      lastUpdated: "2 days ago",
    },
    {
      id: "2",
      title: "Product Registration",
      status: "draft",
      submissions: 0,
      lastUpdated: "5 hours ago",
    },
    {
      id: "3",
      title: "Event Registration",
      status: "published",
      submissions: 128,
      lastUpdated: "1 week ago",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Forms</CardTitle>
        <CardDescription>Your recently updated forms</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {recentForms.map((form) => (
          <div key={form.id} className="border rounded-lg p-3 space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium">{form.title}</h3>
                <p className="text-xs text-muted-foreground">Updated {form.lastUpdated}</p>
              </div>
              <Badge variant={form.status === "published" ? "default" : "outline"}>
                {form.status}
              </Badge>
            </div>
            <div className="flex items-center text-sm">
              <BarChart className="h-4 w-4 mr-1 text-muted-foreground" />
              <span>{form.submissions} submissions</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/form/builder?id=${form.id}`}>
                  <Edit className="h-3.5 w-3.5 mr-1" />
                  Edit
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/form/viewer/${form.id}`}>
                  <Eye className="h-3.5 w-3.5 mr-1" />
                  View
                </Link>
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="w-full">
          View All Forms
        </Button>
      </CardFooter>
    </Card>
  );
}
