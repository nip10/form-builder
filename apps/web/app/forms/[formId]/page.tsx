"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import FormRenderer from "@/components/FormRenderer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FormWithValidations } from "@/types/form";

const FormViewPage = () => {
  const router = useRouter();
  const { formId } = useParams();

  const [form, setForm] = useState<FormWithValidations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

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

        const data = await response.json();
        setForm(data.form as FormWithValidations);
      } catch (err: any) {
        setError(err.message || "Error loading form");
        console.error("Error loading form:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchForm();
  }, [formId]);

  const handleSubmit = async (data: Record<string, any>) => {
    try {
      setError(null);

      const response = await fetch(`/api/forms/${formId}/submissions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data,
          completed: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();

        if (errorData.validationErrors) {
          // Handle validation errors
          throw new Error("Please fix the validation errors and try again");
        }

        throw new Error("Failed to submit form");
      }

      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Error submitting form");
      console.error("Error submitting form:", err);
    }
  };

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
        <AlertDescription>
          The requested form could not be found.
        </AlertDescription>
      </Alert>
    );
  }

  if (submitted) {
    return (
      <Card className="max-w-2xl mx-auto my-8">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center p-6 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Form Submitted</h2>
            <p className="text-gray-600 mb-6">
              Thank you for your submission. Your response has been recorded.
            </p>
            <Button onClick={() => router.push("/")}>Return Home</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="container py-8">
      <FormRenderer form={form} onSubmit={handleSubmit} />
    </div>
  );
};

export default FormViewPage;
