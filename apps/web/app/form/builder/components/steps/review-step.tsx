"use client";

import { useFormContext } from "react-hook-form";
import type { FormBuilderData } from "../form-builder";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@repo/ui/components/ui/accordion";
import { Badge } from "@repo/ui/components/ui/badge";
import { Separator } from "@repo/ui/components/ui/separator";

export default function ReviewStep() {
  const { watch } = useFormContext<FormBuilderData>();

  const formData = watch();
  const { form, groups, pages, elements } = formData;

  // Get page title by ID
  const getPageTitle = (pageId: string) => {
    const page = pages.find((p) => p.id === pageId);
    return page ? page.title || `Untitled Page` : "Unknown Page";
  };

  // Get group title by ID
  const getGroupTitle = (groupId: string) => {
    const group = groups.find((g) => g.id === groupId);
    return group ? group.title || `Untitled Group` : "Unknown Group";
  };

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

  // Group elements by page
  const elementsByPage = elements.reduce(
    (acc, element) => {
      const pageId = element.pageId;
      if (!pageId) return acc;
      if (!acc[pageId]) {
        acc[pageId] = [];
      }
      acc[pageId].push(element);
      return acc;
    },
    {} as Record<string, typeof elements>,
  );

  // Group pages by group
  const pagesByGroup = pages.reduce(
    (acc, page) => {
      const groupId = page.groupId;
      if (!groupId) return acc;
      if (!acc[groupId]) {
        acc[groupId] = [];
      }
      acc[groupId].push(page);
      return acc;
    },
    {} as Record<string, typeof pages>,
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="scroll-m-20 text-3xl font-semibold tracking-tight first:mt-0">
          Review Form
        </h2>
        <p className="text-muted-foreground">Review your form structure before creating it.</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-row justify-between">
            <CardTitle>{form.title || "Untitled Form"}</CardTitle>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={form.status === "published" ? "default" : "outline"}>
                {form.status === "published" ? "Published" : "Draft"}
              </Badge>
            </div>
          </div>
          {form.description && <CardDescription>{form.description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Form Structure</h3>
            <Accordion type="multiple" className="w-full">
              {groups.map((group) => (
                <AccordionItem key={group.id} value={group.id}>
                  <AccordionTrigger className="font-medium">
                    {group.title || "Untitled Group"}
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="pl-4 border-l-2 border-muted">
                      {group.description && (
                        <p className="text-sm text-muted-foreground mb-2">{group.description}</p>
                      )}

                      {(pagesByGroup[group.id] || []).length > 0 ? (
                        <Accordion type="multiple" className="w-full">
                          {(pagesByGroup[group.id] || []).map((page) => (
                            <AccordionItem key={page.id} value={page.id}>
                              <AccordionTrigger className="text-sm font-medium">
                                {page.title || "Untitled Page"}
                              </AccordionTrigger>
                              <AccordionContent>
                                <div className="pl-4 border-l-2 border-muted">
                                  {page.description && (
                                    <p className="text-sm text-muted-foreground mb-2">
                                      {page.description}
                                    </p>
                                  )}

                                  {(elementsByPage[page.id] || []).length > 0 ? (
                                    <ul className="space-y-2">
                                      {(elementsByPage[page.id] || []).map((element) => (
                                        <li key={element.id} className="text-sm">
                                          <div className="flex items-center gap-2">
                                            <span className="font-medium">
                                              {element.label || "Untitled Element"}
                                            </span>
                                            <Badge variant="outline" className="text-xs">
                                              {getElementTypeLabel(element.type)}
                                            </Badge>
                                            {element.required && (
                                              <Badge variant="destructive" className="text-xs">
                                                Required
                                              </Badge>
                                            )}
                                          </div>
                                        </li>
                                      ))}
                                    </ul>
                                  ) : (
                                    <p className="text-sm text-muted-foreground">
                                      No elements in this page.
                                    </p>
                                  )}
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                      ) : (
                        <p className="text-sm text-muted-foreground">No pages in this group.</p>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            {groups.length === 0 && (
              <p className="text-sm text-muted-foreground">No groups defined in this form.</p>
            )}
          </div>

          <Separator />

          <div className="mt-6">
            <h3 className="text-lg font-medium mb-2">Form Summary</h3>
            <ul className="text-sm flex flex-row gap-2 justify-between">
              <li>
                <span className="font-medium">Groups:</span> {groups.length}
              </li>
              <li>
                <span className="font-medium">Pages:</span> {pages.length}
              </li>
              <li>
                <span className="font-medium">Elements:</span> {elements.length}
              </li>
              <li>
                <span className="font-medium">Required Fields:</span>{" "}
                {elements.filter((e) => e.required).length}
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
