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
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@repo/ui/components/ui/card";
import { Plus, Trash2, MoveUp, MoveDown } from "lucide-react";
import type { Dictionary } from "@repo/internationalization";
import { TranslationInput } from "../translation-input";
import { TranslationTextarea } from "../translation-textarea";

interface GroupsStepProps {
  dictionary: Dictionary;
}

export default function GroupsStep({ dictionary }: GroupsStepProps) {
  const form = useFormContext<FormBuilderData>();
  const { control, watch } = form;
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: "groups",
  });

  const handleAddGroup = () => {
    append({
      id: Date.now().toString(),
      title: "",
      description: "",
      orderIndex: fields.length,
      properties: {},
    });
    setEditingIndex(fields.length);
  };

  const handleRemoveGroup = (index: number) => {
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

  const getGroupTitle = (index: number) => {
    const title = watch(`groups.${index}.title`);
    return title && title in dictionary
      ? dictionary[title as keyof typeof dictionary]
      : `Group ${index + 1}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="scroll-m-20 text-3xl font-semibold tracking-tight first:mt-0">
            Create Groups
          </h2>
          <p className="text-muted-foreground">Add groups to organize your form content.</p>
        </div>
        <Button onClick={handleAddGroup} className="flex items-center gap-1">
          <Plus className="h-4 w-4" /> Add Group
        </Button>
      </div>

      {fields.length === 0 ? (
        <div className="text-center p-8 border border-dashed rounded-lg">
          <p className="text-muted-foreground">
            No groups added yet. Click "Add Group" to create your first group.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {fields.map((field, index) => (
            <Card key={field.id} className={editingIndex === index ? "border-primary" : ""}>
              <CardHeader className="flex flex-row items-center justify-between py-3">
                <CardTitle className="text-lg">{getGroupTitle(index)}</CardTitle>
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
                  <Button variant="ghost" size="icon" onClick={() => handleRemoveGroup(index)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardHeader>

              {editingIndex === index ? (
                <CardContent>
                  <Form {...form}>
                    <FormField
                      control={control}
                      name={`groups.${index}.title`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Group Title</FormLabel>
                          <FormControl>
                            <TranslationInput
                              placeholder="Enter group title"
                              dictionary={dictionary}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={control}
                      name={`groups.${index}.description`}
                      render={({ field }) => (
                        <FormItem className="mt-2">
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Enter group description"
                              className="resize-none"
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </Form>
                </CardContent>
              ) : (
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {watch(`groups.${index}.description`) || "No description provided."}
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
