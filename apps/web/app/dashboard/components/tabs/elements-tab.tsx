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

export default function ElementsTab() {
  const [searchQuery, setSearchQuery] = useState("");

  const elements = [
    {
      id: "e1",
      label: "Full Name",
      type: "text_input",
      pageName: "Contact Details",
      groupName: "Personal Information",
      required: true,
      createdAt: "2023-05-12",
    },
    {
      id: "e2",
      label: "Email Address",
      type: "email",
      pageName: "Contact Details",
      groupName: "Personal Information",
      required: true,
      createdAt: "2023-05-12",
    },
    {
      id: "e3",
      label: "Age Group",
      type: "select",
      pageName: "Demographics",
      groupName: "Personal Information",
      required: true,
      createdAt: "2023-05-14",
    },
    {
      id: "e4",
      label: "Product Rating",
      type: "radio",
      pageName: "Product Quality",
      groupName: "Product Feedback",
      required: true,
      createdAt: "2023-05-16",
    },
    {
      id: "e5",
      label: "Feature Suggestions",
      type: "textarea",
      pageName: "Product Features",
      groupName: "Product Feedback",
      required: false,
      createdAt: "2023-05-18",
    },
    {
      id: "e6",
      label: "Support Rating",
      type: "radio",
      pageName: "Customer Support",
      groupName: "Service Feedback",
      required: true,
      createdAt: "2023-05-22",
    },
  ];

  const filteredElements = elements.filter(
    (element) =>
      element.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      element.pageName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      element.groupName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      element.type.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Get element type label
  const getElementTypeLabel = (type: string) => {
    const elementTypes: Record<string, string> = {
      text_input: "Text Input",
      number_input: "Number Input",
      email: "Email",
      checkbox: "Checkbox",
      radio: "Radio",
      select: "Select",
      textarea: "Text Area",
      image: "Image",
      text: "Text",
      date: "Date",
    };
    return elementTypes[type] || type;
  };

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
              <TableHead>Element Label</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Page</TableHead>
              <TableHead>Group</TableHead>
              <TableHead>Required</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredElements.map((element) => (
              <TableRow key={element.id}>
                <TableCell className="font-medium">{element.label}</TableCell>
                <TableCell>{getElementTypeLabel(element.type)}</TableCell>
                <TableCell>{element.pageName}</TableCell>
                <TableCell>{element.groupName}</TableCell>
                <TableCell>
                  {element.required ? (
                    <Badge>Required</Badge>
                  ) : (
                    <Badge variant="outline">Optional</Badge>
                  )}
                </TableCell>
                <TableCell>{element.createdAt}</TableCell>
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

            {filteredElements.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No elements found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
