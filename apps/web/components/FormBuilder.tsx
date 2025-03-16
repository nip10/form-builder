import React, { useState, useEffect } from "react";
import { useFormBuilder } from "@/contexts/FormBuilderContext";
import { Button } from "@repo/ui/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/ui/card";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import { Textarea } from "@repo/ui/components/ui/textarea";
import {
  Save,
  Layers,
  Settings,
  List,
  Eye,
  Database,
  Share2,
} from "lucide-react";
import { toast } from "sonner";
import PagesList from "./PagesList";
import ValidationRulesEditor from "./ValidationRulesEditor";
import ConditionalLogicEditor from "./ConditionalLogicEditor";
import FormRenderer from "./FormRenderer";
import SubmissionsView from "./SubmissionsView";
import FormShare from "./FormShare";

interface FormBuilderProps {
  formId?: number;
  ownerId: string;
}

const FormBuilder: React.FC<FormBuilderProps> = ({ formId, ownerId }) => {
  const { form, loading, error, loadForm, createForm, saveForm } =
    useFormBuilder();

  const [activeTab, setActiveTab] = useState("structure");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  // Load form on component mount if formId is provided
  useEffect(() => {
    if (formId) {
      loadForm(formId);
    }
  }, [formId, loadForm]);

  // Update local state when form changes
  useEffect(() => {
    if (form) {
      setTitle(form.title);
      setDescription(form.description || "");
    }
  }, [form]);

  // Create a new form if no formId is provided
  useEffect(() => {
    if (!formId && !form) {
      createForm("New Form", ownerId);
    }
  }, [formId, form, ownerId, createForm]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  };

  const handleDescriptionChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    setDescription(e.target.value);
  };

  const handleSave = async () => {
    // Update form with local state
    if (form) {
      form.title = title;
      form.description = description;

      const success = await saveForm();

      if (success) {
        toast.success("Form saved");
      } else {
        toast.error("Failed to save form. Please try again.");
      }
    }
  };

  if (loading && !form) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-lg font-medium">Loading...</h2>
          <p className="text-sm text-gray-500">
            Please wait while we load the form builder
          </p>
        </div>
      </div>
    );
  }

  if (error && !form) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-lg font-medium text-red-600">Error</h2>
          <p className="text-sm text-gray-500">{error}</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() =>
              formId ? loadForm(formId) : createForm("New Form", ownerId)
            }
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Form Builder</h1>
          <p className="text-sm text-gray-500">
            {form?.updatedAt
              ? `Last saved: ${new Date(form.updatedAt).toLocaleString()}`
              : "Not saved yet"}
          </p>
        </div>

        <Button onClick={handleSave} disabled={loading}>
          <Save className="mr-2 h-4 w-4" />
          Save
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Form Details</CardTitle>
          <CardDescription>Basic information about your form</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={handleTitleChange}
                placeholder="Enter form title"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={handleDescriptionChange}
                placeholder="Enter form description"
                rows={3}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="structure">
            <Layers className="mr-2 h-4 w-4" />
            Structure
          </TabsTrigger>
          <TabsTrigger value="validation">
            <Settings className="mr-2 h-4 w-4" />
            Validation Rules
          </TabsTrigger>
          <TabsTrigger value="logic">
            <List className="mr-2 h-4 w-4" />
            Conditional Logic
          </TabsTrigger>
          <TabsTrigger value="preview">
            <Eye className="mr-2 h-4 w-4" />
            Preview
          </TabsTrigger>
          <TabsTrigger value="submissions">
            <Database className="mr-2 h-4 w-4" />
            Submissions
          </TabsTrigger>
          <TabsTrigger value="share">
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </TabsTrigger>
        </TabsList>

        <TabsContent value="structure">
          {form && <PagesList form={form as any} />}
        </TabsContent>

        <TabsContent value="validation">
          {form && <ValidationRulesEditor form={form as any} />}
        </TabsContent>

        <TabsContent value="logic">
          {form && <ConditionalLogicEditor form={form as any} />}
        </TabsContent>

        <TabsContent value="preview">
          <div className="mb-4">
            <Card>
              <CardHeader>
                <CardTitle>Form Preview</CardTitle>
                <CardDescription>
                  Preview how your form will appear to users
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
          {form && (
            <FormRenderer
              form={form as any}
              onSubmit={(data) => {
                toast.success("Form Submitted (Preview)");
                console.log("Preview form data:", data);
              }}
            />
          )}
        </TabsContent>

        <TabsContent value="submissions">
          {form && (
            <SubmissionsView formId={form.id.toString()} form={form as any} />
          )}
        </TabsContent>

        <TabsContent value="share">
          {form && (
            <FormShare formId={form.id.toString()} formTitle={form.title} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FormBuilder;
