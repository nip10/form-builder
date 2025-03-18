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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/components/ui/dropdown-menu";
import { Edit, MoreHorizontal, Copy, Trash2, Search } from "lucide-react";
import {
  InputBase,
  InputBaseAdornment,
  InputBaseControl,
  InputBaseInput,
} from "@repo/ui/components/ui/input-base";

export default function GroupsTab() {
  const [searchQuery, setSearchQuery] = useState("");

  const groups = [
    {
      id: "g1",
      title: "Personal Information",
      description: "Basic information about the user",
      formsCount: 5,
      pagesCount: 8,
      createdAt: "2023-05-10",
    },
    {
      id: "g2",
      title: "Product Feedback",
      description: "Questions about product experience",
      formsCount: 3,
      pagesCount: 6,
      createdAt: "2023-05-15",
    },
    {
      id: "g3",
      title: "Service Feedback",
      description: "Questions about customer service",
      formsCount: 2,
      pagesCount: 4,
      createdAt: "2023-05-20",
    },
    {
      id: "g4",
      title: "Demographics",
      description: "Statistical data about users",
      formsCount: 4,
      pagesCount: 4,
      createdAt: "2023-06-01",
    },
    {
      id: "g5",
      title: "Payment Information",
      description: "Secure payment details collection",
      formsCount: 2,
      pagesCount: 3,
      createdAt: "2023-06-05",
    },
  ];

  const filteredGroups = groups.filter(
    (group) =>
      group.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.description.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <InputBase>
        <InputBaseAdornment>
          <Search />
        </InputBaseAdornment>
        <InputBaseControl>
          <InputBaseInput
            placeholder="Search..."
            className="outline-0"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </InputBaseControl>
      </InputBase>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Group Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Forms</TableHead>
              <TableHead>Pages</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredGroups.map((group) => (
              <TableRow key={group.id}>
                <TableCell className="font-medium">{group.title}</TableCell>
                <TableCell>{group.description}</TableCell>
                <TableCell>{group.formsCount}</TableCell>
                <TableCell>{group.pagesCount}</TableCell>
                <TableCell>{group.createdAt}</TableCell>
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

            {filteredGroups.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No groups found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
