"use client";

import { useState } from "react";
import { useFieldArray, useFormContext } from "react-hook-form";
import type { FormBuilderData } from "../form-builder";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { Checkbox } from "@repo/ui/components/ui/checkbox";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
  Form,
} from "@repo/ui/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@repo/ui/components/ui/card";
import { Plus, Trash2, MoveUp, MoveDown } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@repo/ui/components/ui/accordion";

// Element types based on the schema
const elementTypes = [
  { value: "text_input", label: "Text Input" },
  { value: "number_input", label: "Number Input" },
  { value: "email", label: "Email" },
  { value: "checkbox", label: "Checkbox" },
  { value: "radio", label: "Radio" },
  { value: "select", label: "Select" },
  { value: "textarea", label: "Text Area" },
  { value: "image", label: "Image" },
  { value: "text", label: "Text" },
  { value: "date", label: "Date" },
];

export default function ElementsStep() {
  const form = useFormContext<FormBuilderData>();
  const { control, watch } = form;
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: "elements",
  });

  const pages = watch("pages");

  const handleAddElement = () => {
    if (pages.length === 0) {
      alert("Please create at least one page first.");
      return;
    }

    append({
      id: Date.now().toString(),
      type: "text_input",
      label: "",
      pageId: pages[0]!.id,
      required: false,
      orderIndex: fields.length,
      properties: {},
      validations: [],
    });
    setEditingIndex(fields.length);
  };

  const handleRemoveElement = (index: number) => {
    remove(index);
    setEditingIndex(null);
  };

  const handleMoveUp = (index: number) => {
    if (index > 0) {
      move(index, index - 1);
    }
  };

  const handleMoveDown = (index: number) => {
    if (index < fields.length - 1) {
      move(index, index + 1);
    }
  };

  // Get page title by ID
  const getPageTitle = (pageId: string) => {
    const page = pages.find((p) => p.id === pageId);
    return page ? page.title : "Unknown Page";
  };

  // Get element type label
  const getElementTypeLabel = (type: string) => {
    const elementType = elementTypes.find((t) => t.value === type);
    return elementType ? elementType.label : type;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Create Elements</h2>
          <p className="text-muted-foreground">Add form elements to your pages.</p>
        </div>
        <Button onClick={handleAddElement} className="flex items-center gap-1">
          <Plus className="h-4 w-4" /> Add Element
        </Button>
      </div>

      {pages.length === 0 ? (
        <div className="text-center p-8 border border-dashed rounded-lg">
          <p className="text-muted-foreground">
            You need to create at least one page before adding elements.
          </p>
        </div>
      ) : fields.length === 0 ? (
        <div className="text-center p-8 border border-dashed rounded-lg">
          <p className="text-muted-foreground">
            No elements added yet. Click "Add Element" to create your first element.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {fields.map((field, index) => (
            <Card key={field.id} className={editingIndex === index ? "border-primary" : ""}>
              <CardHeader className="flex flex-row items-center justify-between py-3">
                <div>
                  <CardTitle className="text-lg">{field.label || `Element ${index + 1}`}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Type: {getElementTypeLabel(field.type)} | Page: {getPageTitle(field.pageId)}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0}
                  >
                    <MoveUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleMoveDown(index)}
                    disabled={index === fields.length - 1}
                  >
                    <MoveDown className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleRemoveElement(index)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardHeader>

              {editingIndex === index ? (
                <CardContent>
                  <Form {...form}>
                    <FormField
                      control={control}
                      name={`elements.${index}.label`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Element Label</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={control}
                      name={`elements.${index}.type`}
                      render={({ field }) => (
                        <FormItem className="mt-4">
                          <FormLabel>Element Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select element type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {elementTypes.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={control}
                      name={`elements.${index}.pageId`}
                      render={({ field }) => (
                        <FormItem className="mt-4">
                          <FormLabel>Page</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select page" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {pages.map((page) => (
                                <SelectItem key={page.id} value={page.id}>
                                  {page.title || `Page ${pages.indexOf(page) + 1}`}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={control}
                      name={`elements.${index}.required`}
                      render={({ field }) => (
                        <FormItem className="mt-4 flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Required</FormLabel>
                            <FormDescription>
                              Make this field required for form submission
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />

                    <Accordion type="single" collapsible className="mt-4">
                      <AccordionItem value="properties">
                        <AccordionTrigger>Advanced Properties</AccordionTrigger>
                        <AccordionContent>
                          {watch(`elements.${index}.type`) === "text_input" && (
                            <FormField
                              control={control}
                              name={`elements.${index}.properties.placeholder`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Placeholder</FormLabel>
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          )}

                          {watch(`elements.${index}.type`) === "number_input" && (
                            <>
                              <FormField
                                control={control}
                                name={`elements.${index}.properties.min`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Minimum Value</FormLabel>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        {...field}
                                        onChange={(e) =>
                                          field.onChange(
                                            e.target.value ? Number(e.target.value) : undefined,
                                          )
                                        }
                                      />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={control}
                                name={`elements.${index}.properties.max`}
                                render={({ field }) => (
                                  <FormItem className="mt-2">
                                    <FormLabel>Maximum Value</FormLabel>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        {...field}
                                        onChange={(e) =>
                                          field.onChange(
                                            e.target.value ? Number(e.target.value) : undefined,
                                          )
                                        }
                                      />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                            </>
                          )}
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </Form>
                </CardContent>
              ) : (
                <CardContent>
                  <p className="text-sm">
                    {field.required && <span className="text-red-500 mr-1">*</span>}
                    {field.label || `Untitled ${getElementTypeLabel(field.type)}`}
                  </p>
                </CardContent>
              )}

              <CardFooter className="flex justify-end py-3">
                {editingIndex === index ? (
                  <Button type="button" variant="outline" onClick={() => setEditingIndex(null)}>
                    Done
                  </Button>
                ) : (
                  <Button type="button" variant="outline" onClick={() => setEditingIndex(index)}>
                    Edit
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
