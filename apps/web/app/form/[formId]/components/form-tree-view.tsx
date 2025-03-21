"use client";

import {
  ChevronRight,
  ChevronDown,
  FileText,
  Folder,
  Layout,
  FormInput,
  CheckSquare,
  ListFilter,
  Calendar,
  Mail,
  Type,
  ImageIcon,
  AlignLeft,
} from "lucide-react";
import { cn } from "@repo/ui/lib/utils";
import { useState } from "react";
import { FormWithRelations } from "@/lib/repositories/form-repository";
import { SelectedElement, SelectedElementType } from "./form-viewer";
import type { Dictionary } from "@repo/internationalization";

// Define consistent colors for form elements
export const typeColors = {
  form: "bg-blue-50 hover:bg-blue-100",
  group: "bg-purple-50 hover:bg-purple-100",
  page: "bg-amber-50 hover:bg-amber-100",
  element: "bg-green-50 hover:bg-green-100",
  selected: "ring-2 ring-offset-1",
};

interface FormTreeViewProps {
  formData: FormWithRelations;
  selectedElement: SelectedElement | null;
  onElementSelect: (type: SelectedElementType, id: number) => void;
  dictionary: Dictionary;
}

export default function FormTreeView({
  formData,
  selectedElement,
  onElementSelect,
  dictionary,
}: FormTreeViewProps) {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    formData.groups.reduce((acc, group) => ({ ...acc, [group.id]: true }), {}),
  );

  const [expandedPages, setExpandedPages] = useState<Record<string, boolean>>(
    formData.groups
      .flatMap((group) => group.pages)
      .reduce((acc, page) => ({ ...acc, [page.id]: true }), {}),
  );

  const toggleGroup = (groupId: number) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const togglePage = (pageId: number) => {
    setExpandedPages((prev) => ({
      ...prev,
      [pageId]: !prev[pageId],
    }));
  };

  // Get element icon based on type
  const getElementIcon = (type: string) => {
    switch (type) {
      case "text_input":
        return <Type className="h-4 w-4" />;
      case "number_input":
        return <FormInput className="h-4 w-4" />;
      case "email":
        return <Mail className="h-4 w-4" />;
      case "checkbox":
        return <CheckSquare className="h-4 w-4" />;
      case "radio":
        return <ListFilter className="h-4 w-4" />;
      case "select":
        return <ListFilter className="h-4 w-4" />;
      case "textarea":
        return <AlignLeft className="h-4 w-4" />;
      case "image":
        return <ImageIcon className="h-4 w-4" />;
      case "date":
        return <Calendar className="h-4 w-4" />;
      default:
        return <FormInput className="h-4 w-4" />;
    }
  };

  // Group pages by group
  const pagesByGroup = formData.groups
    .flatMap((group) => group.pages || [])
    .reduce(
      (acc, page) => {
        if (!page) return acc;
        const groupId = page.groupInstanceId;
        if (!acc[groupId]) {
          acc[groupId] = [];
        }
        acc[groupId].push(page);
        return acc;
      },
      {} as Record<number, (typeof formData.groups)[0]["pages"]>,
    );

  // Group elements by page
  const elementsByPage = formData.groups
    .flatMap((group) => group.pages || [])
    .flatMap((page) => page.elements || [])
    .reduce(
      (acc, element) => {
        if (!element) return acc;
        const pageId = element.pageInstanceId;
        if (!acc[pageId]) {
          acc[pageId] = [];
        }
        acc[pageId].push(element);
        return acc;
      },
      {} as Record<number, NonNullable<(typeof formData.groups)[0]["pages"][0]["elements"]>[0][]>,
    );

  // Helper function to translate content if it's a translation key
  const translate = (text: string | null | undefined): string => {
    if (!text) return "";
    // Check if this is a translation key (stored in the DB)
    return text in dictionary ? dictionary[text as keyof typeof dictionary] : text;
  };

  return (
    <div className="text-sm">
      {/* Form root */}
      <div
        className={cn(
          "flex items-center p-2 rounded-md cursor-pointer",
          typeColors.form,
          selectedElement?.type === "form" && typeColors.selected,
        )}
        onClick={() => onElementSelect("form", formData.id)}
      >
        <FileText className="h-4 w-4 mr-2" />
        <span className="font-medium">{translate(formData.title) || "Untitled Form"}</span>
      </div>

      {/* Groups */}
      <div className="ml-4 mt-2 space-y-1">
        {formData.groups.map((group) => (
          <div key={group.id}>
            <div
              className={cn(
                "flex items-center p-2 rounded-md cursor-pointer",
                typeColors.group,
                selectedElement?.type === "group" &&
                  selectedElement.id === group.id &&
                  typeColors.selected,
              )}
              onClick={() => onElementSelect("group", group.id)}
            >
              <span
                className="mr-1 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleGroup(group.id);
                }}
              >
                {expandedGroups[group.id] ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </span>
              <Folder className="h-4 w-4 mr-2" />
              <span>{translate(group.title) || `Group ${formData.groups.indexOf(group) + 1}`}</span>
            </div>

            {/* Pages in this group */}
            {expandedGroups[group.id] && (
              <div className="ml-6 mt-1 space-y-1">
                {pagesByGroup[group.id]?.map((page) => (
                  <div key={page.id}>
                    <div
                      className={cn(
                        "flex items-center p-2 rounded-md cursor-pointer",
                        typeColors.page,
                        selectedElement?.type === "page" &&
                          selectedElement.id === page.id &&
                          typeColors.selected,
                      )}
                      onClick={() => onElementSelect("page", page.id)}
                    >
                      <span
                        className="mr-1 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePage(page.id);
                        }}
                      >
                        {expandedPages[page.id] ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </span>
                      <Layout className="h-4 w-4 mr-2" />
                      <span>
                        {translate(page.title) ||
                          `Page ${formData.groups.flatMap((group) => group.pages).indexOf(page) + 1}`}
                      </span>
                    </div>

                    {/* Elements in this page */}
                    {expandedPages[page.id] && (
                      <div className="ml-6 mt-1 space-y-1">
                        {elementsByPage[page.id]?.map((element) => (
                          <div
                            key={element.id}
                            className={cn(
                              "flex items-center p-2 rounded-md cursor-pointer",
                              typeColors.element,
                              selectedElement?.type === "element" &&
                                selectedElement.id === element.id &&
                                typeColors.selected,
                            )}
                            onClick={() => onElementSelect("element", element.id)}
                          >
                            {getElementIcon(element?.template?.type || "unknown")}
                            <span className="ml-2">
                              {translate(element.label) ||
                                `Element ${
                                  formData.groups
                                    .flatMap((group) => group.pages)
                                    .flatMap((page) => page.elements)
                                    .indexOf(element) + 1
                                }`}
                            </span>
                            {(element as any).required && (
                              <span className="ml-1 text-red-500">*</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
