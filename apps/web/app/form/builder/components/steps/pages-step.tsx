"use client";

import { useState } from "react";
import { useFieldArray, useFormContext } from "react-hook-form";
import type { FormBuilderData } from "../form-builder";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { Textarea } from "@repo/ui/components/ui/textarea";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
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

export default function PagesStep() {
  const form = useFormContext<FormBuilderData>();
  const { control, watch } = form;
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: "pages",
  });

  const groups = watch("groups");

  const handleAddPage = () => {
    if (groups.length === 0) {
      alert("Please create at least one group first.");
      return;
    }

    append({
      id: Date.now().toString(),
      title: "",
      description: "",
      groupId: groups[0]!.id,
      orderIndex: fields.length,
      properties: {},
    });
    setEditingIndex(fields.length);
  };

  const handleRemovePage = (index: number) => {
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

  // Get group title by ID
  const getGroupTitle = (groupId: string) => {
    const group = groups.find((g) => g.id === groupId);
    return group ? group.title : "Unknown Group";
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="scroll-m-20 text-3xl font-semibold tracking-tight first:mt-0">
            Create Pages
          </h2>
          <p className="text-muted-foreground">Add pages to your form groups.</p>
        </div>
        <Button onClick={handleAddPage} className="flex items-center gap-1">
          <Plus className="h-4 w-4" /> Add Page
        </Button>
      </div>

      {groups.length === 0 ? (
        <div className="text-center p-8 border border-dashed rounded-lg">
          <p className="text-muted-foreground">
            You need to create at least one group before adding pages.
          </p>
        </div>
      ) : fields.length === 0 ? (
        <div className="text-center p-8 border border-dashed rounded-lg">
          <p className="text-muted-foreground">
            No pages added yet. Click "Add Page" to create your first page.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {fields.map((field, index) => (
            <Card key={field.id} className={editingIndex === index ? "border-primary" : ""}>
              <CardHeader className="flex flex-row items-center justify-between py-3">
                <div>
                  <CardTitle className="text-lg">{field.title || `Page ${index + 1}`}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Group: {getGroupTitle(field.groupId)}
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
                  <Button variant="ghost" size="icon" onClick={() => handleRemovePage(index)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardHeader>

              {editingIndex === index ? (
                <CardContent>
                  <Form {...form}>
                    <FormField
                      control={control}
                      name={`pages.${index}.title`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Page Title</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={control}
                      name={`pages.${index}.description`}
                      render={({ field }) => (
                        <FormItem className="mt-4">
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea className="resize-none" rows={3} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={control}
                      name={`pages.${index}.groupId`}
                      render={({ field }) => (
                        <FormItem className="mt-4">
                          <FormLabel>Group</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select group" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {groups.map((group) => (
                                <SelectItem key={group.id} value={group.id}>
                                  {group.title || `Group ${groups.indexOf(group) + 1}`}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </Form>
                </CardContent>
              ) : (
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {watch(`pages.${index}.description`) || "No description provided."}
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
