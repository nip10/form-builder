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
import { Edit, MoreHorizontal, Copy, Trash2, Search } from "lucide-react";

export default function PagesTab() {
  const [searchQuery, setSearchQuery] = useState("");

  const pages = [
    {
      id: "p1",
      title: "Contact Details",
      description: "Collect user contact information",
      groupName: "Personal Information",
      elementsCount: 4,
      createdAt: "2023-05-12",
    },
    {
      id: "p2",
      title: "Demographics",
      description: "Collect demographic information",
      groupName: "Personal Information",
      elementsCount: 3,
      createdAt: "2023-05-14",
    },
    {
      id: "p3",
      title: "Product Quality",
      description: "Rate product quality",
      groupName: "Product Feedback",
      elementsCount: 5,
      createdAt: "2023-05-16",
    },
    {
      id: "p4",
      title: "Product Features",
      description: "Feedback on product features",
      groupName: "Product Feedback",
      elementsCount: 6,
      createdAt: "2023-05-18",
    },
    {
      id: "p5",
      title: "Customer Support",
      description: "Rate customer support experience",
      groupName: "Service Feedback",
      elementsCount: 4,
      createdAt: "2023-05-22",
    },
  ];

  const filteredPages = pages.filter(
    (page) =>
      page.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      page.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      page.groupName.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search pages..."
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
              <TableHead>Page Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Group</TableHead>
              <TableHead>Elements</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPages.map((page) => (
              <TableRow key={page.id}>
                <TableCell className="font-medium">{page.title}</TableCell>
                <TableCell>{page.description}</TableCell>
                <TableCell>{page.groupName}</TableCell>
                <TableCell>{page.elementsCount}</TableCell>
                <TableCell>{page.createdAt}</TableCell>
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
                      <DropdownMenuItem>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
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

            {filteredPages.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No pages found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
