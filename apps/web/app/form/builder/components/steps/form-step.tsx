"use client";

import { useFormContext } from "react-hook-form";
import type { FormBuilderData } from "../form-builder";
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

export default function FormStep() {
  const form = useFormContext<FormBuilderData>();
  const { control } = form;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="scroll-m-20 text-3xl font-semibold tracking-tight first:mt-0">
          Create Form
        </h2>
        <p className="text-muted-foreground">Define the basic information for your form.</p>
      </div>

      <Form {...form}>
        <FormField
          control={control}
          name="form.title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Form Title</FormLabel>
              <FormControl>
                <Input placeholder="Enter form title" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="form.description"
          render={({ field }) => (
            <FormItem className="mt-4">
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter form description"
                  className="resize-none"
                  rows={4}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="form.status"
          render={({ field }) => (
            <FormItem className="mt-4">
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published" disabled>
                    Published
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </Form>
    </div>
  );
}
