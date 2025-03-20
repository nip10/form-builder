"use client";

import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { Button } from "@repo/ui/components/ui/button";
import { Card, CardContent } from "@repo/ui/components/ui/card";
import { Tabs, TabsContent } from "@repo/ui/components/ui/tabs";
import { toast } from "@repo/ui/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { formSchema } from "@/lib/schemas/form-schema";
import FormStep from "./steps/form-step";
import GroupsStep from "./steps/groups-step";
import PagesStep from "./steps/pages-step";
import ElementsStep from "./steps/elements-step";
import ReviewStep from "./steps/review-step";
import StepIndicator from "./step-indicator";
import type { Dictionary } from "@repo/internationalization";
// Define the form data type based on our schema
export type FormBuilderData = z.infer<typeof formSchema>;

export type Step = "form" | "groups" | "pages" | "elements" | "review";

const steps: { id: Step; label: string }[] = [
  { id: "form", label: "Form" },
  { id: "groups", label: "Groups" },
  { id: "pages", label: "Pages" },
  { id: "elements", label: "Elements" },
  { id: "review", label: "Review" },
];

export default function FormBuilder({ dictionary }: { dictionary: Dictionary }) {
  const [currentStep, setCurrentStep] = useState<Step>("form");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  // Initialize form with React Hook Form and Zod validation
  const methods = useForm<FormBuilderData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      form: {
        title: "",
        description: "",
        status: "draft",
      },
      groups: [],
      pages: [],
      elements: [],
    },
    mode: "onChange",
  });

  const { handleSubmit, trigger, watch } = methods;
  const formData = watch();

  // Handle form submission
  const onSubmit = async (data: FormBuilderData) => {
    setIsSubmitting(true);

    try {
      // Send the data to our API endpoint
      const response = await fetch("/api/forms/builder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        // Show more detailed error if available
        let errorMessage = result.error || "Form creation failed";
        if (result.details) {
          errorMessage += `: ${result.details}`;
        }
        throw new Error(errorMessage);
      }

      toast({
        title: "Success!",
        description: "Form created successfully.",
        variant: "default",
      });

      // Redirect to the form view page after a short delay
      if (result.form?.id) {
        setTimeout(() => {
          router.push(`/form/${result.form.id}`);
        }, 1500);
      }
    } catch (error) {
      console.error("Error creating form:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create form",
        variant: "destructive",
        duration: 6000, // Show error for longer
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Validate the current step before proceeding
  const handleNext = async () => {
    // Only validate the current step fields
    let fieldsToValidate: string[] = [];

    switch (currentStep) {
      case "form":
        fieldsToValidate = ["form"];
        break;
      case "groups":
        fieldsToValidate = ["groups"];
        break;
      case "pages":
        fieldsToValidate = ["pages"];
        break;
      case "elements":
        fieldsToValidate = ["elements"];
        break;
      case "review":
        // No validation needed on review page
        break;
    }

    const isStepValid = await trigger(fieldsToValidate as any);

    if (isStepValid) {
      const currentIndex = steps.findIndex((step) => step.id === currentStep);
      const nextStep = steps[currentIndex + 1];
      if (nextStep) {
        setCurrentStep(nextStep.id);
      }
    } else {
      // Show toast notification for validation errors
      toast({
        title: "Validation Error",
        description: "Please fix the errors before proceeding.",
        variant: "destructive",
      });
    }
  };

  // Navigate to the previous step
  const handlePrevious = () => {
    const currentIndex = steps.findIndex((step) => step.id === currentStep);
    const prevStep = steps[currentIndex - 1];
    if (prevStep) {
      setCurrentStep(prevStep.id);
    }
  };

  // Navigate to a specific step
  const goToStep = (stepId: Step) => {
    setCurrentStep(stepId);
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardContent className="pt-6">
            <StepIndicator
              steps={steps}
              currentStep={currentStep}
              goToStep={(stepId: Step) => {
                goToStep(stepId);
              }}
              formData={formData}
            />

            <div className="mt-8">
              <Tabs value={currentStep} onValueChange={(value) => setCurrentStep(value as Step)}>
                <TabsContent value="form">
                  <FormStep dictionary={dictionary} />
                </TabsContent>
                <TabsContent value="groups">
                  <GroupsStep dictionary={dictionary} />
                </TabsContent>
                <TabsContent value="pages">
                  <PagesStep dictionary={dictionary} />
                </TabsContent>
                <TabsContent value="elements">
                  <ElementsStep dictionary={dictionary} />
                </TabsContent>
                <TabsContent value="review">
                  <ReviewStep dictionary={dictionary} />
                </TabsContent>
              </Tabs>
            </div>

            <div className="flex justify-between mt-8">
              {currentStep !== "form" && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={isSubmitting}
                >
                  Previous
                </Button>
              )}

              {currentStep === "review" ? (
                <Button type="submit" disabled={isSubmitting} className="ml-auto">
                  {isSubmitting ? "Creating..." : "Create Form"}
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={isSubmitting}
                  className="ml-auto"
                >
                  Next
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </form>
    </FormProvider>
  );
}
