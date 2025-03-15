"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, Trash2, Loader2 } from "lucide-react";
import { FormBuilderProvider } from "@/contexts/FormBuilderContext";
import FormBuilder from "@/components/FormBuilder";
import { toast, Toaster } from "sonner";

interface Form {
  _id: string;
  title: string;
  description: string;
  created_at: string;
  updated_at: string;
  active: boolean;
  version: number;
}

export default function HomePage() {
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFormId, setSelectedFormId] = useState<string | null>(null);
  const [newFormTitle, setNewFormTitle] = useState("");
  const [isCreatingForm, setIsCreatingForm] = useState(false);

  // Mock user ID (would typically come from auth)
  const userId = "user123";

  // Fetch forms on component mount
  useEffect(() => {
    fetchForms();
  }, []);

  const fetchForms = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/forms?ownerId=${userId}`);

      if (!response.ok) {
        throw new Error("Failed to fetch forms");
      }

      const data = await response.json();
      setForms(data.forms || []);
    } catch (err: any) {
      setError(err.message || "Error fetching forms");
      console.error("Error fetching forms:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateForm = async () => {
    if (!newFormTitle.trim()) {
      toast.error("Form title is required");
      return;
    }

    try {
      setIsCreatingForm(true);

      const response = await fetch("/api/forms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: newFormTitle,
          owner_id: userId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create form");
      }

      const data = await response.json();

      toast.success("Form created successfully");

      // Add new form to the list
      setForms([...forms, data.form]);

      // Select the new form
      setSelectedFormId(data.form._id);

      // Reset form
      setNewFormTitle("");
    } catch (err: any) {
      toast.error(err.message || "Error creating form");
      console.error("Error creating form:", err);
    } finally {
      setIsCreatingForm(false);
    }
  };

  const handleDeleteForm = async (formId: string) => {
    if (
      confirm(
        "Are you sure you want to delete this form? This action cannot be undone."
      )
    ) {
      try {
        const response = await fetch(`/api/forms/${formId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          throw new Error("Failed to delete form");
        }

        toast.success("Form deleted successfully");

        // Remove the deleted form from the list
        setForms(forms.filter((form) => form._id !== formId));

        // If the deleted form was selected, unselect it
        if (selectedFormId === formId) {
          setSelectedFormId(null);
        }
      } catch (err: any) {
        toast.error(err.message || "Error deleting form");
        console.error("Error deleting form:", err);
      }
    }
  };

  return (
    <main className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Form Builder</h1>

        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Form
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Form</DialogTitle>
              <DialogDescription>
                Enter a title for your new form
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="form-title">Form Title</Label>
                <Input
                  id="form-title"
                  value={newFormTitle}
                  onChange={(e) => setNewFormTitle(e.target.value)}
                  placeholder="Enter form title"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setNewFormTitle("")}>
                Cancel
              </Button>
              <Button onClick={handleCreateForm} disabled={isCreatingForm}>
                {isCreatingForm && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create Form
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Your Forms</CardTitle>
              <CardDescription>
                Select a form to edit or create a new one
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center p-4">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : error ? (
                <div className="text-center p-4 text-red-500">
                  <p>{error}</p>
                  <Button
                    variant="outline"
                    className="mt-2"
                    onClick={fetchForms}
                  >
                    Try Again
                  </Button>
                </div>
              ) : forms.length === 0 ? (
                <div className="text-center p-4 text-gray-500">
                  <p>No forms found. Create your first form to get started.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {forms.map((form) => (
                    <div
                      key={form._id}
                      className={`p-3 rounded flex justify-between items-center cursor-pointer hover:bg-gray-100 ${
                        selectedFormId === form._id ? "bg-gray-100" : ""
                      }`}
                      onClick={() => setSelectedFormId(form._id)}
                    >
                      <div>
                        <h3 className="font-medium">{form.title}</h3>
                        <p className="text-xs text-gray-500">
                          Last updated:{" "}
                          {new Date(form.updated_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteForm(form._id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    New Form
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Form</DialogTitle>
                    <DialogDescription>
                      Enter a title for your new form
                    </DialogDescription>
                  </DialogHeader>

                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="form-title-2">Form Title</Label>
                      <Input
                        id="form-title-2"
                        value={newFormTitle}
                        onChange={(e) => setNewFormTitle(e.target.value)}
                        placeholder="Enter form title"
                      />
                    </div>
                  </div>

                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setNewFormTitle("")}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateForm}
                      disabled={isCreatingForm}
                    >
                      {isCreatingForm && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Create Form
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardFooter>
          </Card>
        </div>

        <div className="lg:col-span-9">
          {selectedFormId ? (
            <FormBuilderProvider>
              <FormBuilder formId={selectedFormId} ownerId={userId} />
            </FormBuilderProvider>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center p-12">
                  <h2 className="text-xl font-semibold mb-2">
                    No Form Selected
                  </h2>
                  <p className="text-gray-500 mb-6">
                    Select a form from the sidebar or create a new one to get
                    started.
                  </p>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Create New Form
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create New Form</DialogTitle>
                        <DialogDescription>
                          Enter a title for your new form
                        </DialogDescription>
                      </DialogHeader>

                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="form-title-3">Form Title</Label>
                          <Input
                            id="form-title-3"
                            value={newFormTitle}
                            onChange={(e) => setNewFormTitle(e.target.value)}
                            placeholder="Enter form title"
                          />
                        </div>
                      </div>

                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setNewFormTitle("")}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleCreateForm}
                          disabled={isCreatingForm}
                        >
                          {isCreatingForm && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          Create Form
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      <Toaster />
    </main>
  );
}
