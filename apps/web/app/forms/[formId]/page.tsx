"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@repo/ui/components/ui/alert";
import FormViewer from "./components/form-viewer";
import { FormWithRelations } from "@/lib/repositories/form-repository";

const FormViewPage = () => {
  const { formId } = useParams();
  const [form, setForm] = useState<FormWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchForm = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/forms/${formId}?populate=true`);

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Form not found");
          }
          throw new Error("Failed to load form");
        }

        const data = (await response.json()) as { form: FormWithRelations };
        setForm(data.form);
      } catch (err: any) {
        setError(err.message || "Error loading form");
        console.error("Error loading form:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchForm();
  }, [formId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading form...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="max-w-2xl mx-auto my-8">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!form) {
    return (
      <Alert variant="destructive" className="max-w-2xl mx-auto my-8">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Form Not Found</AlertTitle>
        <AlertDescription>The requested form could not be found.</AlertDescription>
      </Alert>
    );
  }

  return (
    <main className="h-screen flex flex-col">
      <div className="border-b p-4">
        <h1 className="text-2xl font-bold">{form.title}</h1>
        <p className="text-muted-foreground">{form.description}</p>
      </div>
      <FormViewer formData={form} />
    </main>
  );
};

export default FormViewPage;
