"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/ui/table";
import { Badge } from "@repo/ui/components/ui/badge";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/components/ui/dropdown-menu";
import { Edit, Eye, MoreHorizontal, Copy, Trash2, Search } from "lucide-react";
import Link from "next/link";

export default function FormsTab() {
  const [searchQuery, setSearchQuery] = useState("");

  const forms = [
    {
      id: "1",
      title: "Customer Feedback Survey",
      status: "published",
      createdAt: "2023-05-15",
      updatedAt: "2023-06-02",
      submissions: 245,
    },
    {
      id: "2",
      title: "Product Registration",
      status: "draft",
      createdAt: "2023-06-10",
      updatedAt: "2023-06-10",
      submissions: 0,
    },
    {
      id: "3",
      title: "Event Registration",
      status: "published",
      createdAt: "2023-04-20",
      updatedAt: "2023-05-25",
      submissions: 128,
    },
    {
      id: "4",
      title: "Job Application",
      status: "published",
      createdAt: "2023-03-12",
      updatedAt: "2023-04-18",
      submissions: 87,
    },
    {
      id: "5",
      title: "Newsletter Signup",
      status: "draft",
      createdAt: "2023-06-08",
      updatedAt: "2023-06-08",
      submissions: 0,
    },
  ];

  const filteredForms = forms.filter((form) =>
    form.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search forms..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Form Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Last Updated</TableHead>
              <TableHead>Submissions</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredForms.map((form) => (
              <TableRow key={form.id}>
                <TableCell className="font-medium">{form.title}</TableCell>
                <TableCell>
                  <Badge variant={form.status === "published" ? "default" : "outline"}>
                    {form.status}
                  </Badge>
                </TableCell>
                <TableCell>{form.createdAt}</TableCell>
                <TableCell>{form.updatedAt}</TableCell>
                <TableCell>{form.submissions}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href={`/form-builder?id=${form.id}`} className="cursor-pointer">
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/form-viewer/${form.id}`} className="cursor-pointer">
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Copy className="h-4 w-4 mr-2" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}

            {filteredForms.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No forms found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
