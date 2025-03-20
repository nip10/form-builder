"use client";

import { useState } from "react";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { Textarea } from "@repo/ui/components/ui/textarea";
import { Checkbox } from "@repo/ui/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@repo/ui/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";
import { Label } from "@repo/ui/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@repo/ui/components/ui/card";
import { FormWithRelations } from "@/lib/repositories/form-repository";
import { SelectedElement } from "./form-viewer";

interface FormPreviewProps {
  formData: FormWithRelations;
  selectedElement: SelectedElement | null;
}

export default function FormPreview({ formData }: FormPreviewProps) {
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [formValues, setFormValues] = useState<Record<string, any>>({});

  // Group pages by group
  const pagesByGroup = formData.groups
    .flatMap((group) => group.pages || [])
    .reduce<Record<number, (typeof formData.groups)[0]["pages"]>>((acc, page) => {
      if (!page) return acc;
      const groupId = page.groupInstanceId;
      if (!acc[groupId]) {
        acc[groupId] = [];
      }
      acc[groupId].push(page);
      return acc;
    }, {});

  // Group elements by page
  const elementsByPage = formData.groups
    .flatMap((group) => group.pages || [])
    .flatMap((page) => page.elements || [])
    .reduce<Record<number, NonNullable<(typeof formData.groups)[0]["pages"][0]["elements"]>[0][]>>(
      (acc, element) => {
        if (!element) return acc;
        const pageId = element.pageInstanceId;
        if (!acc[pageId]) {
          acc[pageId] = [];
        }
        acc[pageId].push(element);
        return acc;
      },
      {},
    );

  // Flatten pages for navigation
  const allPages = formData.groups.flatMap((group) => {
    const groupPages = pagesByGroup[group.id];
    return groupPages || [];
  });

  const currentPage = allPages[currentPageIndex];

  // Get current group
  const currentGroup = currentPage
    ? formData.groups.find((group) => group.id === currentPage.groupInstanceId)
    : undefined;

  const handlePrevious = () => {
    if (currentPageIndex > 0) {
      setCurrentPageIndex(currentPageIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentPageIndex < allPages.length - 1) {
      setCurrentPageIndex(currentPageIndex + 1);
    }
  };

  const handleInputChange = (elementId: number, value: any) => {
    setFormValues((prev) => ({
      ...prev,
      [elementId]: value,
    }));
  };

  // Render form element based on type
  const renderElement = (
    element: NonNullable<(typeof formData.groups)[0]["pages"][0]["elements"]>[0],
  ) => {
    const value = formValues[element.id] || "";

    if (!element.template) {
      return null;
    }

    switch (element.template.type) {
      case "text_input":
        return (
          <div className="space-y-2" key={element.id}>
            <Label htmlFor={element.id.toString()}>{element.label || element.template.label}</Label>
            <Input
              id={element.id.toString()}
              value={value}
              placeholder={element.properties?.placeholder || ""}
              onChange={(e) => handleInputChange(element.id, e.target.value)}
            />
          </div>
        );

      case "number_input":
        return (
          <div className="space-y-2" key={element.id}>
            <Label htmlFor={element.id.toString()}>{element.label || element.template.label}</Label>
            <Input
              id={element.id.toString()}
              type="number"
              value={value}
              min={element.properties?.min}
              max={element.properties?.max}
              onChange={(e) => handleInputChange(element.id, e.target.value)}
            />
          </div>
        );

      case "textarea":
        return (
          <div className="space-y-2" key={element.id}>
            <Label htmlFor={element.id.toString()}>{element.label || element.template.label}</Label>
            <Textarea
              id={element.id.toString()}
              value={value}
              placeholder={element.properties?.placeholder || ""}
              onChange={(e) => handleInputChange(element.id, e.target.value)}
              rows={4}
            />
          </div>
        );

      case "checkbox":
        return (
          <div className="flex items-start space-x-2 space-y-0" key={element.id}>
            <Checkbox
              id={element.id.toString()}
              checked={value || false}
              onCheckedChange={(checked) => handleInputChange(element.id, checked)}
            />
            <div className="grid gap-1.5 leading-none">
              <Label
                htmlFor={element.id.toString()}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {element.label || element.template.label}
              </Label>
            </div>
          </div>
        );

      case "checkbox_group":
        return (
          <div className="space-y-2" key={element.id}>
            <Label>{element.label || element.template.label}</Label>
            <div className="space-y-2">
              {element.properties?.options?.map((option: string, index: number) => (
                <div key={index} className="flex items-start space-x-2 space-y-0">
                  <Checkbox
                    id={`${element.id}-${index}`}
                    checked={(value || [])[index] || false}
                    onCheckedChange={(checked) => {
                      const newValues = [...(value || [])];
                      newValues[index] = checked;
                      handleInputChange(element.id, newValues);
                    }}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label
                      htmlFor={`${element.id}-${index}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {option}
                    </Label>
                  </div>
                </div>
              )) || <div className="text-sm text-muted-foreground">No options defined</div>}
            </div>
          </div>
        );

      case "radio":
        return (
          <div className="space-y-2" key={element.id}>
            <Label>{element.label || element.template.label}</Label>
            <RadioGroup
              value={value}
              onValueChange={(value) => handleInputChange(element.id, value)}
            >
              {element.properties?.options?.map((option: string, index: number) => (
                <div key={index} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`${element.id}-${index}`} />
                  <Label htmlFor={`${element.id}-${index}`}>{option}</Label>
                </div>
              )) || <div className="text-sm text-muted-foreground">No options defined</div>}
            </RadioGroup>
          </div>
        );

      case "radio_group":
        return (
          <div className="space-y-2" key={element.id}>
            <Label>{element.label || element.template.label}</Label>
            <RadioGroup
              value={value}
              onValueChange={(value) => handleInputChange(element.id, value)}
            >
              {element.properties?.options?.map((option: string, index: number) => (
                <div key={index} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`${element.id}-${index}`} />
                  <Label htmlFor={`${element.id}-${index}`}>{option}</Label>
                </div>
              )) || <div className="text-sm text-muted-foreground">No options defined</div>}
            </RadioGroup>
          </div>
        );

      case "select":
        return (
          <div className="space-y-2" key={element.id}>
            <Label htmlFor={element.id.toString()}>{element.label || element.template.label}</Label>
            <Select value={value} onValueChange={(value) => handleInputChange(element.id, value)}>
              <SelectTrigger id={element.id.toString()}>
                <SelectValue placeholder="Select an option" />
              </SelectTrigger>
              <SelectContent>
                {element.properties?.options?.map((option: string, index: number) => (
                  <SelectItem key={index} value={option}>
                    {option}
                  </SelectItem>
                )) || (
                  <SelectItem value="no-options" disabled>
                    No options defined
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        );

      case "date":
        return (
          <div className="space-y-2" key={element.id}>
            <Label htmlFor={element.id.toString()}>{element.label || element.template.label}</Label>
            <Input
              id={element.id.toString()}
              type="date"
              value={value}
              onChange={(e) => handleInputChange(element.id, e.target.value)}
            />
          </div>
        );

      case "range":
      case "slider":
        return (
          <div className="space-y-2" key={element.id}>
            <Label htmlFor={element.id.toString()}>{element.label || element.template.label}</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm">{element.properties?.min || 0}</span>
              <Input
                id={element.id.toString()}
                type="range"
                value={value || element.properties?.default || 0}
                min={element.properties?.min || 0}
                max={element.properties?.max || 100}
                step={element.properties?.step || 1}
                onChange={(e) => handleInputChange(element.id, e.target.value)}
                className="w-full"
              />
              <span className="text-sm">{element.properties?.max || 100}</span>
            </div>
            {value && <div className="text-sm text-center">Value: {value}</div>}
          </div>
        );

      case "rating":
        return (
          <div className="space-y-2" key={element.id}>
            <Label>{element.label || element.template.label}</Label>
            <div className="flex gap-1">
              {Array.from({ length: element.properties?.max || 5 }).map((_, index) => (
                <Button
                  key={index}
                  type="button"
                  variant={parseInt(value) > index ? "default" : "outline"}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleInputChange(element.id, (index + 1).toString())}
                >
                  {index + 1}
                </Button>
              ))}
            </div>
          </div>
        );

      case "switch":
      case "toggle":
        return (
          <div className="flex items-center justify-between space-y-0" key={element.id}>
            <Label htmlFor={element.id.toString()}>{element.label || element.template.label}</Label>
            <div className="ml-auto">
              <Checkbox
                id={element.id.toString()}
                checked={value || false}
                onCheckedChange={(checked) => handleInputChange(element.id, checked)}
              />
            </div>
          </div>
        );

      case "image":
        return (
          <div className="space-y-2" key={element.id}>
            <Label>{element.label || element.template.label}</Label>
            <div className="border rounded-md p-2 flex justify-center">
              <img
                src="/placeholder.svg?height=150&width=300"
                alt={element.label || element.template.label || "Image"}
                className="max-h-[200px] object-contain"
              />
            </div>
          </div>
        );

      default:
        return <div key={element.id}>Unsupported element type: {element.template.type}</div>;
    }
  };

  // If no pages, show a message
  if (allPages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h3 className="text-lg font-medium">No pages to display</h3>
          <p className="text-muted-foreground">This form has no pages or elements.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>{currentPage?.title || "Untitled Page"}</CardTitle>
          {currentPage?.description && <CardDescription>{currentPage.description}</CardDescription>}
          <div className="text-sm text-muted-foreground">
            Group: {currentGroup?.title || "Untitled Group"}
          </div>
          <div className="text-sm text-muted-foreground">
            Page {currentPageIndex + 1} of {allPages.length}
          </div>
        </CardHeader>
        <CardContent>
          <form className="space-y-6">
            {currentPage &&
              elementsByPage[currentPage.id] &&
              (elementsByPage[currentPage.id] || [])
                .filter((element): element is NonNullable<typeof element> => Boolean(element))
                .map((element) => renderElement(element))}

            {(!currentPage ||
              !elementsByPage[currentPage.id] ||
              elementsByPage[currentPage.id]?.length === 0) && (
              <div className="text-center py-4">
                <p className="text-muted-foreground">No elements on this page.</p>
              </div>
            )}
          </form>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={handlePrevious} disabled={currentPageIndex === 0}>
            Previous
          </Button>

          {currentPageIndex < allPages.length - 1 ? (
            <Button onClick={handleNext}>Next</Button>
          ) : (
            <Button>Submit</Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
